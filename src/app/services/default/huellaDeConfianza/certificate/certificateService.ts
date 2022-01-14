// @import_dependencies_node Import libraries
import path from "path";
import moment from 'moment'
import { Base64 } from 'js-base64';
import { host, public_dir, attached } from "@scnode_core/config/globals";
// @end

// @import config
import { customs } from '@scnode_core/config/globals'
// @end

// @import services
import { userService } from '@scnode_app/services/default/admin/user/userService';
import { courseSchedulingService } from '@scnode_app/services/default/admin/course/courseSchedulingService';
import { courseSchedulingDetailsService } from '@scnode_app/services/default/admin/course/courseSchedulingDetailsService';
import { certificateQueueService } from '@scnode_app/services/default/admin/certificateQueue/certificateQueueService';
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { certificate_setup, program_type_collection, program_type_abbr } from '@scnode_core/config/globals';
import { queryUtility } from '@scnode_core/utilities/queryUtility';
import { fileUtility } from '@scnode_core/utilities/fileUtility'
// @end

// @import models
import { CertificateQueue } from '@scnode_app/models';
// @end

// @import types
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes'
import { IQueryUserToCertificate, ICertificate, IQueryCertificate, ICertificatePreview, IGenerateCertificatePdf } from '@scnode_app/types/default/admin/certificate/certificateTypes';
import { generalUtility } from '@scnode_core/utilities/generalUtility';
// @end

class CertificateService {

  private default_certificate_path = 'certifications'

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
      console.log("Certifcate for username: " + params.userId);

      //#region  querying data for user to Certificate, param: username
      let respDataUser: any = await userService.findBy({
        query: QueryValues.ONE,
        where: [{ field: '_id', value: params.userId }]
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
      // console.log('-------------------');
      // console.log(respCourse);
      // console.log('-------------------');
      // console.log(respCourseDetails);
      // console.log('-------------------');

      if (respCourse.status == 'error') {
        return responseUtility.buildResponseFailed('json', null,
          { error_key: { key: 'program.not_found' } })
      }

      if (respCourseDetails.status == 'error') {
        return responseUtility.buildResponseFailed('json', null,
          { error_key: { key: 'program.not_found' } })
      }
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
        field_dato_1 = 'Asistió y aprobó el curso';
        field_asistio = 'Asistió al curso';
        field_template = 'CP00000001';
      }
      if (programType.abbr === program_type_abbr.programa || programType.abbr === program_type_abbr.programa_auditor) {
        field_dato_1 = 'Asistió y aprobó el programa';
        field_asistio = 'Asistió al programa';

        // Listado de Módulos (cursos) que comprende el programa
        respCourseDetails.schedulings.forEach(element => {
          field_listado_cursos += element.course.name + '<br/>';
        });

        field_template = 'CP00000002';
      }
      if (programType.abbr === program_type_abbr.diplomado || programType.abbr === program_type_abbr.diplomado_auditor) {
        field_dato_1 = 'Asistió y aprobó el diplomado';
        field_asistio = 'Asistió al diplomado';
        field_template = 'CP00000002';
      }

      console.log('....................................');
      console.log('Certificado para ' + respDataUser.user.profile.first_name + " " + respDataUser.user.profile.last_name);

      // 3. Estatus de estudiante en Moodle
      // - Asistencias
      // - Entregas de actividades completas

      //#endregion


      //#region Build the certificate Parameters
      const timeElapsed = Date.now();
      const currentDate = new Date(timeElapsed);

      let certificateParams: ICertificate = {
        modulo: field_template,
        numero_certificado: fielf_numero_certificado,
        correo: respDataUser.user.email,
        documento: respDataUser.user.profile.doc_type + " " + respDataUser.user.profile.doc_number,
        nombre: respDataUser.user.profile.first_name + " " + respDataUser.user.profile.last_name,
        asistio: field_asistio,
        certificado: (respCourse.scheduling.certificate) ? respCourse.scheduling.certificate : respCourse.scheduling.program.name,
        certificado_ingles: respCourse.scheduling.english_certificate,
        alcance: respCourse.scheduling.scope,
        alcance_ingles: respCourse.scheduling.scope,
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

      //#region Request to Create Certificate

      let respToken: any = await this.login();

      if (respToken.status == 'error') {
        return responseUtility.buildResponseFailed('json', null,
          { error_key: { key: 'certificate.login_invalid' } })
      }

      var tokenHC = respToken.token;
      console.log("get Token: " + tokenHC);

      let responseCertQueueOnError: any = await certificateQueueService.insertOrUpdate({
        id: params.certificateQueueId,
        status: 'In-process',//QueueStatus.IN_PROCESS,
        message: ''
      });

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

        let responseCertQueueOnError: any = await certificateQueueService.insertOrUpdate({
          id: params.certificateQueueId,
          status: 'Error',//QueueStatus.ERROR,
          certificateModule: field_template,
          certificateType: '',
          message: respHuella.resultado
        });

        return responseUtility.buildResponseFailed('json', null,
          { error_key: { key: 'certificate.generation', params: { error: respHuella.resultado } } });
      }
      //#endregion
      //update certificatQueue status

      let responseCertQueue: any = await certificateQueueService.insertOrUpdate({
        id: params.certificateQueueId,
        status: 'Requested',// 'Complete',//QueueStatus.COMPLETE,
        message: 'Certificado generado.',
        certificateModule: field_template,
        certificateType: '',
        certificate: {
          hash: respHuella.resultado.certificado,
          url: respHuella.resultado.url
        }
      });

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

  public previewCertificate = async (params: ICertificatePreview) => {
    try {
      console.log("Params: ");
      console.log(params);

      // params.format:
      // Imagen PNG: 1
      // PDF: 2
      const detailParams = {
        id: params.hash,
        fr: params.format,
        pl: params.template
      }
      const respToken: any = await this.login();

      if (respToken.status == 'error') {
        return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'certificate.login_invalid' } })
      }

      const tokenHC = respToken.token;

      // Build request for GetAllTemplate
      const respHuella: any = await queryUtility.query({
        method: 'get',
        url: certificate_setup.endpoint.certificate_detail,
        api: 'huellaDeConfianza',
        headers: { Authorization: tokenHC },
        params: detailParams
      });
      console.log('¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨');
      console.log(respHuella.estado);
      console.log('¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨');
      if (respHuella.estado == 'Error' || respHuella.status === 'error') {
        return responseUtility.buildResponseFailed('json', null,
          {
            error_key: { key: 'certificate.generation' }
          })
      }

      if (respHuella.resultado === "") {
        console.log("Resp from Huella: ");
        console.log(respHuella);
        return responseUtility.buildResponseFailed('json', null,
          {
            error_key: { key: 'certificate.preview' }
          })
      }

      //      return responseUtility.buildResponseFailed('json')

      console.log("update register on certificate queue:");

      if (params.updateCertificate && params.format) {
        let updateData = null
        if (params.format.toString() === "1") { // Si el format es 1 (PNG) guardo en base de datos el base 64
          const time = new Date().getTime()
          const resultPng: any = await this.generateCertificateFromBase64({
            certificate: respHuella.resultado,
            to_file: {
              file: {
                name: `${params.hash}_${time}.png`,
              },
              path: this.default_certificate_path,
            }
          })
          if (resultPng.status === 'success') {
            updateData = {
              $set: {
                "certificate.imagePath": resultPng.filename,
                "status": 'Complete'
              }
            }
          }
        } else if (params.format.toString() === "2") { // Si el formato es 2 (PDF) guardo el documento en el server y actualizo base de datos
          const time = new Date().getTime()
          const resultPdf: any = await this.generateCertificateFromBase64({
            certificate: respHuella.resultado,
            to_file: {
              file: {
                name: `${params.hash}_${time}.pdf`,
              },
              path: this.default_certificate_path,
            }
          })
          if (resultPdf.status === 'success') {
            updateData = {
              $set: {
                "certificate.pdfPath": resultPdf.filename,
                "status": 'Complete'
              }
            }
          }
        }
        if (updateData) {
          await CertificateQueue.findByIdAndUpdate(params.certificate_queue, updateData, { useFindAndModify: false, new: true })
        }
      }

      const certificate = await CertificateQueue.findOne({ _id: params.certificate_queue })

      // Get Certificate Detail
      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          tokenHC: tokenHC,
          preview: (params.showPreviewBase64 === true) ? respHuella.resultado : undefined,
          certificate: {
            url: certificate?.certificate?.url,
            imagePath: certificate?.certificate?.imagePath ? this.certificateUrl(certificate?.certificate.imagePath) : null,
            pdfPath: certificate?.certificate?.pdfPath ? this.certificateUrl(certificate?.certificate.pdfPath) : null,
          }
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

  private generateCertificateFromBase64 = async (params: IGenerateCertificatePdf) => {
    let driver = attached['driver'];
    let attached_config = attached[driver];

    const upload_config_base_path = (attached_config.base_path) ? attached_config.base_path : 'uploads'
    let base_path = path.resolve(`./${public_dir}/${upload_config_base_path}`)
    if (attached_config.base_path_type === "absolute") {
      base_path = upload_config_base_path
    }

    const path_upload = (params.to_file.path && params.to_file.path !== "") ? `pdfs/${params.to_file.path}/` : "pdfs/";

    const full_path_file = `${base_path}/${path_upload}${params.to_file.file.name}`;
    const public_path_file = `${host}/uploads/${path_upload}${params.to_file.file.name}`;

    // Creando la estructura de carpetas necesaria para cargar el archivo
    await fileUtility.createDirRecursive(full_path_file);

    const fileExists = await fileUtility.fileExists(full_path_file)
    if (fileExists) {
      const remove = await fileUtility.removeFileSync(full_path_file)
    }

    const bin = Base64.atob(params.certificate);

    try {
      const result = await fileUtility.writeFileSync(full_path_file, bin, 'binary')
      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          path: public_path_file,
          filename: params.to_file.file.name
        }
      })
    } catch (e) {
      return responseUtility.buildResponseFailed('json', null)
    }
  }

  /**
   * Metodo que convierte el valor del cover de un banner a la URL donde se aloja el recurso
   * @param {config} Objeto con data del Banner
   */
  public certificateUrl = (item) => {
    return item && item !== ''
      ? `${customs['uploads']}/pdfs/${this.default_certificate_path}/${item}`
      : null
  }

}

export const certificateService = new CertificateService();
export { CertificateService as DefaultHuellaDeConfianzaCertificateCertificateService };
