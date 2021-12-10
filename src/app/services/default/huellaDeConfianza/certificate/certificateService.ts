// @import_dependencies_node Import libraries
import moment from 'moment'
// @end

// @import services
import { userService } from '@scnode_app/services/default/admin/user/userService';
import { courseSchedulingService } from '@scnode_app/services/default/admin/course/courseSchedulingService';
import { courseSchedulingDetailsService } from '@scnode_app/services/default/admin/course/courseSchedulingDetailsService';
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { certificate_setup, program_type_collection, program_type_abbr } from '@scnode_core/config/globals';
import { queryUtility } from '@scnode_core/utilities/queryUtility';
// @end

// @import models
// @end

// @import types
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes'
import { IQueryUserToCertificate, ICertificate, IQueryCertificate } from '@scnode_app/types/default/admin/certificate/certificateTypes';
import { generalUtility } from '@scnode_core/utilities/generalUtility';
import { UserType } from 'aws-sdk/clients/workdocs';
import { substring } from 'sequelize/types/lib/operators';
// @end

class CertificateService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor() { }

  public alltemplates = async (params: IQueryCertificate) => {

    try {

      let respToken: any = await this.login();

      if (respToken.status == 'error') {
        return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'certificate.login_invalid' } })
      }


      console.log("Token: ");
      var tokenHC = respToken.token;

      // Build request for GetAllTemplate
      let respHuella: any = await queryUtility.query({
        method: 'get',
        url: certificate_setup.endpoint.get_templates,
        api: 'huellaDeConfianza',
        headers: { Authorization: tokenHC }
      });

      if (respHuella.estado == 'Error') {
        console.log(respHuella);
        return responseUtility.buildResponseFailed('json', null,
          {
            error_key: { key: 'certificate.generation' }
          })
      }

      // Get All templates
      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          tokenHC: tokenHC,
          template: respHuella.resultado
        }
      });

    }

    catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }


  public setCertificate = async (params: IQueryUserToCertificate) => {

    try {
      console.log("Certifcate for username: " + params.username);

      //#region  querying data for user to Certificate, param: username
      let respDataUser: any = await userService.findBy({
        query: QueryValues.ONE,
        where: [{ field: 'profile.doc_number', value: params.username }]
      })

      // usuario no existe
      if (respDataUser.status === "error") return respDataUser

      //  course Scheduling Data
      let respCourse: any = await courseSchedulingService.findBy({
        query: QueryValues.ONE,
        where: [{ field: '_id', value: params.courseId }]
      });

      //  course Scheduling Details data
      let respCourseDetails: any = await courseSchedulingDetailsService.findBy({
        query: QueryValues.ALL,
        where: [{ field: 'course_scheduling', value: params.courseId }]
      });

      // console.log(" --- course Scheduling --- ");
      // console.log(respCourse);
      // console.log('\r\n');

      // console.log(" --- course Scheduling Details --- ");
      // console.log(respCourseDetails);
      // console.log('\r\n');

      // return responseUtility.buildResponseSuccess('json', null, {
      //   additional_parameters: {
      //     program: respCourse.scheduling,
      //     details: respCourseDetails.schedulings
      //   }
      // });

      if (respCourse.status == 'error') {
        return responseUtility.buildResponseFailed('json', null,
          { error_key: { key: 'program.not_found' } })
      }

      if (respCourseDetails.status == 'error') {
        return responseUtility.buildResponseFailed('json', null,
          { error_key: { key: 'program.not_found' } })
      }

      // return responseUtility.buildResponseSuccess('json', null, {
      //   additional_parameters: {
      //     tokenHC: tokenHC,
      //     userData: respDataUser
      //   }
      // });
      //#endregion


      //#region Validations to generate Certificate
      //schedulingStatus
      // 1. Estatus de Programa: se permite generar si está confirmado o ejecutado.
      console.log("Program Status --> " + respCourse.scheduling.schedulingStatus.name);
      if (respCourse.scheduling.schedulingStatus.name == 'Programado' || respCourse.scheduling.schedulingStatus.name == 'Cancelado') {
        return responseUtility.buildResponseFailed('json', null,
          { error_key: { key: 'certificate.requirements.program_status', params: { error: respCourse.scheduling.schedulingStatus.name } } });
      }

      // 2. Tipo de programa
      let programType = program_type_collection.find(element => element.abbr == respCourse.scheduling.program.code.substring(0, 2));
      console.log('Program:');
      console.log(programType);

      let field_dato_1 = '';
      let field_template = '';
      let field_asistio = '';
      let field_pais = respCourse.scheduling.country.name;
      let field_ciudad = (respCourse.scheduling.city != null) ? respCourse.scheduling.city.name : '';
      let field_listado_cursos = '';
      let field_consecutive = generalUtility.rand(1, 50).toString();
      let fielf_numero_certificado = respCourse.scheduling.metadata.service_id + '-' + field_consecutive.padStart(4, '0');

      let schedulingType = respCourse.scheduling.schedulingType;

      if (programType.abbr === program_type_abbr.curso || programType.abbr === program_type_abbr.curso_auditor) {
        field_dato_1 = 'Asistió y aprobó el curso ' + respCourse.scheduling.program.name;
        field_asistio = 'Asistió al curso';
        field_template = 'CP00000001';
      }
      if (programType.abbr === program_type_abbr.programa || programType.abbr === program_type_abbr.programa_auditor) {
        field_dato_1 = 'Asistió y aprobó el programa ' + respCourse.scheduling.program.name;
        field_asistio = 'Asistió al programa';

        // Listado de Módulos (cursos) que comprende el programa
        respCourseDetails.schedulings.forEach(element => {
          field_listado_cursos += element.course.name + '\r\n';
        });

        field_template = 'CP00000002';
      }
      if (programType.abbr === program_type_abbr.diplomado || programType.abbr === program_type_abbr.diplomado_auditor) {
        field_dato_1 = 'Asistió y aprobó el dipĺomado ' + respCourse.scheduling.program.name;
        field_asistio = 'Asistió al diplomado';
        field_template = 'CP00000002';
      }


      console.log('....................................');

      // 3. Estatus de estudiante en Moodle
      // - Asistencias
      // - Entregas de actividades completas

      //#endregion


      //#region Build the certificate Parameters
      const timeElapsed = Date.now();
      const currentDate = new Date(timeElapsed);

      console.log('Intensidad:');
      console.log(respCourse.scheduling.total_scheduling);

      let certificateParams: ICertificate = {
        modulo: field_template,
        numero_certificado: fielf_numero_certificado,
        correo: respDataUser.user.email,
        documento: respDataUser.user.profile.doc_type + " " + respDataUser.user.profile.doc_number,
        nombre: respDataUser.user.profile.first_name + " " + respDataUser.user.profile.last_name,
        asistio: field_asistio,
        certificado: respCourse.scheduling.program.name,
        intensidad: generalUtility.getDurationFormatedForCertificate(respCourse.scheduling.duration),
        listado_cursos: field_listado_cursos,
        ciudad: field_ciudad,
        pais: field_pais,
        fecha_certificado: currentDate,
        fecha_aprobacion: currentDate,
        fecha_ultima_modificacion: null,
        fecha_renovacion: null,
        fecha_vencimiento: null,
        fecha_impresion: currentDate,
        dato_1: field_dato_1,
        dato_2: moment(currentDate).locale('es').format('LL'),
      }
      //#endregion
      console.log("Certificate Params");
      console.log(certificateParams);

      //#region Request to Create Certificate

      let respToken: any = await this.login();

      if (respToken.status == 'error') {
        return responseUtility.buildResponseFailed('json', null,
          { error_key: { key: 'certificate.login_invalid' } })
      }

      console.log("Token: ");
      var tokenHC = respToken.token;

      // let respHuella = {
      //   info_program: {
      //     program: respCourse.scheduling,
      //     details: respCourseDetails.schedulings
      //   },
      //   params: certificateParams,
      //   resultado: "freeze",
      //   estado: "OK"
      // };

      // Build request for Create Certificate
      let respHuella: any = await queryUtility.query({
        method: 'post',
        url: certificate_setup.endpoint.create_certificate,
        api: 'huellaDeConfianza',
        headers: { Authorization: tokenHC },
        params: JSON.stringify(certificateParams)
      });

      if (respHuella.estado == 'Error') {
        console.log(respHuella);
        return responseUtility.buildResponseFailed('json', null,
          { error_key: { key: 'certificate.generation', params: { error: respHuella.resultado } } });
      }
      //#endregion
      // certificateConsecutive++;

      // Get All templates
      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          // info_program: {
          //   program: respCourse.scheduling,
          //   details: respCourseDetails.schedulings
          // },
          tokenHC: tokenHC,
          responseHC: respHuella.resultado,
          certificate: certificateParams
        }
      });

    }

    catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }


  private login = async () => {

    var endpoint = certificate_setup.endpoint.signin;
    console.log("get Token from Huella de Confianza...");

    let respHuella = await queryUtility.query({
      method: 'post',
      url: certificate_setup.endpoint.signin,
      api: 'huellaDeConfianza',
      params: JSON.stringify(certificate_setup.credentials)
    });

    // console.log(respHuella);

    if (respHuella.estado == "Error") {
      return responseUtility.buildResponseFailed('json', null,
        {
          error_key: { key: 'certificate.login_invalid', params: { name: respHuella.result } }
        })
    }

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        token: respHuella.result.accessToken
      }
    });

  }

}

export const certificateService = new CertificateService();
export { CertificateService as DefaultHuellaDeConfianzaCertificateCertificateService };
