// @import_dependencies_node Import libraries
import path from "path";
import moment from 'moment'
import { Base64 } from 'js-base64';
import { host, public_dir, attached } from "@scnode_core/config/globals";
const AdmZip = require("adm-zip");
// @end

// @import config
import { customs } from '@scnode_core/config/globals'
// @end

// @import services
import { userService } from '@scnode_app/services/default/admin/user/userService';
import { courseSchedulingService } from '@scnode_app/services/default/admin/course/courseSchedulingService';
import { courseSchedulingDetailsService } from '@scnode_app/services/default/admin/course/courseSchedulingDetailsService';
import { certificateQueueService } from '@scnode_app/services/default/admin/certificateQueue/certificateQueueService';
import { certificateLogsService } from "@scnode_app/services/default/admin/certificateQueue/certificateLogsService";
import { gradesService } from '@scnode_app/services/default/moodle/grades/gradesService'
import { completionstatusService } from '@scnode_app/services/default/admin/completionStatus/completionstatusService'
import { courseContentService } from '@scnode_app/services/default/moodle/course/courseContentService'

// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { certificate_setup, program_type_collection, program_type_abbr, certificate_template, certificate_type } from '@scnode_core/config/globals';
import { queryUtility } from '@scnode_core/utilities/queryUtility';
import { fileUtility } from '@scnode_core/utilities/fileUtility'
// @end

// @import models
import { Enrollment, CertificateQueue } from '@scnode_app/models';
// @end

// @import types
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes'
import {
  IQueryUserToCertificate, ICertificate, IQueryCertificate,
  ICertificatePreview, IGenerateCertificatePdf, IGenerateZipCertifications,
  ICertificateCompletion, ISetCertificateParams, ILogoInformation, ISignatureInformation
} from '@scnode_app/types/default/admin/certificate/certificateTypes';
import { generalUtility } from '@scnode_core/utilities/generalUtility';
import { UpdateCACertificateParams } from "aws-sdk/clients/iot";
import { certificatePreviewProcessorProgram } from "client/tasks/certificateProcessor/certificatePreviewProcessorProgram";
import { bool } from "aws-sdk/clients/signer";
// @end

class CertificateService {

  private default_certificate_path = 'certifications'
  public default_certificate_zip_path = 'certifications'
  private selectActivitiesTest = ['attendance', 'assign', 'quiz', 'course'];
  private default_logo_path = 'certificate/icons';
  private default_signature_path = 'certificate/signatures';
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
          { error_key: { key: 'certificate.generation' } })
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

  /**
  * Método que consulta la lista de estudiantes que aprueban por actividades y asistencia y que serán candidatos
  * a certificación.
  */
  public completion = async (filters: ICertificateCompletion) => {

    let count = 1
    let enrollmentRegisters = [];
    let listOfStudents = [];
    let schedulingMode = '';
    let isAuditorCerficateEnabled = false;
    let previewCertificateParams;
    let currentDate = new Date(Date.now());

    //#region query Filters
    const paging = (filters.pageNumber && filters.nPerPage) ? true : false
    const pageNumber = filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage = filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let select = 'id user courseID course_scheduling';
    if (filters.select) {
      select = filters.select
    }

    let where = {}

    if (filters.courseID) {
      where['courseID'] = filters.courseID
    }

    if (filters.without_certification && filters.course_scheduling) {
      const certifications = await CertificateQueue.find({
        courseId: filters.course_scheduling,
        status: { $in: ['New', 'In-process', 'Complete'] }
      })
        .select('id userId')

      const user_ids = certifications.reduce((accum, element) => {
        accum.push(element.userId)
        return accum
      }, [])
      if (user_ids.length > 0) {
        where['user'] = { $nin: user_ids }
      }
    }
    //#endregion query Filters
    try {

      //#region Información del curso
      let respCourse: any = await courseSchedulingService.findBy({
        query: QueryValues.ONE,
        where: [{ field: '_id', value: filters.course_scheduling }]
      });
      if (respCourse.status == 'error') {
        return responseUtility.buildResponseFailed('json', null,
          { error_key: { key: 'program.not_found' } })
      }

      //  course Scheduling Details data
      let respCourseDetails: any = await courseSchedulingDetailsService.findBy({
        query: QueryValues.ALL,
        where: [{ field: 'course_scheduling', value: filters.course_scheduling }]
      });

      // Estatus de Programa: se permite crear la cola de certificados si está confirmado o ejecutado.
      schedulingMode = respCourse.scheduling.schedulingMode.name;
      console.log("Program Status --> " + respCourse.scheduling.schedulingStatus.name);
      if (respCourse.scheduling.schedulingStatus.name == 'Programado' || respCourse.scheduling.schedulingStatus.name == 'Cancelado') {
        return responseUtility.buildResponseFailed('json', null,
          { error_key: { key: 'certificate.requirements.program_status', params: { error: respCourse.scheduling.schedulingStatus.name } } });
      }

      //#region Tipo de programa
      let programTypeName;
      const programType = this.getProgramTypeFromCode(respCourse.scheduling.program.code);
      // program_type_collection.find(element => element.abbr == respCourse.scheduling.program.code.substring(0, 2));

      if (programType.abbr === program_type_abbr.curso || programType.abbr === program_type_abbr.curso_auditor) {
        programTypeName = 'curso';
      }
      if (programType.abbr === program_type_abbr.programa || programType.abbr === program_type_abbr.programa_auditor) {
        programTypeName = 'programa';
      }
      if (programType.abbr === program_type_abbr.diplomado || programType.abbr === program_type_abbr.diplomado_auditor) {
        programTypeName = 'diplomado';
      }
      //#endregion Tipo de programa

      // console.log("---------------------\n\r" + 'El contenido del ' + programType);
      // console.log(respCourseDetails.schedulings);
      // console.log('_______________________________________________________');


      let mapping_listado_cursos;
      let mapping_listado_modulos_auditor = '';

      if (respCourseDetails.schedulings) {
        mapping_listado_cursos = 'El contenido del ' + programTypeName + ' comprendió: <br/>';
        mapping_listado_cursos += '<ul>'
        respCourseDetails.schedulings.forEach(element => {
          mapping_listado_cursos += `<li>${element.course.name} &#40;${generalUtility.getDurationFormatedForCertificate(element.duration)}&#41; </li>`
        });
        mapping_listado_cursos += '</ul>'
      }

      if (respCourse.scheduling.auditor_certificate) {
        isAuditorCerficateEnabled = true;
        // get modules need to process Second certificate
        console.log(`Módulos para Segundo Certificado: \"${respCourse.scheduling.auditor_certificate}\"`);
        respCourse.scheduling.auditor_modules.forEach(element => {
          console.log(`→ ${element.course.name}`);
        });

        let total_intensidad = 0;
        mapping_listado_modulos_auditor = 'El contenido del programa comprendió: <br/>';
        mapping_listado_modulos_auditor += '<ul>'
        respCourse.scheduling.auditor_modules.forEach(element => {
          total_intensidad += element.duration;
          mapping_listado_modulos_auditor += `<li>${element.course.name} &#40;${generalUtility.getDurationFormatedForCertificate(element.duration)}&#41; </li>`;
          //mapping_listado_cursos += `<li>${element.course.name} &#40;${generalUtility.getDurationFormatedForCertificate(element.duration)}&#41; </li>`

        });
        mapping_listado_modulos_auditor += '</ul>'
      }

      // let regionalName = respCourse.scheduling;
      // console.log("↓↓←←←←");
      // console.log(regionalName);
      // console.log("↓↓←←←←");

      previewCertificateParams = {
        certificado: (respCourse.scheduling.certificate) ? respCourse.scheduling.certificate : respCourse.scheduling.program.name,
        certificado_auditor: (respCourse.scheduling.auditor_certificate) ? respCourse.scheduling.auditor_certificate : null,
        intensidad: generalUtility.getDurationFormatedForCertificate(respCourse.scheduling.duration),
        listado_cursos: mapping_listado_cursos,
        listado_modulos_auditor: mapping_listado_modulos_auditor,
        regional: null, //respCourse.scheduling.regional.name,
        ciudad: (respCourse.scheduling.city != null) ? respCourse.scheduling.city.name : '',
        pais: respCourse.scheduling.country.name,
        fecha_certificado: currentDate,
        fecha_aprobacion: respCourse.scheduling.endDate,
        fecha_impresion: currentDate,
        dato_2: moment(respCourse.scheduling.endDate).locale('es').format('LL'),
      }

      //#endregion Información del curso

      enrollmentRegisters = await Enrollment.find(where)
        .select(select)
        .populate({ path: 'user', select: 'id email phoneNumber profile.first_name profile.last_name profile.doc_type profile.doc_number profile.regional profile.origen moodle_id' })
        .skip(paging ? (pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0) : null)
        .limit(paging ? nPerPage : null)
        .lean();

      console.log("Total de estudiantes: " + enrollmentRegisters.length);

      //#region Revisión de Progreso en Actividades para todo el curso
      console.log(`→→ Modalidad: ${schedulingMode.toLowerCase()}`);
      const respListOfActivitiesInModulesTest: any = await courseContentService.moduleList({ courseID: filters.courseID, moduleType: this.selectActivitiesTest });

      // console.log("««««««««««««««« »»»»»»»»»»»»»»»»»»»»»»»");
      // console.log("List of Activities in Modules: ");
      // console.dir(respListOfActivitiesInModulesTest, {depth: null, colors: true});
      // console.log("««««««««««««««« »»»»»»»»»»»»»»»»»»»»»»»");

      if (respListOfActivitiesInModulesTest.status == "error") {
        return responseUtility.buildResponseFailed('json', null,
          { error_key: { key: 'certificate.requirements.program_status', params: { error: respCourse.scheduling.schedulingStatus.name } } });
      }

      if (respCourse.scheduling.auditor_certificate) {
        isAuditorCerficateEnabled = true;
        // get modules need to process Second certificate
      }

      let progressListResult: any = await this.rulesForCompleteProgress(
        filters.courseID,
        this.selectActivitiesTest,
        schedulingMode.toLowerCase(),
        programTypeName,//null,
        respListOfActivitiesInModulesTest.courseModules,
        respCourseDetails.schedulings,
        isAuditorCerficateEnabled,
        respCourse.scheduling.auditor_modules,
        false
      );

      // double check if Auditor quiz is not enabled after review Moodle grades.
      isAuditorCerficateEnabled = (isAuditorCerficateEnabled && progressListResult.auditorQuizApplies) ? true : false;

      // console.log('→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→');
      // console.dir(progressListResult, { depth: null });
      // console.log('→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→');
      //listOfStudents.push(progressListResult);

      for await (const register of enrollmentRegisters) {

        register.count = count;

        console.log("~~~~~~~~~~~~~");
        console.log("Counter:" + count);

        if (register.user && register.user.profile) {
          register.user.profile.full_name = `${register.user.profile.first_name} ${register.user.profile.last_name}`;

          console.log('++++++++++++++++++++++++++');
          console.log(`Fetch grades for: ${register.user.moodle_id} - ${register.user.profile.full_name}`);
          //console.dir(register.user, { depth: null });
          console.log('++++++++++++++++++++++++++');

          let studentProgress = progressListResult.listOfStudentProgress.find(f => f.student.userData.userid == register.user.moodle_id);
          if (studentProgress) {
            console.log('──·─···─·──');
            console.dir(studentProgress.student.studentProgress, { depth: null });
            console.log('──·─···─·──');
            register.progress = studentProgress.student.studentProgress;
          }

          //#region Add certification to response
          if (filters.check_certification) {
            const certificate = await CertificateQueue.findOne({
              userId: register.user._id,
              courseId: register.course_scheduling,
              status: { $in: ['New', 'In-process', 'Requested', 'Complete'] }
            }).select('');

            register.certificate = certificate;
            if (register?.certificate?.certificate?.pdfPath) {
              register.certificate.certificate.pdfPath = certificateService.certificateUrl(register.certificate.certificate.pdfPath);
            }
            if (register?.certificate?.certificate?.imagePath) {
              register.certificate.certificate.imagePath = certificateService.certificateUrl(register.certificate.certificate.imagePath);
            }
          }

          if (register.attended_approved) {
            if (register.attended_approved == 'Asistió y aprobó' || register.attended_approved == 'Asistió') {
              register.progress.isEnabled = 1;
            }
            else
              register.progress.isEnabled = 0;
          }
          listOfStudents.push(register);
          count++
        }
        //#endregion Add certification to response

        // console.log('+++++++++++++++++++++++++');
        // console.log(register);
        // console.log('+++++++++++++++++++++++++\n');
      }
    }
    catch (e) {
      console.log(e.message);
      return responseUtility.buildResponseFailed('json', null,
        {
          error_key: 'grades.exception',
          additional_parameters: {
            process: 'completion()',
            error: e.message
          }
        });
    }

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        schedulingMode: schedulingMode,
        previewCertificateParams: previewCertificateParams,
        isAuditorCerficateEnabled: isAuditorCerficateEnabled,
        enrollment: [
          ...listOfStudents
        ],
        total_register: (paging) ? await Enrollment.find(where).countDocuments() : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    });

  }


  public rulesForCompletion = async (filters: ICertificateCompletion) => {

    let count = 1
    let isAuditorCerficateEnabled = false;

    //#region query Filters
    const paging = (filters.pageNumber && filters.nPerPage) ? true : false
    const pageNumber = filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage = filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let select = 'id user courseID course_scheduling';
    if (filters.select) {
      select = filters.select
    }

    let where = {}

    if (filters.courseID) {
      where['courseID'] = filters.courseID
    }

    if (filters.without_certification && filters.course_scheduling) {
      const certifications = await CertificateQueue.find({
        courseId: filters.course_scheduling,
        status: { $in: ['New', 'In-process', 'Complete'] }
      })
        .select('id userId')

      const user_ids = certifications.reduce((accum, element) => {
        accum.push(element.userId)
        return accum
      }, [])
      if (user_ids.length > 0) {
        where['user'] = { $nin: user_ids }
      }
    }
    //#endregion query Filters
    let enrollmentRegisters = [];
    let listOfStudents = [];
    let schedulingMode = '';
    try {

      //#region Información del curso
      let respCourse: any = await courseSchedulingService.findBy({
        query: QueryValues.ONE,
        where: [{ field: '_id', value: filters.course_scheduling }]
      });
      if (respCourse.status == 'error') {
        return responseUtility.buildResponseFailed('json', null,
          { error_key: { key: 'program.not_found' } })
      }

      //  course Scheduling Details data
      let respCourseDetails: any = await courseSchedulingDetailsService.findBy({
        query: QueryValues.ALL,
        where: [{ field: 'course_scheduling', value: filters.course_scheduling }]
      });

      // Estatus de Programa: se permite crear la cola de certificados si está confirmado o ejecutado.
      schedulingMode = respCourse.scheduling.schedulingMode.name;
      console.log("Program Status --> " + respCourse.scheduling.schedulingStatus.name);
      if (respCourse.scheduling.schedulingStatus.name == 'Programado' || respCourse.scheduling.schedulingStatus.name == 'Cancelado') {
        return responseUtility.buildResponseFailed('json', null,
          { error_key: { key: 'certificate.requirements.program_status', params: { error: respCourse.scheduling.schedulingStatus.name } } });
      }

      //#region Tipo de programa
      let programTypeName;
      const programType = this.getProgramTypeFromCode(respCourse.scheduling.program.code);

      if (programType) {
        if (programType.abbr === program_type_abbr.curso || programType.abbr === program_type_abbr.curso_auditor)
          programTypeName = 'curso';
        if (programType.abbr === program_type_abbr.programa || programType.abbr === program_type_abbr.programa_auditor)
          programTypeName = 'programa';
        if (programType.abbr === program_type_abbr.diplomado || programType.abbr === program_type_abbr.diplomado_auditor)
          programTypeName = 'diplomado';
      }

      //#endregion Tipo de programa

      // console.log("---------------------\n\r" + 'El contenido del ' + programType);
      // console.log(respCourseDetails.schedulings);
      // console.log('_______________________________________________________');

      if (respCourse.scheduling.auditor_certificate) {
        isAuditorCerficateEnabled = true;
        // get modules need to process Second certificate
        console.log(`Módulos para Segundo Certificado: \"${respCourse.scheduling.auditor_certificate}\"`);
        respCourse.scheduling.auditor_modules.forEach(element => {
          console.log(`→ ${element.course.name}`);
        });
      }

      //#endregion Información del curso

      enrollmentRegisters = await Enrollment.find(where)
        .select(select)
        .populate({ path: 'user', select: 'id email phoneNumber profile.first_name profile.last_name profile.doc_type profile.doc_number profile.regional profile.origen moodle_id' })
        .skip(paging ? (pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0) : null)
        .limit(paging ? nPerPage : null)
        .lean();

      console.log("Total de estudiantes: " + enrollmentRegisters.length);

      //#region Revisión de Progreso en Actividades para todo el curso
      console.log(`→→ Modalidad: ${schedulingMode.toLowerCase()}`);
      const respListOfActivitiesInModulesTest: any = await courseContentService.moduleList({ courseID: filters.courseID, moduleType: this.selectActivitiesTest });

      // console.log("««««««««««««««« »»»»»»»»»»»»»»»»»»»»»»»");
      // console.log("List of Activities in Modules: ");
      // console.dir(respListOfActivitiesInModulesTest, {depth: null, colors: true});
      // console.log("««««««««««««««« »»»»»»»»»»»»»»»»»»»»»»»");

      if (respListOfActivitiesInModulesTest.status == "error") {
        return responseUtility.buildResponseFailed('json', null,
          { error_key: { key: 'certificate.requirements.program_status', params: { error: respCourse.scheduling.schedulingStatus.name } } });
      }

      if (respCourse.scheduling.auditor_certificate) {
        isAuditorCerficateEnabled = true;
        // get modules need to process Second certificate
      }

      let progressListResult: any = await this.rulesForCompleteProgress(
        filters.courseID,
        this.selectActivitiesTest,
        schedulingMode.toLowerCase(),
        programTypeName,
        respListOfActivitiesInModulesTest.courseModules,
        respCourseDetails.schedulings,
        isAuditorCerficateEnabled,
        respCourse.scheduling.auditor_modules,
        false,
        filters.userMoodleID
      );

      // console.log('→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→');
      // console.dir(studentProgressList, { depth: null });
      // console.log('→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→');
      if (progressListResult)
        listOfStudents.push(progressListResult);
      else {
        return responseUtility.buildResponseFailed('json', null,
          {
            error_key: 'grades.exception',
            additional_parameters: {
              process: 'completion()',
              error: 'empty list'
            }
          });
      }


      //#region  Reglas para Certificado de Auditor


      //#endregion

    }
    catch (e) {
      console.log(e.message);
      return responseUtility.buildResponseFailed('json', null,
        {
          error_key: 'grades.exception',
          additional_parameters: {
            process: 'completion()',
            error: e.message
          }
        });
    }

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        schedulingMode: schedulingMode.toLowerCase(),
        isAuditorCerficateEnabled: isAuditorCerficateEnabled,
        completion: [
          ...listOfStudents
        ],
        total_register: (paging) ? await Enrollment.find(where).countDocuments() : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    });

  }

  /**
   *  SetCertificate: método para enviar request a Huella de Confianza para la creación de Certificado.-
   */

  public setCertificate = async (params: IQueryUserToCertificate) => {

    try {
      let logoDataArray: ILogoInformation[] = [];
      let signatureDataArray: ISignatureInformation[] = [];

      //#region  querying data for user to Certificate, param: username
      let respDataUser: any = await userService.findBy({
        query: QueryValues.ONE,
        where: [{ field: '_id', value: params.userId }]
      })
      if (respDataUser.user && respDataUser.user.profile) {
        respDataUser.user.profile.full_name = `${respDataUser.user.profile.first_name} ${respDataUser.user.profile.last_name}`
      }

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
      // console.log('--------respCourse----------');
      // console.log(respCourse);
      // console.log('-------------------');
      // console.log(respCourseDetails);
      // console.log('--------respCourseDetails----------');

      if (respCourse.status == 'error' || respCourseDetails.status == 'error') {
        return responseUtility.buildResponseFailed('json', null,
          { error_key: { key: 'program.not_found' } })
      }

      const respListOfActivitiesInModulesTest: any = await courseContentService.moduleList({ courseID: respCourse.scheduling.moodle_id, moduleType: this.selectActivitiesTest });
      //#endregion

      //#region Load Logos from CourseScheduling settings
      //#region Base Path
      let driver = attached['driver'];
      let attached_config = attached[driver];
      const upload_config_base_path = (attached_config.base_path) ? attached_config.base_path : 'uploads'

      let base_path = path.resolve(`./${public_dir}/${upload_config_base_path}`)
      if (attached_config.base_path_type === "absolute") {
        base_path = upload_config_base_path
      }
      //#endregion Base Path

      //#region Check for Logos and Signature
      console.log(`Check for Logos and Signature:`);

      let logoImage64_1 = this.encodeAdditionaImageForCertificate(base_path, respCourse.scheduling.path_certificate_icon_1);
      if (logoImage64_1) {
        logoDataArray.push({
          imageBase64: logoImage64_1
        });
      }

      let logoImage64_2 = this.encodeAdditionaImageForCertificate(base_path, respCourse.scheduling.path_certificate_icon_2);
      if (logoImage64_2) {
        logoDataArray.push({
          imageBase64: logoImage64_2
        });
      }

      let signatureImage64_1 = this.encodeAdditionaImageForCertificate(base_path, respCourse.scheduling.path_signature_1);
      if (signatureImage64_1) {
        signatureDataArray.push({
          imageBase64: signatureImage64_1,
          signatoryName: 'Primer firmante',
          signatoryPosition: 'Cargo 1er',
          signatoryCompanyName: 'Empresa 1'
        });
        console.log(`Signature : ${signatureDataArray[0].signatoryName}`);
      }

      let signatureImage64_2 = this.encodeAdditionaImageForCertificate(base_path, respCourse.scheduling.path_signature_2);
      if (signatureImage64_2) {
        signatureDataArray.push({
          imageBase64: signatureImage64_2,
          signatoryName: 'Segundo firmante',
          signatoryPosition: 'Cargo 2ndo',
          signatoryCompanyName: 'Empresa 2'
        });
        console.log(`Signature : ${signatureDataArray[1].signatoryName}`);
      }

      let signatureImage64_3 = this.encodeAdditionaImageForCertificate(base_path, respCourse.scheduling.path_signature_3);
      if (signatureImage64_3) {
        signatureDataArray.push({
          imageBase64: signatureImage64_3,
          signatoryName: 'Tercer firmante',
          signatoryPosition: 'Cargo 3er',
          signatoryCompanyName: 'Empresa 3'
        });
        console.log(`Signature : ${signatureDataArray[2].signatoryName}`);
      }
      //#endregion Check for Logos and Signature

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
      let programTypeName;
      const programType = this.getProgramTypeFromCode(respCourse.scheduling.program.code);

      //let programType = program_type_collection.find(element => element.abbr == respCourse.scheduling.program.code.substring(0, 2));
      let schedulingMode = respCourse.scheduling.schedulingMode.name;

      let isComplete = true;
      let mapping_dato_1 = '';
      let mapping_dato_13 = ''; // "Certifica" or "Certifican" text (singular/plural)
      let mapping_template = '';
      let mapping_intensidad = 0;
      let mapping_titulo_certificado = '';
      let mapping_pais = respCourse.scheduling.country.name;
      let mapping_ciudad = (respCourse.scheduling.city != null) ? respCourse.scheduling.city.name : '';
      let mapping_listado_cursos = '';
      let mapping_consecutive = generalUtility.rand(1, 50).toString(); // check
      let mapping_numero_certificado = respCourse.scheduling.metadata.service_id + '-' + mapping_consecutive.padStart(4, '0');

      let schedulingType = respCourse.scheduling.schedulingType;

      console.log('........................................................................................................');
      console.log('Certificado para ' + respDataUser.user.profile.full_name);
      console.log('........................................................................................................');

      // 3. Estatus de estudiante en Moodle
      // - Asistencias
      // - Entregas de actividades completas

      let reviewAuditorCerficateRules = false;
      let isAuditorCerficateByProgressEnabled = false;

      //#region Tipo de programa
      if (programType.abbr === program_type_abbr.curso || programType.abbr === program_type_abbr.curso_auditor) {
        programTypeName = 'curso';
        mapping_template = certificate_template.curso;
      }
      if (programType.abbr === program_type_abbr.programa || programType.abbr === program_type_abbr.programa_auditor) {
        programTypeName = 'programa';
        mapping_template = certificate_template.programa_diplomado;
      }
      if (programType.abbr === program_type_abbr.diplomado || programType.abbr === program_type_abbr.diplomado_auditor) {
        programTypeName = 'diplomado';
        mapping_template = certificate_template.programa_diplomado;
      }

      // applies for "interintitutional agreement"
      if (logoDataArray.length != 0) {
        console.log("Applies agreement:");

        //if (signatureDataArray.length != 0) {
        mapping_template = certificate_template.convenios;
        //}
        // else{
        //   mapping_template = certificate_template.convenio_doble_logo;
        // }
        mapping_dato_13 = "Certifican que"
      } else {
        console.log("NO agreement:");

        mapping_dato_13 = "Certifica que"
      }

      console.log("Choosen template: " + mapping_template);
      //#endregion Tipo de programa

      // console.log(programTypeName);
      // console.log("---------------------");
      // console.log(respDataUser);
      // console.log(respCourse);
      // console.log("---------------------");

      //#endregion Tipo de programa

      //#region  Reglas para Certificado de Auditor
      if (respCourse.scheduling.auditor_certificate) {
        reviewAuditorCerficateRules = true;
      }
      //#endregion  Reglas para Certificado de Auditor
      //#region ↓↓↓↓↓↓↓ Reglas para cualquier tipo de formación
      let studentProgressList: any = await this.rulesForCompleteProgress(
        respCourse.scheduling.moodle_id,
        this.selectActivitiesTest,
        schedulingMode.toLowerCase(),
        programTypeName,
        respListOfActivitiesInModulesTest.courseModules,
        respCourseDetails.schedulings,
        reviewAuditorCerficateRules,
        respCourse.scheduling.auditor_modules,
        true,
        respDataUser.user.moodle_id);

      // console.log('→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→');
      // console.dir(studentProgressList.listOfStudentProgress[0], { depth: null });
      // console.log('→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→');

      if (studentProgressList.listOfStudentProgress[0]) {
        console.log("Check rules for " + respCourse.scheduling.schedulingMode.name.toLowerCase());

        let progressData = studentProgressList.listOfStudentProgress[0].student.studentProgress;
        //#region Setting for VIRTUAL
        if (respCourse.scheduling.schedulingMode.name.toLowerCase() == 'virtual') {
          console.log('=====');
          console.log(progressData.attended_approved);

          isComplete = true;
          mapping_dato_1 = progressData.attended_approved;
          mapping_titulo_certificado = (respCourse.scheduling.certificate) ? respCourse.scheduling.certificate : respCourse.scheduling.program.name;

          console.log(mapping_titulo_certificado);

          if (respCourseDetails.schedulings) {
            mapping_listado_cursos = 'El contenido del ' + programTypeName + ' comprendió: <br/>';
            mapping_listado_cursos += '<ul>'
            respCourseDetails.schedulings.forEach(element => {
              mapping_listado_cursos += `<li>${element.course.name} &#40;${generalUtility.getDurationFormatedForCertificate(element.duration)}&#41; </li>`
            });
            mapping_listado_cursos += '</ul>'
          }
          mapping_intensidad = respCourse.scheduling.duration;
        }
        //#endregion Setting for VIRTUAL

        //#region Setting for ON SITE
        if (respCourse.scheduling.schedulingMode.name.toLowerCase() == 'presencial' ||
          respCourse.scheduling.schedulingMode.name.toLowerCase() == 'en linea') {


          if (progressData.status == 'ok') {
            isComplete = true;
            mapping_dato_1 = progressData.attended_approved;

            mapping_titulo_certificado = (respCourse.scheduling.certificate) ? respCourse.scheduling.certificate : respCourse.scheduling.program.name;
            //#region Listado de Módulos (cursos) que comprende el programa <li>

            if (respCourseDetails.schedulings) {
              mapping_listado_cursos = 'El contenido del ' + programTypeName + ' comprendió: <br/>';
              mapping_listado_cursos += '<ul>'
              respCourseDetails.schedulings.forEach(element => {
                mapping_listado_cursos += `<li>${element.course.name} &#40;${generalUtility.getDurationFormatedForCertificate(element.duration)}&#41; </li>`
              });
              mapping_listado_cursos += '</ul>'
            }
            mapping_intensidad = respCourse.scheduling.duration;
            //#endregion

          }
          else if (progressData.status == 'partial') {
            // Certificado Parcial
            let certificateName = (respCourse.scheduling.certificate) ? respCourse.scheduling.certificate : respCourse.scheduling.program.name;
            console.log('módulos aprobados:');
            for (const apprMod of progressData.approved_modules) {
              console.log(apprMod.name + ' - ' + generalUtility.getDurationFormatedForCertificate(apprMod.duration));
            }

            isComplete = false;
            //isAuditorCerficateEnabled = false; // deshabilita la solicitud de CertAuditor en caso que aplique

            if (logoDataArray.length != 0)
              mapping_template = certificate_template.parcial_convenios;
            else
              mapping_template = certificate_template.parcial;
            mapping_dato_1 = 'Asistió a los cursos de';
            mapping_titulo_certificado = 'CORRESPONDIENTE AL ' + certificateName + ', CUYA DURACIÓN TOTAL ES DE ' + generalUtility.getDurationFormatedForCertificate(respCourse.scheduling.duration).toUpperCase();

            //#region Listado de Módulos Aprobados (cursos) que comprende el programa <li>
            if (progressData.approved_modules) {

              let finalDuration = 0;
              //mapping_listado_cursos = 'Asistió a los cursos de<br/>';
              mapping_listado_cursos = '<ul>'
              progressData.approved_modules.forEach(element => {
                finalDuration += element.duration;
                mapping_listado_cursos += `<li>${element.name} &#40;${generalUtility.getDurationFormatedForCertificate(element.duration)}&#41; </li>`
                //mapping_listado_cursos += '<li>' + element.name + '%28' + generalUtility.getDurationFormatedForCertificate(element.duration) + '%29' + '</li>';
              });
              mapping_listado_cursos += '</ul>'
              mapping_intensidad = finalDuration;
            }
            //#endregion
          }

        }
        //#endregion Setting for ON SITE

        isAuditorCerficateByProgressEnabled = (progressData.auditor && studentProgressList.auditorQuizApplies) ? true : false;

        console.log('Progress for Student:');
        console.log(progressData);
        console.log("-->" + respDataUser.user.profile.full_name + " " + mapping_dato_1);
      }
      else {
        console.log('No hay datos de Estudiante para evaluar!')
        return responseUtility.buildResponseFailed('json')
      }
      //#endregion ↑↑↑↑↑↑ Reglas para cualquier tipo de formación


      //#endregion

      //#region Build the certificate Parameters
      const currentDate = new Date(Date.now());
      let certificateParamsArray: ISetCertificateParams[] = [];

      // Add first Certificate (academic)
      let certificateParams: ICertificate = {
        modulo: mapping_template,
        numero_certificado: mapping_numero_certificado,
        correo: respDataUser.user.email,
        documento: respDataUser.user.profile.doc_type + " " + respDataUser.user.profile.doc_number,
        nombre: respDataUser.user.profile.full_name.toUpperCase(),
        asistio: null,
        certificado: mapping_titulo_certificado, //(respCourse.scheduling.certificate) ? respCourse.scheduling.certificate : respCourse.scheduling.program.name,
        certificado_ingles: '', // respCourse.scheduling.english_certificate,
        alcance: '', //respCourse.scheduling.scope,
        alcance_ingles: '', //respCourse.scheduling.scope,
        intensidad: generalUtility.getDurationFormatedForCertificate(mapping_intensidad),
        listado_cursos: mapping_listado_cursos,
        regional: '',
        ciudad: mapping_ciudad,
        pais: mapping_pais,
        fecha_certificado: currentDate,
        fecha_aprobacion: respCourse.scheduling.endDate,
        fecha_ultima_modificacion: null,
        fecha_renovacion: null,
        fecha_vencimiento: null,
        fecha_impresion: currentDate,
        dato_1: mapping_dato_1,
        dato_2: moment(respCourse.scheduling.endDate).locale('es').format('LL'),
        // primer logo
        dato_3: (logoDataArray.length != 0 && logoDataArray[0]) ? logoDataArray[0].imageBase64 : null,
        // primera firma
        dato_4: (signatureDataArray.length != 0 && signatureDataArray[0]) ? signatureDataArray[0].imageBase64 : null,
        dato_5: (signatureDataArray.length != 0 && signatureDataArray[0]) ? signatureDataArray[0].signatoryName : null,
        dato_6: (signatureDataArray.length != 0 && signatureDataArray[0]) ? signatureDataArray[0].signatoryPosition : null,
        dato_7: (signatureDataArray.length != 0 && signatureDataArray[0]) ? signatureDataArray[0].signatoryCompanyName : null,

        // segundo logo
        dato_8: (logoDataArray.length != 0 && logoDataArray[1]) ? logoDataArray[1].imageBase64 : null,
        // segunda firma
        dato_9: (signatureDataArray.length != 0 && signatureDataArray[1]) ? signatureDataArray[1].imageBase64 : null,
        dato_10: (signatureDataArray.length != 0 && signatureDataArray[1]) ? signatureDataArray[1].signatoryName : null,
        dato_11: (signatureDataArray.length != 0 && signatureDataArray[1]) ? signatureDataArray[1].signatoryPosition : null,
        dato_12: (signatureDataArray.length != 0 && signatureDataArray[1]) ? signatureDataArray[1].signatoryCompanyName : null,

        dato_13: mapping_dato_13
      }
      certificateParamsArray.push({
        queueData: params,
        template: mapping_template,
        certificateType: certificate_type.academic,
        paramsHuella: certificateParams,
        programName: (respCourse.scheduling.certificate) ? respCourse.scheduling.certificate : respCourse.scheduling.program.name,
        isComplete: isComplete
      });
      console.log("[1]------------------------------------------");
      console.log("Set first Certificate: ");
      //console.log(certificateParams);
      console.log("[1]------------------------------------------");

      // Second certificate: auditor Certificate
      if (isAuditorCerficateByProgressEnabled) {
        // get modules need to process Second certificate
        isComplete = true;
        let mapping_listado_modulos_auditor = '';
        let total_intensidad = 0;
        mapping_listado_modulos_auditor = 'El contenido del programa comprendió: <br/>';
        mapping_listado_modulos_auditor += '<ul>'
        respCourse.scheduling.auditor_modules.forEach(element => {
          total_intensidad += element.duration;
          mapping_listado_modulos_auditor += `<li>${element.course.name} &#40;${generalUtility.getDurationFormatedForCertificate(element.duration)}&#41; </li>`;
        });
        mapping_listado_modulos_auditor += '</ul>'

        console.log(mapping_listado_modulos_auditor);

        let auditorCertificateParams: ICertificate = {
          modulo: mapping_template,
          numero_certificado: mapping_numero_certificado + '-A',
          correo: respDataUser.user.email,
          documento: respDataUser.user.profile.doc_type + " " + respDataUser.user.profile.doc_number,
          nombre: respDataUser.user.profile.full_name.toUpperCase(),
          asistio: null,
          certificado: respCourse.scheduling.auditor_certificate,
          certificado_ingles: '',
          alcance: '',
          alcance_ingles: '',
          intensidad: generalUtility.getDurationFormatedForCertificate(total_intensidad),
          listado_cursos: mapping_listado_modulos_auditor,
          regional: '',
          ciudad: mapping_ciudad,
          pais: mapping_pais,
          fecha_certificado: currentDate,
          fecha_aprobacion: respCourse.scheduling.endDate,  //currentDate,
          fecha_ultima_modificacion: null,
          fecha_renovacion: null,
          fecha_vencimiento: null,
          fecha_impresion: currentDate,
          dato_1: "Asistió y aprobó el",
          dato_2: moment(respCourse.scheduling.endDate).locale('es').format('LL'),

          // primer logo
          dato_3: (logoDataArray.length != 0 && logoDataArray[0]) ? logoDataArray[0].imageBase64 : null,
          // primera firma
          dato_4: (signatureDataArray.length != 0 && signatureDataArray[0]) ? signatureDataArray[0].imageBase64 : null,
          dato_5: (signatureDataArray.length != 0 && signatureDataArray[0]) ? signatureDataArray[0].signatoryName : null,
          dato_6: (signatureDataArray.length != 0 && signatureDataArray[0]) ? signatureDataArray[0].signatoryPosition : null,
          dato_7: (signatureDataArray.length != 0 && signatureDataArray[0]) ? signatureDataArray[0].signatoryCompanyName : null,

          // segundo logo
          dato_8: (logoDataArray.length != 0 && logoDataArray[1]) ? logoDataArray[1].imageBase64 : null,
          // segunda firma
          dato_9: (signatureDataArray.length != 0 && signatureDataArray[1]) ? signatureDataArray[1].imageBase64 : null,
          dato_10: (signatureDataArray.length != 0 && signatureDataArray[1]) ? signatureDataArray[1].signatoryName : null,
          dato_11: (signatureDataArray.length != 0 && signatureDataArray[1]) ? signatureDataArray[1].signatoryPosition : null,
          dato_12: (signatureDataArray.length != 0 && signatureDataArray[1]) ? signatureDataArray[1].signatoryCompanyName : null,

          dato_13: mapping_dato_13
        }
        //certificateParams.numero_certificado = mapping_numero_certificado + 'A';
        //certificateParams.certificado = 'Auditor en ' + respCourse.scheduling.program.name;

        certificateParamsArray.push({
          queueData: {
            certificateQueueId: null, // as new record
            userId: params.userId, // Nombre de usario
            courseId: params.courseId,
            auxiliarId: params.auxiliarId
          },
          certificateType: certificate_type.auditor,
          template: mapping_template,
          paramsHuella: auditorCertificateParams,
          programName: (respCourse.scheduling.certificate) ? respCourse.scheduling.certificate : respCourse.scheduling.program.name,
          isComplete: isComplete
        });
        console.log("[2]------------------------------------------");
        console.log("Set Auditor Certificate: ");
        console.log(certificateParams);
        console.log("[2]------------------------------------------");
      }
      // Request to Create Certificate(s)
      let respProcessSetCertificates: any = await this.requestSetCertificate(certificateParamsArray);
      //#endregion

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          respProcessSetCertificates
        }
      });

    }

    catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  /*
  * RULES FOR RELEASE CERTIFTICATE
  */
  private rulesForCompleteProgress = async (
    moodleCourseID: string,
    moduleType: any[],
    schedulingMode: string,
    programTypeName: string,
    respListOfActivitiesInModules: any[],
    respSchedulingsDetails: any[],
    reviewAuditorCerficateRulesEnabled: bool,
    auditorModules: any[],
    isForCertificate: bool,
    userMoodleID?: string
  ) => {

    try {

      // respListOfActivitiesInModules.forEach(element => {
      //   console.log("..............................................")
      //   console.log('* ' + element.sectionid + ' > ' + element.sectionname);
      //   console.log('* ' + element.instance + ' - (' + element.modname + ') - ' + element.name);
      // });
      // console.log("===========================================")
      //console.log("programTypeName: " + programTypeName)

      let listOfStudentProgress = [];
      let auditorQuizApplies = false;
      let responseStudentProgress;

      // Presencial - Online
      // Asistencia >= 75
      //console.log(moduleType);
      const respUserGrades: any = await gradesService.fetchGradesByFilter({
        courseID: moodleCourseID,
        userID: (userMoodleID) ? userMoodleID.toString() : '0',
        filter: moduleType//['attendance', 'quiz']
      });

      if (respUserGrades.error) {
        console.log(`Error with Course ID: ${moodleCourseID}`);

        // studentProgress.status = 'error';
        // studentProgress.attended_approved = 'error';
        // return studentProgress;
        return null;
      }

      // console.log('øøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøø');
      // console.dir(respUserGrades.grades, {depth: null});
      // console.log('øøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøø');

      for await (const student of respUserGrades.grades) {

        let programTypeText;
        let studentProgress = {
          status: '',
          attended_approved: '',
          average_grade: null,
          completion: null,
          assistance: null,
          quizGrade: null,
          approved_modules: [],
          auditor: false,
          auditorCertificate: '',
          auditorGrade: null
        }

        // console.log('øøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøø');
        // console.log(`Progress for: ${student.userData.userfullname}`);
        // console.log('øøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøø');

        //#region REGLAS PARA PRESENCIAL Y EN LINEA

        if (schedulingMode == 'presencial' || schedulingMode == 'en linea') {

          //#region  :::::::::::: Assistance ::::::::::::

          /* Todas las asistencia debe estar igual o por encima de 75%.
            Si alguna no cumple esta regla, no se emite Condición por Asistencia
          */
          let flagAssistance = true;
          let flagAssistanceCount = 0;
          let flagQuiz = true;
          let flagQuizCount = 0;


          for (const grade of student.itemType.attendance) {
            // console.log("»»» Check on activity: " + grade.name);
            // console.log(grade.graderaw);

            if (grade.graderaw) {
              // console.log("Grade: " + grade.name);
              // console.log("\t\t" + grade.graderaw);

              if (grade.graderaw < 75) {
                flagAssistance = false;
                continue;
              }
              // search the Module name by ItemInstance in respListOfActivitiesInModules
              let itemModule = respListOfActivitiesInModules.find(field => field.instance == grade.iteminstance.toString());
              // console.log("itemModule: ")
              // console.dir(itemModule);

              let durationModule = respSchedulingsDetails.find(field => field.course.moodle_id == itemModule.sectionid.toString());
              // console.log("durationModule: ");
              // console.dir(durationModule);

              if (itemModule && durationModule) {
                studentProgress.approved_modules.push({ name: itemModule.sectionname, duration: durationModule.duration });
                flagAssistanceCount++;
              }
            }
            else {
              flagAssistance = false;
              // console.log("Grade: " + grade.name);
              // console.log("\t\t--");
              // console.log("\t\t--");
            }
          }
          if (flagAssistanceCount == 0) {
            flagAssistance = false;
          }

          //#endregion  :::::::::::: Assistance ::::::::::::

          //#region :::::::::::: Quiz ::::::::::::
          /* Todas los exámenes debe estar igual o por encima de 70%.
            Si alguna no cumple esta regla, no se emite Condición por Examen
          */
          if (student.itemType.quiz.length > 0) {
            for (const grade of student.itemType.quiz) {
              if (grade.graderaw < 70) {
                //flagQuiz = false;
                continue;
              }
              flagQuizCount++;
            }
            if (flagQuizCount < student.itemType.quiz.length)
              flagQuiz = false;
          }
          else
            flagQuiz = false;
          //#endregion :::::::::::: Quiz ::::::::::::

          //#region :::::::::::: Certification resolution ::::::::::::
          //console.log("Total attendance: " + flagAssistance);
          if (flagAssistance) {
            if (flagQuiz && (programTypeName !== 'diplomado')) {
              programTypeText = (programTypeName) ? ' el ' : '.';

              if (isForCertificate)
                studentProgress.attended_approved = 'Asistió y aprobó el '; // + programTypeText;
              else
                studentProgress.attended_approved = 'Asistencia y aprobación.';
            }
            else {
              programTypeText = (programTypeName) ? ' al ' : '.';
              //studentProgress.attended_approved = 'Asistió' + programTypeText;
              if (isForCertificate)
                studentProgress.attended_approved = 'Asistió al'; // + programTypeText;
              else
                studentProgress.attended_approved = 'Asistencia.';

            }
            //studentProgress.auditor = isAuditorCerficateEnabled;
            studentProgress.status = 'ok';
          }
          else {
            if (flagAssistanceCount > 0) {
              studentProgress.attended_approved = 'Certificado parcial.';
              studentProgress.status = 'partial';
            }
            else {
              studentProgress.attended_approved = 'No se certifica.';
              studentProgress.status = 'no';
            }
          }
          studentProgress.assistance = `${flagAssistanceCount}/${student.itemType.attendance.length}`;
          studentProgress.quizGrade = (student.itemType.quiz.length != 0) ? `${flagQuizCount}/${student.itemType.quiz.length}` : '-';

          // console.log(`\t» Attendance:        ${studentProgress.assistance}`);
          // console.log(`\t» Exam:              ${studentProgress.quizGrade}`);
          // console.log(`\t» Certificate:       ${studentProgress.attended_approved}`);
          // console.log(`\t» Examn Certificate:  `);
          // console.log(`\t» Second Certificate: `);
          // console.log('øøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøø\r\n');

          //#endregion :::::::::::: Certification resolution ::::::::::::
        }
        //#endregion REGLAS PARA PRESENCIAL Y EN LINEA

        //#region REGLAS PARA VIRTUAL

        // Si la modalidad es , aplica esta regla
        if (schedulingMode == 'virtual') {
          const respCompletionStatus: any = await completionstatusService.activitiesCompletion({
            courseID: moodleCourseID, //register.courseID,
            userID: student.userData.userid, //register.user.moodle_id
          });

          //#region  :::::::::::: Grades for UserName ::::::::::::
          // Solo devuelve una nota para el filtro de course de ItemType en Servicio de Moodle
          let average = 0;
          for (const grade of student.itemType.course) {
            if (grade.graderaw) {
              average += grade.graderaw;
            }
          }
          average /= student.itemType.course.length;
          //#endregion  :::::::::::: Grades for UserName ::::::::::::

          //#region :::::::::::: Completion percentage ::::::::::::
          let completionPercentage = 0;
          for (const completion of respCompletionStatus.completion) {
            if (completion.state == 1) {
              completionPercentage += 1;
            }
          }
          completionPercentage /= respCompletionStatus.completion.length;
          studentProgress.average_grade = Math.trunc(average);
          studentProgress.completion = Math.trunc(completionPercentage * 100);
          //#endregion :::::::::::: Completion percentage ::::::::::::

          //#region :::::::::::: Certification resolution ::::::::::::
          if (studentProgress.completion == 100) {
            if (studentProgress.average_grade >= 70 && (programTypeName !== 'diplomado')) {
              programTypeText = (programTypeName) ? ' el ' : '.';

              if (isForCertificate)
                studentProgress.attended_approved = 'Asistió y aprobó el '; // + programTypeText;
              else
                studentProgress.attended_approved = 'Asistencia y aprobación.'
            }
            else {
              programTypeText = (programTypeName) ? ' al ' : '.';
              if (isForCertificate)
                studentProgress.attended_approved = 'Asistió al '; //+ programTypeText;
              else
                studentProgress.attended_approved = 'Asistencia.'

            }
            //studentProgress.auditor = isAuditorCerficateEnabled;
            studentProgress.status = 'ok';
          }
          else {
            studentProgress.attended_approved = 'No se certifica.';
            studentProgress.status = 'no';
          }

          // console.log(`\t» Final grade:         ${studentProgress.average_grade}`);
          // console.log(`\t» Completion:          ${studentProgress.completion}%`);
          // console.log(`\t» Certificate:         ${studentProgress.attended_approved}`);
          // console.log(`\t» Examn Certificate:   `);
          // console.log(`\t» Second Certificate:  `);
          // console.log('øøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøø\r\n');

          //#endregion :::::::::::: Certification resolution ::::::::::::
        }
        //#endregion REGLAS PARA VIRTUAL


        //#region REGLAS PARA CERTIFICADO DE AUDITOR
        if (reviewAuditorCerficateRulesEnabled) {
          //console.log("Rules for Auditor Certificate: ")
          let flagAuditorActivities = true;
          let auditorActivitiesCounter = 0;
          // extract activities only for AuditorModules:
          // console.log('Listado de Examenes');
          // console.log(student.itemType.quiz);

          // console.log('Listado de Tareas');
          // console.log(student.itemType.assign);

          //console.log(':::::::::::::::::::::::::::');
          //console.log('Extract Activities only for Auditor:');
          let auditorActivities = [];
          for (const audModule of auditorModules) {
            let audActivity: any = respListOfActivitiesInModules.filter(field => field.sectionid == audModule.course.moodle_id);
            if (audActivity) {
              audActivity.forEach(element => {
                auditorActivities.push(element);
              });
            }
          }

          for (const element of auditorActivities) {

            if (element.modname == 'attendance') {

              let gradeAttendance = student.itemType.attendance.find(x => x.cmid == element.id);
              if (gradeAttendance) {
                // console.log(`* ${element.name}: ${gradeAttendance.graderaw}`);
                if (gradeAttendance.graderaw < 70) {
                  break;
                }
                auditorActivitiesCounter++;
              }
            }

            if (element.modname == 'quiz') {

              let gradeQuiz = student.itemType.quiz.find(x => x.cmid == element.id);
              if (gradeQuiz) {
                // console.log(`* ${element.name}: ${gradeQuiz.graderaw}`);
                if (gradeQuiz.graderaw < 70) {
                  break;
                }
                auditorActivitiesCounter++;
              }
            }

            // if (element.modname == 'assign') {
            //   let gradeAssign = student.itemType.assign.find(x => x.cmid == element.id);
            //   if (gradeAssign) {
            //     console.log(`* ${element.name}: ${gradeAssign.graderaw}`);

            //     if (gradeAssign.graderaw < 70) {
            //       break;
            //     }
            //     auditorActivitiesCounter++;
            //   }
            // }
          }

          // console.log(`Qty Activities accepted: ${auditorActivitiesCounter} / ${auditorActivities.length}`)
          // console.log(':::::::::::::::::::::::::::');

          //#region :::::::::::: Quiz ::::::::::::
          /* Todas los exámenes debe estar igual o por encima de 70%.
            Si alguna no cumple esta regla, no se emite Condición por Examen
          */
          if (student.itemType.quiz.length > 0) {
            for (const grade of student.itemType.quiz) {
              if (grade.graderaw < 70) {
                //flagQuiz = false;
                continue;
              }
              auditorActivitiesCounter++;
            }
            if (auditorActivitiesCounter < student.itemType.quiz.length)
              flagAuditorActivities = false;
          }
          else
            flagAuditorActivities = false;

          if (student.itemType.quiz.length > 0) {
            for (const grade of student.itemType.quiz) {
              if (grade.graderaw < 70) {
                //flagQuiz = false;
                continue;
              }
              auditorActivitiesCounter++;
            }
            if (auditorActivitiesCounter < student.itemType.quiz.length)
              flagAuditorActivities = false;
          }
          else
            flagAuditorActivities = false;
          //#endregion :::::::::::: Quiz ::::::::::::


          let auditorQuizModule = respListOfActivitiesInModules.find(field => field.isauditorquiz == true);
          //console.log("auditorQuizModule : " + auditorQuizModule);
          if (auditorQuizModule) {
            auditorQuizApplies = true;
            if (student.itemType.quiz.length > 0) {

              let quizGrade = student.itemType.quiz.find(field => field.cmid == auditorQuizModule.id)
              // console.log('Auditor Quiz grade:');
              // console.log(quizGrade.graderaw);
              studentProgress.auditorGrade = quizGrade.graderaw;
              if (quizGrade.graderaw >= 70) {
                programTypeText = (programTypeName) ? ' el ' : '.';
                studentProgress.auditor = true;
                if (isForCertificate)
                  studentProgress.auditorCertificate = 'Asistió y aprobó el ';// + programTypeText;
                else
                  studentProgress.auditorCertificate = 'Asistencia y aprobación.';
              }
              else {
                studentProgress.auditor = false;
                studentProgress.auditorCertificate = 'No se certifica.';
              }
              // console.log(`\t» Auditor grade:         ${studentProgress.auditorGrade}`);
              // console.log(`\t» Second Certificate:  ${studentProgress.auditorCertificate}`);
            }
          }
        }
        //#endregion REGLAS PARA CERTIFICADO DE AUDITOR

        student.studentProgress = studentProgress;
        listOfStudentProgress.push({ student });
      }
      console.log("──────────────────────────────────────────────────────────");
      console.log("Auditor Quiz applied: " + auditorQuizApplies);
      console.log("──────────────────────────────────────────────────────────");
      responseStudentProgress = {
        auditorQuizApplies,
        listOfStudentProgress
      };

      return responseStudentProgress;
    }
    catch (e) {
      console.log(e.message);
      return responseUtility.buildResponseFailed('json', null,
        {
          error_key: 'grades.exception',
          additional_parameters: {
            process: 'rulesForCompleteProgress()',
            error: e.message
          }
        });
    }
  }


  private requestSetCertificate = async (certificateParamsArray: ISetCertificateParams[]) => {

    let responseCertQueueArray = [];
    let counter = 1;
    for await (const certificateReq of certificateParamsArray) {

      console.log("Certificate n° " + counter);
      // #region request Login and token response
      let respToken: any = await this.login();
      if (respToken.status == 'error') {
        return responseUtility.buildResponseFailed('json', null,
          { error_key: { key: 'certificate.login_invalid' } })
      }
      var tokenHC = respToken.token;
      // #endregion request Login and token response

      let responseCertificateQueue: any = await certificateQueueService.insertOrUpdate({
        id: certificateReq.queueData.certificateQueueId,
        courseId: certificateReq.queueData.courseId,
        users: [certificateReq.queueData.userId],
        certificateType: certificateReq.certificateType,
        status: 'In-process',
        message: '',
        auxiliar: certificateReq.queueData.auxiliarId,
      });

      console.log("--> After Insert/update cerfificateQueue:");
      console.log(responseCertificateQueue.certificateQueue);

      console.log("--> Send request to Huella de Confianza:");
      // Build request for Create Certificate
      let respHuella: any = await queryUtility.query({
        method: 'post',
        url: certificate_setup.endpoint.create_certificate,
        api: 'huellaDeConfianza',
        headers: { Authorization: tokenHC },
        params: JSON.stringify(certificateReq.paramsHuella)
      });
      console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^");
      console.log(respHuella);
      console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^");

      let registerId = (certificateReq.queueData.certificateQueueId) ? (certificateReq.queueData.certificateQueueId) : responseCertificateQueue.certificateQueue._id;
      console.log("--> Register to update " + registerId);

      let responseLog: any = await certificateLogsService.insertOrUpdate({
        serviceResponse: respHuella.estado,
        idCertificateQueue: registerId,
        message: "",
        requestData: certificateReq.paramsHuella
      });

      console.log("***************************");
      console.log(responseLog);
      console.log("***************************");

      let responseCertQueue: any = await certificateQueueService.insertOrUpdate({
        id: registerId, //(certificateReq.queueData.certificateQueueId) ? (certificateReq.queueData.certificateQueueId) : responseCertificateQueue.certificateQueue._id,
        status: 'Requested',
        message: certificateReq.paramsHuella.certificado,
        certificateModule: certificateReq.paramsHuella.modulo,
        certificateType: certificateReq.certificateType,
        auxiliar: certificateReq.queueData.auxiliarId,
        certificate: {
          hash: respHuella.resultado.certificado,
          url: respHuella.resultado.url,
          title: (certificateReq.isComplete) ? certificateReq.paramsHuella.certificado : 'Certificado Parcial de ' + certificateReq.programName,
          date: certificateReq.paramsHuella.fecha_aprobacion
        }
      });

      responseCertQueueArray.push(responseCertQueue);
      counter++;
    }
    return responseCertQueueArray;
  }

  public previewCertificate = async (params: ICertificatePreview) => {
    try {
      console.log("Params for Preview Certificate: ");
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

      console.log("update register on certificate queue:");

      if (params.updateCertificate && params.format) {
        let updateData = null

        const userCertificate = await CertificateQueue.findOne({ _id: params.certificate_queue })

        let respDataUser: any = await userService.findBy({
          query: QueryValues.ONE,
          where: [{ field: '_id', value: userCertificate.userId }]
        })

        var filename = generalUtility.normalizeFullName(respDataUser.user.profile.first_name, respDataUser.user.profile.last_name);
        console.log('filename');
        console.log(filename);

        if (params.format.toString() === "1") { // Si el format es 1 (PNG) guardo en base de datos el base 64
          const time = new Date().getTime()
          const resultPng: any = await this.generateCertificateFromBase64({
            certificate: respHuella.resultado,
            to_file: {
              file: {
                name: `${filename}_${time}.png`,
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
                name: `${filename}_${time}.pdf`,
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
            date: certificate?.certificate.date
          }
        }
      });

    }

    catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  public generateZipCertifications = async (params: IGenerateZipCertifications) => {
    let driver = attached['driver'];
    let attached_config = attached[driver];

    const upload_config_base_path = (attached_config.base_path) ? attached_config.base_path : 'uploads'
    let base_path = path.resolve(`./${public_dir}/${upload_config_base_path}`)
    if (attached_config.base_path_type === "absolute") {
      base_path = upload_config_base_path
    }

    const path_upload = (params.to_file.path && params.to_file.path !== "") ? `zip/${params.to_file.path}/` : "zip/";

    const full_path_file = `${base_path}/${path_upload}${params.to_file.file.name}`;
    const public_path_file = `${host}/uploads/${path_upload}${params.to_file.file.name}`;

    // Creando la estructura de carpetas necesaria para cargar el archivo
    await fileUtility.createDirRecursive(full_path_file);

    const fileExists = await fileUtility.fileExists(full_path_file)
    if (fileExists) {
      const remove = await fileUtility.removeFileSync(full_path_file)
    }

    try {
      const zip = new AdmZip();
      params.files.map((item) => {
        zip.addLocalFile(item);
      })
      zip.writeZip(full_path_file);

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

  public getCertificatePath = (filename: string, filePath?: string) => {
    const _path = filePath || this.default_certificate_path
    // return `${host}/uploads/${path_upload}${filename}`;
    let driver = attached['driver'];
    let attached_config = attached[driver];

    const upload_config_base_path = (attached_config.base_path) ? attached_config.base_path : 'uploads'

    let base_path = path.resolve(`./${public_dir}/${upload_config_base_path}`)
    if (attached_config.base_path_type === "absolute") {
      base_path = upload_config_base_path
    }

    const path_upload = (_path && _path !== "") ? `pdfs/${_path}/` : "pdfs/";
    return `${base_path}/${path_upload}${filename}`;
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

  //#region Private Methods
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

  private encodeAdditionaImageForCertificate = (base_path: string, imagePath: string) => {

    const height = '70px';
    const prefixMimeType = "<img src='data:image/png;base64,";
    const sufixMimeType = `'style='height:${height}; margin-bottom:0px; margin-left:0px; margin-right:0px; margin-top:0px;'/>"`;
    let fullContentBase64 = '';

    if (imagePath) {
      console.log(`Image path: ${imagePath}`);

      let filePath = `${base_path}/${this.default_logo_path}/${imagePath}`;
      console.log(filePath);

      if (fileUtility.fileExists(filePath) === true) {
        console.log(`fileExists!!`);

        const contentFile = fileUtility.readFileSyncBuffer(filePath);
        if (contentFile && contentFile.length > 0) {
          const dataArray = Buffer.from(contentFile);
          fullContentBase64 = `${prefixMimeType}${dataArray.toString('base64')}${sufixMimeType}`;
          return fullContentBase64;
        }
      }
    }
    return null;
  }

  private getProgramTypeFromCode = (code: string) => {
    let programTypeName;
    let codeProgram = code.split('-');
    programTypeName = program_type_collection.find(element => element.abbr == codeProgram[0]);

    if (!programTypeName) {
      for (const prog of program_type_collection) {
        if (codeProgram[0].includes(prog.abbr)) {
          programTypeName = prog;
          continue;
        }
      }
    }
    console.log("codeProgram: " + codeProgram[0]);
    console.log("abbr: " + programTypeName.abbr + " - Name:" + programTypeName.name);
    return programTypeName;
  }

  //#endregion Private Methods
}

export const certificateService = new CertificateService();
export { CertificateService as DefaultHuellaDeConfianzaCertificateCertificateService };
