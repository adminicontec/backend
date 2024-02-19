// @import_dependencies_node Import libraries
import path from "path";
const sizeOf = require('image-size')
import moment from 'moment'
import { Base64 } from 'js-base64';
import { host, public_dir, attached, AUDITOR_EXAM_REGEXP } from "@scnode_core/config/globals";
const AdmZip = require("adm-zip");
const ObjectID = require('mongodb').ObjectID
// @end

// @import config
import { customs, system_user } from '@scnode_core/config/globals'
// @end

// @import services
import { userService } from '@scnode_app/services/default/admin/user/userService';
import { courseSchedulingService } from '@scnode_app/services/default/admin/course/courseSchedulingService';
import { courseSchedulingDetailsService } from '@scnode_app/services/default/admin/course/courseSchedulingDetailsService';
import { certificateQueueService } from '@scnode_app/services/default/admin/certificateQueue/certificateQueueService';
import { certificateLogsService } from "@scnode_app/services/default/admin/certificateQueue/certificateLogsService";
import { gradesService } from '@scnode_app/services/default/moodle/grades/gradesService';
import { completionstatusService } from '@scnode_app/services/default/admin/completionStatus/completionstatusService';
import { courseContentService } from '@scnode_app/services/default/moodle/course/courseContentService';

// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { certificate_setup, program_type_collection, program_type_abbr, certificate_template, certificate_type } from '@scnode_core/config/globals';
import { queryUtility } from '@scnode_core/utilities/queryUtility';
import { fileUtility } from '@scnode_core/utilities/fileUtility'
// @end

// @import models
import { Enrollment, CertificateQueue, User, CourseScheduling, MailMessageLog } from '@scnode_app/models';
// @end

// @import types
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes'
import {
  IQueryUserToCertificate, ICertificate, IQueryCertificate,
  ICertificatePreview, IGenerateCertificatePdf, IGenerateZipCertifications,
  ICertificateCompletion, ISetCertificateParams, ILogoInformation, ISignatureInformation, ICertificateReGenerate, ICertificateForceStage, CertificateCategory
} from '@scnode_app/types/default/admin/certificate/certificateTypes';
import { IStudentProgress } from '@scnode_app/types/default/admin/courseProgress/courseprogressTypes';
import { generalUtility } from '@scnode_core/utilities/generalUtility';
import { certificateMultipleService } from "../../admin/certificate/certificateMultipleService";
import { ICertificateQueueMultiple } from "@scnode_app/types/default/admin/certificate/certificateMultipleTypes";
import { notificationEventService } from "../../events/notifications/notificationEventService";
// @end

class CertificateService {

  private default_certificate_path = 'certifications'
  public default_certificate_zip_path = 'certifications'
  private selectActivitiesTest = ['attendance', 'assign', 'quiz', 'course', 'forum'];
  private default_logo_path = 'certificate/icons';
  private default_signature_path = 'certificate/signatures';
  private left_parentheses = '&#40;';
  private right_parentheses = '&#41;';
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
    let firstCertificateIsAuditor = false;
    let previewCertificateParams;
    let currentDate = new Date(Date.now());
    // console.log("→→→ Execution of completion()");

    //#region query Filters
    const paging = (filters.pageNumber && filters.nPerPage) ? true : false
    const pageNumber = filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage = filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let select = 'id user courseID course_scheduling enrollmentCode';
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
        status: { $in: ['New', 'In-process', 'Complete', 'Error'] }
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

    if (filters?.userMoodleID && filters?.userMoodleID !== '' && filters?.userMoodleID !== '0') {
      const user = await User.findOne({moodle_id: filters?.userMoodleID}).select('id').lean()
      if (user?._id) {
        where['user'] = user._id;
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
      // console.log("Program Status --> " + respCourse.scheduling.schedulingStatus.name);
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
        // console.log(`Módulos para Segundo Certificado: \"${respCourse.scheduling.auditor_certificate}\"`);
        // respCourse.scheduling.auditor_modules.forEach(element => {
        //   console.log(`→ ${element.course.name}`);
        // });

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
        warnings: []
      }

      const certificationMigration = this.certificateProviderStrategy(respCourse.scheduling.metadata.service_id)
      if (certificationMigration) {
        const programCode = respCourse?.scheduling?.program?.code || undefined
        if (programCode) {
          const queryHasTemplateBlockChain: any = await queryUtility.query({
            method: 'get',
            url: `GetNumTemplates/${programCode}`,
            api: 'acredita',
          });
          if (queryHasTemplateBlockChain === 0 || queryHasTemplateBlockChain === "0") {
            previewCertificateParams.warnings.push({
              key: 'Validación de plantilla', message: `El programa con código ${programCode} NO se encuentra registrado en la metadata para emisión por Blockchain`
            })
          }
        }
      }

      if (respCourse.scheduling?.signature_1) {
        if (!respCourse.scheduling?.signature_1_name || !respCourse.scheduling?.signature_1_position || !respCourse.scheduling?.signature_1_company) {
          previewCertificateParams.warnings.push({
            key: 'Firma 2', message: 'La información de la firma no esta completa, por favor revise la configuración del servicio'
          })
        }
      }

      if (respCourse.scheduling?.signature_2) {
        if (!respCourse.scheduling?.signature_2_name || !respCourse.scheduling?.signature_2_position || !respCourse.scheduling?.signature_2_company) {
          previewCertificateParams.warnings.push({
            key: 'Firma 3', message: 'La información de las firmas no esta completa, por favor revise la configuración del servicio'
          })
        }
      }

      if (respCourseDetails.schedulings && Array.isArray(respCourseDetails.schedulings)) {
        const durationModules = respCourseDetails.schedulings.reduce((accum, element) => {
          if (element.duration) {
            accum += element.duration
          }
          return accum
        }, 0)
        if (durationModules !== respCourse.scheduling.duration) {
          previewCertificateParams.warnings.push({
            key: 'Intensidad', message: `La duración del servicio (${generalUtility.getDurationFormatedForCertificate(respCourse.scheduling.duration)}) es diferente a la de los modulos (${generalUtility.getDurationFormatedForCertificate(durationModules)})`
          })
        }
      }

      //#endregion Información del curso

      enrollmentRegisters = await Enrollment.find(where)
        .select(select)
        .populate({ path: 'user', select: 'id email phoneNumber profile.first_name profile.last_name profile.doc_type profile.doc_number profile.regional profile.origen moodle_id' })
        .skip(paging ? (pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0) : null)
        .limit(paging ? nPerPage : null)
        .lean();

      // console.log("Total de estudiantes: " + enrollmentRegisters.length);

      //#region Revisión de Progreso en Actividades para todo el curso
      // console.log(`→→ Modalidad: ${schedulingMode.toLowerCase()}`);
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
      firstCertificateIsAuditor = progressListResult.firstCertificateIsAuditor;

      // console.log('→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→');
      // console.dir(progressListResult, { depth: null });
      // console.log('→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→');
      //listOfStudents.push(progressListResult);

      for await (const register of enrollmentRegisters) {

        register.count = count;

        // console.log("~~~~~~~~~~~~~");
        // console.log("Counter:" + count);

        if (register.user && register.user.profile) {
          register.user.profile.full_name = `${register.user.profile.first_name} ${register.user.profile.last_name}`;

          // console.log('++++++++++++++++++++++++++');
          // console.log(`Fetch grades for: ${register.user.moodle_id} - ${register.user.profile.full_name}`);
          // //console.dir(register.user, { depth: null });
          // console.log('++++++++++++++++++++++++++');

          let studentProgress = progressListResult.listOfStudentProgress.find(f => f.student.userData.userid == register.user.moodle_id);
          if (studentProgress) {
            // console.log('──·─···─·──');
            // console.dir(studentProgress.student.studentProgress, { depth: null });
            // console.log('──·─···─·──');
            register.progress = studentProgress.student.studentProgress;
          }

          //#region Add certification to response
          if (filters.check_certification) {
            const certificate = await CertificateQueue.findOne({
              userId: register.user._id,
              courseId: register.course_scheduling,
              status: { $in: ['New', 'In-process', 'Requested', 'Complete', 'Error'] }
            }).select('');

            register.certificate = certificate;
            if (register?.certificate?.certificate?.hash) {
              register.certificate.certificate.pdfPath = certificateService.certificateUrlV2(register.certificate.certificate);
            }
            // if (register?.certificate?.certificate?.pdfPath) {
            //   register.certificate.certificate.pdfPath = certificateService.certificateUrl(register.certificate.certificate.pdfPath);
            // }
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
        firstCertificateIsAuditor: firstCertificateIsAuditor,
        enrollment: [
          ...listOfStudents
        ],
        total_register: (paging) ? await Enrollment.find(where).countDocuments() : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    });

  }

  /**
   * Permite a campus Digital poner en cola los participantes que son candidatos para generación de certificado (liberación)
   * @param filters
   * @returns
   */
  public automaticRelease = async (filters: ICertificateCompletion) => {
    console.log("→→→ Execution of automaticRelease()");
    let enrollmentRegisters = [];
    let schedulingMode = '';
    let isAuditorCerficateEnabled = false;
    let listOfCertificatesQueue = [];
    //#region query Filters
    const paging = (filters.pageNumber && filters.nPerPage) ? true : false
    const pageNumber = filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage = filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let select = 'id user courseID course_scheduling';
    if (filters.select) {
      select = filters.select
    }

    let where = {
      'origin': 'Tienda Virtual'
    }
    if (filters.without_certification && filters.course_scheduling) {
      const certifications = await CertificateQueue.find({
        courseId: filters.course_scheduling,
        status: { $in: ['New', 'In-process', 'Requested', 'Complete', 'Error'] }
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

      // System user (this is an automated task)
      let respSystemUser: any = await userService.findBy({
        query: QueryValues.ONE,
        where: [{ field: 'username', value: system_user }]
      });

      if (respSystemUser.status == 'error') {
        return responseUtility.buildResponseFailed('json', null,
          { error_key: { key: 'user.not_found' } })
      }

      console.log("List of course Scheduling");
      let respCourse: any = await courseSchedulingService.list(
        {
          schedulingStatus: ObjectID('615309f85d811e78db3fc91e')
        });

      if (respCourse.status == 'error') {
        return responseUtility.buildResponseFailed('json', null,
          { error_key: { key: 'program.not_found' } })
      }
      let count = 1;

      //1. List of Courses
      for (var course of respCourse.schedulings) {

        let listOfStudents = [];
        //#region Información del curso
        console.log(`-------------------------------------------`)
        console.log(`Datos para Programa: ${course.program.name}`)
        console.log(`ID: ${course._id}`)
        console.log(`→→ Program Status: ${course.schedulingStatus.name}`);
        console.log(`→→ Modalidad: ${course.schedulingMode.name.toLowerCase()}`);
        console.log(`-------------------------------------------`)
        schedulingMode = course.schedulingMode.name;
        //#endregion Información del curso

        //#region Filters
        where['courseID'] = course.moodle_id;

        const certifications = await CertificateQueue.find({
          courseId: course._id,
          status: { $in: ['New', 'Requested', 'In-process', 'Complete', 'Error'] }
        })
          .select('id userId')

        const user_ids = certifications.reduce((accum, element) => {
          accum.push(element.userId)
          return accum
        }, [])
        if (user_ids.length > 0) {
          where['user'] = { $nin: user_ids }
        }
        //#endregion Filters

        //  course Scheduling Details data
        let respCourseDetails: any = await courseSchedulingDetailsService.findBy({
          query: QueryValues.ALL,
          where: [{ field: 'course_scheduling', value: course._id }]
        });

        // Estatus de Programa: se permite crear la cola de certificados si está confirmado o ejecutado.
        if (course.schedulingStatus.name == 'Programado' || course.schedulingStatus.name == 'Cancelado') {
          return responseUtility.buildResponseFailed('json', null,
            { error_key: { key: 'certificate.requirements.program_status', params: { error: course.schedulingStatus.name } } });
        }

        //#region Tipo de programa
        let programTypeName;
        const programType = this.getProgramTypeFromCode(course.program.code);
        programTypeName = this.getProgramTypeName(programType.abbr);
        //#endregion Tipo de programa

        if (course.auditor_certificate) {
          isAuditorCerficateEnabled = true;
        }

        //#region Revisión de Progreso en Actividades para todo el curso
        const respListOfActivitiesInModulesTest: any = await courseContentService.moduleList({ courseID: course.moodle_id, moduleType: this.selectActivitiesTest });

        if (respListOfActivitiesInModulesTest.status == "error") {
          return responseUtility.buildResponseFailed('json', null,
            { error_key: { key: 'certificate.requirements.program_status', params: { error: respCourse.scheduling.schedulingStatus.name } } });
        }
        //#endregion Revisión de Progreso en Actividades para todo el curso

        //#endregion Información del curso

        // filter only students with "Tienda Virtual" as origin
        enrollmentRegisters = await Enrollment.find(where)
          .select(select)
          .populate({
            path: 'user',
            select: 'id email phoneNumber profile.first_name profile.last_name profile.doc_type profile.doc_number profile.regional origin moodle_id'
          })
          .lean();

        for (let student of enrollmentRegisters) {

          // Check if Completion is done for student
          let studentProgress: any = await this.rulesForCompleteProgress(
            course.moodle_id,
            this.selectActivitiesTest,
            schedulingMode.toLowerCase(),
            programTypeName,
            respListOfActivitiesInModulesTest.courseModules,
            respCourseDetails.schedulings,
            isAuditorCerficateEnabled,
            course.auditor_modules,
            false,
            student.user.moodle_id);

          if (studentProgress.listOfStudentProgress[0]) {
            console.log(`\tCheck progress for: ${student.user.profile.first_name} ${student.user.profile.last_name}`)

            let progressData = studentProgress.listOfStudentProgress[0].student.studentProgress;
            console.log(`Progress: ${progressData.status}`);
            if (progressData.status === 'ok' || progressData.status === 'partial') {
              console.log(`\tAdded to certificate queue.`);
              listOfStudents.push(student.user._id.toString());
              count++;
            }
            else {
              console.log(`\tNot available to certificate.`);
            }
          }

        }

        if (listOfStudents.length > 0) {
          let queueData = {
            status: "New",
            courseId: course._id.toString(),
            users: listOfStudents,
            auxiliar: respSystemUser.user._id.toString()
          }
          listOfCertificatesQueue.push(queueData);
          let responseCertQueue: any = await certificateQueueService.insertOrUpdate(queueData);
          if (responseCertQueue.status === 'error') {
            console.log("Error inserting new Certificate queue record");

          }

          console.log(">>>>>>>>>>>>>>>>>>>>><");
          console.log("responseCertQueue");
          console.log(responseCertQueue);
          console.log(">>>>>>>>>>>>>>>>>>>>><");
        }

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
        automaticRelease: [
          ...listOfCertificatesQueue
        ],
        total_register: listOfCertificatesQueue.length,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    });
  }


  public rulesForCompletion = async (filters: ICertificateCompletion) => {

    let count = 1
    let isAuditorCerficateEnabled = false;
    let firstCertificateIsAuditor = false;

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
        status: { $in: ['New', 'In-process', 'Complete', 'Error'] }
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
        programTypeName = this.getProgramTypeName(programType.abbr);
        // if (programType.abbr === program_type_abbr.curso || programType.abbr === program_type_abbr.curso_auditor)
        //   programTypeName = 'curso';
        // if (programType.abbr === program_type_abbr.programa || programType.abbr === program_type_abbr.programa_auditor)
        //   programTypeName = 'programa';
        // if (programType.abbr === program_type_abbr.diplomado || programType.abbr === program_type_abbr.diplomado_auditor)
        //   programTypeName = 'diplomado';
      }

      //#endregion Tipo de programa

      // console.log("---------------------\n\r" + 'El contenido del ' + programType);
      // console.log(respCourseDetails.schedulings);
      // console.log('_______________________________________________________');

      if (respCourse.scheduling.auditor_certificate) {
        isAuditorCerficateEnabled = true;
        // get modules need to process Second certificate
        //console.log(`Módulos para Segundo Certificado: \"${respCourse.scheduling.auditor_certificate}\"`);
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

      //console.log("Total de estudiantes: " + enrollmentRegisters.length);

      //#region Revisión de Progreso en Actividades para todo el curso
      //console.log(`→→ Modalidad: ${schedulingMode.toLowerCase()}`);
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
      if (progressListResult) {
        firstCertificateIsAuditor = progressListResult.firstCertificateIsAuditor;
        listOfStudents.push(progressListResult);
      }
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
        firstCertificateIsAuditor: firstCertificateIsAuditor,
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
  public createCertificate = async (params: IQueryUserToCertificate) => {
    return this.createCertificateStrategy(params)
  }

  private createCertificateStrategy = (params: IQueryUserToCertificate) => {
    if (params.certificateSettingId) {
      return certificateMultipleService.createCertificate({
        userId: params.userId,
        courseId: params.courseId,
        auxiliarId: params.auxiliarId,
        certificateSettingId: params.certificateSettingId,
        certificateQueueId: params.certificateQueueId,
        certificateConsecutive: params.certificateConsecutive,
      })
    } else  {
      return this.createCertificateV1(params)
    }
  }

  private createCertificateV1 = async (params: IQueryUserToCertificate) => {
    let certificateParamsArrayForRequest: ISetCertificateParams[] = [];  // return this Array
    try {
      certificateParamsArrayForRequest = await this.getStudentCertificateData(params, false, false);

      // Request to Create Certificate(s)
      let respProcessCertificate: any;
      respProcessCertificate = await this.requestSetCertificate(certificateParamsArrayForRequest);

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          respProcessCertificate
        }
      });
    }

    catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
* PutCertificate: Método de HdC para solicitar actualización de Certificado existente
*/
  public editCertificate = async (params: IQueryUserToCertificate) => {
    let certificateParamsArrayForRequest: ISetCertificateParams[] = [];  // return this Array
    let isAuditorCertificate = false;

    console.log("→→→ →→→ →→→ →→→ →→→ →→→ →→→ →→→");
    console.log("→→→ Execution of editCertificate() " + params.userId);
    console.log("→→→ →→→ →→→ →→→ →→→ →→→ →→→ →→→");
    try {

      if (params.certificateType == 'auditor')
        isAuditorCertificate = true;

      certificateParamsArrayForRequest = await this.getStudentCertificateData(params, true, isAuditorCertificate);

      // Request to Create Certificate(s)
      let respProcessCertificate: any;
      respProcessCertificate = await this.requestPutCertificate(certificateParamsArrayForRequest);

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          respProcessCertificate
        }
      });
    }
    catch (e) {
      console.log(e);
      return responseUtility.buildResponseFailed('json');
    }
  }

  public certificateProviderStrategy = (serviceId: string) => {
    const servicesAvailable = customs?.servicesAvailable || [];
    if (servicesAvailable.length === 0) return true;
    // @INFO: Modificar variable para habilitar por defecto acredita y servicios limitados huella 1
    if (!servicesAvailable.includes(serviceId)) return true;
    // @INFO: Modificar variable para habilitar por defecto huella 1 y servicios limitados Acredita
    // if (servicesAvailable.includes(serviceId)) return true;
    return false;
  }


  /**
   *  get needed parameters to create or edit a certificate
   */
  private getStudentCertificateData = async (params: IQueryUserToCertificate, isReissue: boolean, isAuditorCertificate: boolean) => {

    try {
      let certificateParamsArray: ISetCertificateParams[] = [];  // return this Array

      let logoDataArray: ILogoInformation[] = [];
      let signatureDataArray: ISignatureInformation[] = [];

      // location for logos setup
      let location3 = null;
      let location8 = null;

      //#region   >>>> 1. querying data for user to Certificate, param: username
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

      const certificationMigration = this.certificateProviderStrategy(respCourse.scheduling.metadata.service_id)
      const formatImage = certificationMigration ? 'public_url' : 'base64'
      const formatListModules = certificationMigration ? 'plain' : 'html'
      const dimensionsLogos = {width: 233, height: 70, position: 'center'}
      const dimensionsSignatures = {width: 180, height: 70, position: 'center'}

      const respListOfActivitiesInModulesTest: any = await courseContentService.moduleList({ courseID: respCourse.scheduling.moodle_id, moduleType: this.selectActivitiesTest });
      //#endregion

      //#region   >>>> 2. Load Logos from CourseScheduling settings
      //#region   >>>> 2.1. Base Path
      let driver = attached['driver'];
      let attached_config = attached[driver];
      const upload_config_base_path = (attached_config.base_path) ? attached_config.base_path : 'uploads'

      let base_path = path.resolve(`./${public_dir}/${upload_config_base_path}`)
      if (attached_config.base_path_type === "absolute") {
        base_path = upload_config_base_path
      }
      //#endregion 1. Base Path

      //#region   >>>> 2.2. Check for Logos and Signature
      console.log(`Check for Logos and Signature:`);

      let logoImage64_1 = this.encodeAdditionaImageForCertificate(base_path, respCourse.scheduling.path_certificate_icon_1, formatImage, {...dimensionsLogos, position: 'right'});
      if (logoImage64_1) {
        logoDataArray.push({
          imageBase64: logoImage64_1
        });
      }

      let logoImage64_2 = this.encodeAdditionaImageForCertificate(base_path, respCourse.scheduling.path_certificate_icon_2, formatImage, dimensionsLogos);
      if (logoImage64_2) {
        logoDataArray.push({
          imageBase64: logoImage64_2
        });
      }

      let signatureImage64_1 = this.encodeAdditionaImageForCertificate(base_path, respCourse.scheduling.path_signature_1, formatImage, dimensionsSignatures);
      if (signatureImage64_1) {
        signatureDataArray.push({
          imageBase64: signatureImage64_1,
          signatoryName: respCourse.scheduling?.signature_1_name || undefined,
          signatoryPosition: respCourse.scheduling?.signature_1_position || undefined,
          signatoryCompanyName: respCourse.scheduling?.signature_1_company || undefined
        });
        console.log(`Signature : ${signatureDataArray[0].signatoryName}`);
      }

      let signatureImage64_2 = this.encodeAdditionaImageForCertificate(base_path, respCourse.scheduling.path_signature_2, formatImage, dimensionsSignatures);
      if (signatureImage64_2) {
        signatureDataArray.push({
          imageBase64: signatureImage64_2,
          signatoryName: respCourse.scheduling?.signature_2_name || undefined,
          signatoryPosition: respCourse.scheduling?.signature_2_position || undefined,
          signatoryCompanyName: respCourse.scheduling?.signature_2_company || undefined
        });
        console.log(`Signature : ${signatureDataArray[1].signatoryName}`);
      }

      //#endregion Check for Logos and Signature

      //#endregion

      //#region   >>>> 3. Validations to generate Certificate
      //schedulingStatus
      // 3.1. Estatus de Programa: se permite generar si está confirmado o ejecutado.
      console.log("Program Status --> " + respCourse.scheduling.schedulingStatus.name);
      console.log(`enrollmentCode: ${params.certificateConsecutive}`);

      if (respCourse.scheduling.schedulingStatus.name == 'Programado' || respCourse.scheduling.schedulingStatus.name == 'Cancelado') {
        return responseUtility.buildResponseFailed('json', null,
          { error_key: { key: 'certificate.requirements.program_status', params: { error: respCourse.scheduling.schedulingStatus.name } } });
      }

      // 3.2. Tipo de programa
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
      const consecutive = parseInt(params.certificateConsecutive.replace(`${respCourse.scheduling.metadata.service_id}-`, ''));

      // Only generates new consecutive number for new Certificate
      let mapping_numero_certificado = (params.certificateHash) ?
        params.certificateConsecutive :
        respCourse.scheduling.metadata.service_id + '-' + consecutive.toString().padStart(4, '0');

      let schedulingType = respCourse.scheduling.schedulingType;

      console.log('........................................................................................................');
      console.log('Certificado para ' + respDataUser.user.profile.full_name + ' ---- ' +consecutive);
      console.log('........................................................................................................');

      // 3.3. Estatus de estudiante en Moodle
      // - Asistencias
      // - Entregas de actividades completas

      let reviewAuditorCerficateRules = false;
      let isAuditorCerficateByProgressEnabled = false;

      //#region     3.4 Tipo de programa
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

      // applies for "inter institutional agreement"
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

      // console.log(programTypeName);
      // console.log("---------------------");
      // console.log(respDataUser);
      // console.log(respCourse);
      // console.log("---------------------");

      //#endregion  3.4 Tipo de programa
      //#endregion   >>>> 3. Validations to generate Certificate

      //#region   >>>> 4. Reglas para Certificado 2 (Auditor)
      if (respCourse.scheduling.auditor_certificate) {
        reviewAuditorCerficateRules = true;
      }
      //#endregion  Reglas para Certificado de Auditor

      //#region ↓↓↓↓↓↓↓ 5. Reglas para cualquier tipo de formación
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

        let mappingAcademicList: any;

        // console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++");
        // console.log("Check rules for " + respCourse.scheduling.schedulingMode.name.toLowerCase());

        let progressData = studentProgressList.listOfStudentProgress[0].student.studentProgress;

        // console.log(`******** Academic Modules List -->`)
        // console.log(`progressData.approved_modules: `);
        // console.log(progressData.approved_modules);

        //#region Setting for VIRTUAL
        if (respCourse.scheduling.schedulingMode.name.toLowerCase() == 'virtual') {

          isComplete = true;
          mapping_dato_1 = progressData.attended_approved;
          mapping_titulo_certificado = (respCourse.scheduling.certificate) ? respCourse.scheduling.certificate : respCourse.scheduling.program.name;
          console.log(mapping_titulo_certificado);

          if (respCourseDetails.schedulings) {
            mappingAcademicList = this.formatAcademicModulesList(progressData.approved_modules, programTypeName, formatListModules);
            mapping_listado_cursos = mappingAcademicList.mappingModules;
          }
          mapping_intensidad = respCourse.scheduling.duration;
        }
        //#endregion Setting for VIRTUAL

        //#region Setting for ON SITE - ON LINE
        if (respCourse.scheduling.schedulingMode.name.toLowerCase() == 'presencial' ||
          respCourse.scheduling.schedulingMode.name.toLowerCase() == 'en linea') {

          if (progressData.status == 'ok') {

            isComplete = true;
            mapping_dato_1 = progressData.attended_approved;

            mapping_titulo_certificado = (respCourse.scheduling.certificate) ? respCourse.scheduling.certificate : respCourse.scheduling.program.name;
            //#region Listado de Módulos (cursos) que comprende el programa
            if (respCourseDetails.schedulings) {
              mappingAcademicList = this.formatAcademicModulesList(progressData.approved_modules, programTypeName, formatListModules);
              mapping_listado_cursos = mappingAcademicList.mappingModules;
            }
            mapping_intensidad = respCourse.scheduling.duration;
            //#endregion

          }
          else if (progressData.status == 'partial') {
            // Certificado Parcial
            let certificateName = (respCourse.scheduling.certificate) ? respCourse.scheduling.certificate : respCourse.scheduling.program.name;
            console.log('[ módulos aprobados: ]');
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
              mappingAcademicList = this.formatAcademicModulesList(progressData.approved_modules, null, formatListModules, false);
              mapping_listado_cursos = mappingAcademicList.mappingModules;
              mapping_intensidad = mappingAcademicList.totalDuration;
            }
            //#endregion
          }

        }
        //#endregion Setting for ON SITE

        isAuditorCerficateByProgressEnabled = (progressData.auditor && studentProgressList.auditorQuizApplies) ? true : false;

        // console.log('Progress for Student:');
        // console.log(progressData);
        // console.log("-->" + respDataUser.user.profile.full_name + " " + mapping_dato_1);
      }
      else {
        console.log('No hay datos de Estudiante para evaluar!')
        return responseUtility.buildResponseFailed('json')
      }
      //#endregion ↑↑↑↑↑↑ Reglas para cualquier tipo de formación

      //#region Build the certificate Parameters
      const currentDate = new Date(Date.now());

      if (logoDataArray.length != 0) {
        if (logoDataArray.length == 1) {
          location8 = (logoDataArray[0]) ? logoDataArray[0].imageBase64 : null;
        }
        else {
          location8 = (logoDataArray[0]) ? logoDataArray[0].imageBase64 : null;
          location3 = (logoDataArray[1]) ? logoDataArray[1].imageBase64 : null;
        }
      }

      // check if is New Certificate or a re-issue
      let intensidad: any = generalUtility.getDurationFormatedForCertificate(mapping_intensidad)
      let modulo = mapping_template;
      let asistio = null
      let fecha_certificado: any = currentDate;
      let fecha_aprobacion = respCourse.scheduling.endDate;
      let fecha_ultima_modificacion = null;
      let fecha_renovacion = null;
      let fecha_vencimiento = null;
      let fecha_impresion: any = currentDate;
      let dato_16 = '';
      let dato_15 = ''

      if (certificationMigration) {
        intensidad = parseInt(intensidad)
        modulo = respCourse.scheduling.program.code // 'IN-1W2345-09' // TODO: En este campo debe ir el CODIGO del programa (Por ahora debe quedar IN-1W2345-09)
        asistio = '1'
        fecha_certificado = fecha_certificado.toISOString().split('T')[0];
        fecha_aprobacion = fecha_aprobacion.toISOString().split('T')[0]
        fecha_impresion = fecha_impresion.toISOString().split('T')[0]
      }

      if (isReissue == false) {

        // ***** New Certificate ***********
        //#region certificate type 1 Parameters (Academic type)

        let certificateParams: ICertificate = {
          modulo,
          numero_certificado: mapping_numero_certificado,
          correo: respDataUser.user.email,
          documento: respDataUser.user.profile.doc_type + " " + respDataUser.user.profile.doc_number,
          nombre: respDataUser.user.profile.full_name.toUpperCase(),
          asistio,
          // certificado: mapping_titulo_certificado.toUpperCase().replace(/\(/g, this.left_parentheses).replace(/\)/g, this.right_parentheses),
          certificado: mapping_titulo_certificado.toUpperCase(),
          certificado_ingles: '',
          alcance: '',
          alcance_ingles: '',
          intensidad: intensidad,
          listado_cursos: mapping_listado_cursos,
          regional: '',
          ciudad: mapping_ciudad,
          pais: mapping_pais,
          fecha_certificado,
          fecha_aprobacion,
          fecha_ultima_modificacion,
          fecha_renovacion,
          fecha_vencimiento,
          fecha_impresion,
          dato_1: mapping_dato_1,
          // dato_1: 'Asistió al',
          dato_2: moment(respCourse.scheduling.endDate).locale('es').format('LL'),
          // primer logo
          dato_3: location3,
          // primera firma
          dato_4: (signatureDataArray.length != 0 && signatureDataArray[0]) ? signatureDataArray[0].imageBase64 : null,
          dato_5: (signatureDataArray.length != 0 && signatureDataArray[0]) ? signatureDataArray[0].signatoryName : null,
          dato_6: (signatureDataArray.length != 0 && signatureDataArray[0]) ? signatureDataArray[0].signatoryPosition : null,
          dato_7: (signatureDataArray.length != 0 && signatureDataArray[0]) ? signatureDataArray[0].signatoryCompanyName : null,

          // segundo logo
          dato_8: location8,
          // segunda firma
          dato_9: (signatureDataArray.length != 0 && signatureDataArray[1]) ? signatureDataArray[1].imageBase64 : null,
          dato_10: (signatureDataArray.length != 0 && signatureDataArray[1]) ? signatureDataArray[1].signatoryName : null,
          dato_11: (signatureDataArray.length != 0 && signatureDataArray[1]) ? signatureDataArray[1].signatoryPosition : null,
          dato_12: (signatureDataArray.length != 0 && signatureDataArray[1]) ? signatureDataArray[1].signatoryCompanyName : null,

          dato_13: mapping_dato_13,
          dato_15,
          dato_16,
        }
        console.log("[1]------------------------------------------");
        console.log("Set first Certificate: ");

        certificateParamsArray.push({
          queueData: params,
          template: mapping_template,
          certificateType: certificate_type.academic,
          paramsHuella: certificateParams,
          programName: (respCourse.scheduling.certificate) ? respCourse.scheduling.certificate : respCourse.scheduling.program.name,
          isComplete: isComplete
        });
        //console.log(certificateParams);
        console.log("[1]------------------------------------------");

        //#endregion

        //#region certificate type 2 (auditor Type)

        // Second certificate: auditor Certificate
        if (isAuditorCerficateByProgressEnabled) {
          // get modules need to process Second certificate
          isComplete = true;
          // location for logos setup
          let location3 = null;
          let location8 = null;

          let mappingAuditorList: any = this.formatAuditorModules(respCourse.scheduling.auditor_modules, formatListModules);
          console.log(mappingAuditorList.mappingModules);

          if (logoDataArray.length != 0) {
            if (logoDataArray.length == 1) {
              location8 = (logoDataArray[0]) ? logoDataArray[0].imageBase64 : null;
            }
            else {
              location3 = (logoDataArray[0]) ? logoDataArray[0].imageBase64 : null;
              location8 = (logoDataArray[1]) ? logoDataArray[1].imageBase64 : null;
            }
          }

          let dato_16Auditor = '';
          let intensidadAuditor: any = generalUtility.getDurationFormatedForCertificate(mappingAuditorList.totalDuration)

          if (certificationMigration) {
            intensidadAuditor = parseInt(intensidadAuditor)
            dato_16Auditor = 'H'
          }

          let auditorCertificateParams: ICertificate = {
            modulo,
            numero_certificado: mapping_numero_certificado + '-A',
            correo: respDataUser.user.email,
            documento: respDataUser.user.profile.doc_type + " " + respDataUser.user.profile.doc_number,
            nombre: respDataUser.user.profile.full_name.toUpperCase(),
            asistio,
            // certificado: respCourse.scheduling.auditor_certificate.toUpperCase().replace(/\(/g, this.left_parentheses).replace(/\)/g, this.right_parentheses),
            certificado: respCourse.scheduling.auditor_certificate.toUpperCase(),
            certificado_ingles: '',
            alcance: '',
            alcance_ingles: '',
            intensidad: intensidadAuditor,
            listado_cursos: mappingAuditorList.mappingModules,
            regional: '',
            ciudad: mapping_ciudad,
            pais: mapping_pais,
            fecha_certificado,
            fecha_aprobacion,
            fecha_ultima_modificacion: null,
            fecha_renovacion: null,
            fecha_vencimiento: null,
            fecha_impresion,
            dato_1: "Asistió y aprobó el",
            dato_2: moment(respCourse.scheduling.endDate).locale('es').format('LL'),

            // primer logo
            dato_3: location3,
            // primera firma
            dato_4: (signatureDataArray.length != 0 && signatureDataArray[0]) ? signatureDataArray[0].imageBase64 : null,
            dato_5: (signatureDataArray.length != 0 && signatureDataArray[0]) ? signatureDataArray[0].signatoryName : null,
            dato_6: (signatureDataArray.length != 0 && signatureDataArray[0]) ? signatureDataArray[0].signatoryPosition : null,
            dato_7: (signatureDataArray.length != 0 && signatureDataArray[0]) ? signatureDataArray[0].signatoryCompanyName : null,

            // segundo logo
            dato_8: location8,
            // segunda firma
            dato_9: (signatureDataArray.length != 0 && signatureDataArray[1]) ? signatureDataArray[1].imageBase64 : null,
            dato_10: (signatureDataArray.length != 0 && signatureDataArray[1]) ? signatureDataArray[1].signatoryName : null,
            dato_11: (signatureDataArray.length != 0 && signatureDataArray[1]) ? signatureDataArray[1].signatoryPosition : null,
            dato_12: (signatureDataArray.length != 0 && signatureDataArray[1]) ? signatureDataArray[1].signatoryCompanyName : null,

            dato_13: mapping_dato_13,
            dato_15,
            dato_16: dato_16Auditor
          }
          //certificateParams.numero_certificado = mapping_numero_certificado + 'A';
          //certificateParams.certificado = 'Auditor en ' + respCourse.scheduling.program.name;

          certificateParamsArray.push({
            queueData: {
              certificateQueueId: null, // as new record
              userId: params.userId, // Nombre de usario
              courseId: params.courseId,
              auxiliarId: params.auxiliarId,
              certificateConsecutive: ''
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

        //#endregion

      }
      else {
        // Only for re-issue.
        if (isAuditorCertificate == false) {

          let certificateParams: ICertificate = {
            modulo: mapping_template,
            numero_certificado: mapping_numero_certificado,
            correo: respDataUser.user.email,
            documento: respDataUser.user.profile.doc_type + " " + respDataUser.user.profile.doc_number,
            nombre: respDataUser.user.profile.full_name.toUpperCase(),
            asistio: null,
            certificado: mapping_titulo_certificado.toUpperCase().replace(/\(/g, this.left_parentheses).replace(/\)/g, this.right_parentheses),
            certificado_ingles: '',
            alcance: '',
            alcance_ingles: '',
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
            dato_3: location3,
            // primera firma
            dato_4: (signatureDataArray.length != 0 && signatureDataArray[0]) ? signatureDataArray[0].imageBase64 : null,
            dato_5: (signatureDataArray.length != 0 && signatureDataArray[0]) ? signatureDataArray[0].signatoryName : null,
            dato_6: (signatureDataArray.length != 0 && signatureDataArray[0]) ? signatureDataArray[0].signatoryPosition : null,
            dato_7: (signatureDataArray.length != 0 && signatureDataArray[0]) ? signatureDataArray[0].signatoryCompanyName : null,

            // segundo logo
            dato_8: location8,
            // segunda firma
            dato_9: (signatureDataArray.length != 0 && signatureDataArray[1]) ? signatureDataArray[1].imageBase64 : null,
            dato_10: (signatureDataArray.length != 0 && signatureDataArray[1]) ? signatureDataArray[1].signatoryName : null,
            dato_11: (signatureDataArray.length != 0 && signatureDataArray[1]) ? signatureDataArray[1].signatoryPosition : null,
            dato_12: (signatureDataArray.length != 0 && signatureDataArray[1]) ? signatureDataArray[1].signatoryCompanyName : null,

            dato_13: mapping_dato_13
          }
          console.log("[3]------------------------------------------");
          console.log("Re-issue first Certificate: ");

          certificateParamsArray.push({
            queueData: params,
            template: mapping_template,
            certificateType: certificate_type.academic,
            paramsHuella: certificateParams,
            programName: (respCourse.scheduling.certificate) ? respCourse.scheduling.certificate : respCourse.scheduling.program.name,
            isComplete: isComplete
          });
          //console.log(certificateParams);
          console.log("[3]------------------------------------------");
        }
        else {
          // Auditor Certificate re-issue
          // get modules need to process Second certificate
          isComplete = true;
          // location for logos setup
          let location3 = null;
          let location8 = null;

          let mappingAuditorList: any = this.formatAuditorModules(respCourse.scheduling.auditor_modules);
          console.log(mappingAuditorList.mappingModules);

          if (logoDataArray.length != 0) {
            if (logoDataArray.length == 1) {
              location8 = (logoDataArray[0]) ? logoDataArray[0].imageBase64 : null;
            }
            else {
              location3 = (logoDataArray[0]) ? logoDataArray[0].imageBase64 : null;
              location8 = (logoDataArray[1]) ? logoDataArray[1].imageBase64 : null;
            }
          }

          let auditorCertificateParams: ICertificate = {
            modulo: mapping_template,
            numero_certificado: mapping_numero_certificado + '-A',
            correo: respDataUser.user.email,
            documento: respDataUser.user.profile.doc_type + " " + respDataUser.user.profile.doc_number,
            nombre: respDataUser.user.profile.full_name.toUpperCase(),
            asistio: null,
            certificado: respCourse.scheduling.auditor_certificate.toUpperCase().replace(/\(/g, this.left_parentheses).replace(/\)/g, this.right_parentheses),
            certificado_ingles: '',
            alcance: '',
            alcance_ingles: '',
            intensidad: generalUtility.getDurationFormatedForCertificate(mappingAuditorList.totalDuration),
            listado_cursos: mappingAuditorList.mappingModules,
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
            dato_3: location3,
            // primera firma
            dato_4: (signatureDataArray.length != 0 && signatureDataArray[0]) ? signatureDataArray[0].imageBase64 : null,
            dato_5: (signatureDataArray.length != 0 && signatureDataArray[0]) ? signatureDataArray[0].signatoryName : null,
            dato_6: (signatureDataArray.length != 0 && signatureDataArray[0]) ? signatureDataArray[0].signatoryPosition : null,
            dato_7: (signatureDataArray.length != 0 && signatureDataArray[0]) ? signatureDataArray[0].signatoryCompanyName : null,

            // segundo logo
            dato_8: location8,
            // segunda firma
            dato_9: (signatureDataArray.length != 0 && signatureDataArray[1]) ? signatureDataArray[1].imageBase64 : null,
            dato_10: (signatureDataArray.length != 0 && signatureDataArray[1]) ? signatureDataArray[1].signatoryName : null,
            dato_11: (signatureDataArray.length != 0 && signatureDataArray[1]) ? signatureDataArray[1].signatoryPosition : null,
            dato_12: (signatureDataArray.length != 0 && signatureDataArray[1]) ? signatureDataArray[1].signatoryCompanyName : null,

            dato_13: mapping_dato_13
          }

          console.log("[4]------------------------------------------");
          console.log("Re-issue Second Certificate: ");

          certificateParamsArray.push({
            queueData: {
              certificateQueueId: null, // as new record
              userId: params.userId, // Nombre de usario
              courseId: params.courseId,
              auxiliarId: params.auxiliarId,
              certificateConsecutive: ''
            },
            certificateType: certificate_type.auditor,
            template: mapping_template,
            paramsHuella: auditorCertificateParams,
            programName: (respCourse.scheduling.certificate) ? respCourse.scheduling.certificate : respCourse.scheduling.program.name,
            isComplete: isComplete
          });
          console.log("[4]------------------------------------------");
        }
      }
      //#endregion

      return certificateParamsArray;
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
    reviewAuditorCerficateRulesEnabled: boolean,
    auditorModules: any[],
    isForCertificate: boolean,
    userMoodleID?: string
  ) => {
    try {

      // respListOfActivitiesInModules.forEach(element => {
      //   console.log("..............................................")
      //   console.log('* ' + element.sectionid + ' > ' + element.sectionname);
      //   console.log('* ' + element.instance + ' - (' + element.modname + ') - ' + element.name);
      // });

      let modulesListByInstance = {}
      const modulesForProgress: any = await courseContentService.moduleList({ courseID: moodleCourseID, moduleType: [...this.selectActivitiesTest, 'scorm'] });
      if (modulesForProgress?.courseModules) {
        modulesListByInstance = modulesForProgress.courseModules.reduce((accum, element) => {
          if (element?.instance) {
            if (!accum[element?.instance]) {
              accum[element?.instance] = element;
            }
          }
          return accum;
        }, {});
      }
      // console.log('modulesListByInstance', modulesListByInstance)
      // console.log("===========================================")

      let listOfStudentProgress = [];
      let auditorQuizApplies = false;
      let responseStudentProgress;
      let firstCertificateIsAuditor = false;

      // Presencial - Online
      // Asistencia >= 75
      const respUserGrades: any = await gradesService.fetchGradesByFilter({
        courseID: moodleCourseID,
        userID: (userMoodleID) ? userMoodleID.toString() : '0',
        filter: moduleType
      });

      if (respUserGrades.error) {
        console.log(`Error with Course ID: ${moodleCourseID}`);

        // studentProgress.status = 'error';
        // studentProgress.attended_approved = 'error';
        // return studentProgress;
        return null;
      }

      // console.log('øøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøø');
      // console.dir(respUserGrades.grades, { depth: null });
      // console.log('øøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøø');

      for await (const student of respUserGrades.grades) {

        let programTypeText;
        let studentProgress = {
          status: '',
          attended_approved: '',
          average_grade: null,
          completion: null,
          assistance: null,
          assistanceDetails: {
            total: 0,
            attended: 0,
            percentage: 0,
          },
          quizGrade: null,
          auditorGradeC1: null,
          approved_modules: [],
          auditor: false,
          auditorCertificate: '',
          auditorGradeC2: null,      // auditor quiz grade only for C2
          progressByModule: {}
        };
        //let studentProgress: IStudentProgress;

        // console.log('øøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøø');
        // console.log(`Progress for: ${student.userData.userfullname}`);
        // console.log('øøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøøø');

        //#region REGLAS PARA PRESENCIAL Y EN LINEA

        if (schedulingMode == 'presencial' || schedulingMode == 'en linea') {

          let flagAttendance = true;
          let flagAttendanceCount = 0;
          let flagQuiz = true;
          let flagQuizCount = 0;

          //#region  :::::::::::: Attendance ::::::::::::

          /* Todas las asistencia debe estar igual o por encima de 75%.
            Si alguna no cumple esta regla, no se emite Condición por Asistencia
          */

          // console.log("[ *** Attendance Grades *** ]");
          for (const grade of student.itemType.attendance) {

            if (grade.graderaw) {
              // console.log("Grade: " + grade.name);
              // console.log("\t\t" + grade.graderaw);

              if (grade.graderaw < 75) {
                flagAttendance = false;
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
                flagAttendanceCount++;
              }
            }
            else {
              flagAttendance = false;
              // console.log("Grade: " + grade.name);
              // console.log("\t\t--");
              // console.log("\t\t--");
            }
          }
          if (flagAttendanceCount == 0) {
            flagAttendance = false;
          }

          //#endregion  :::::::::::: Attendance ::::::::::::

          //#region :::::::::::: Quiz ::::::::::::
          /* Todas los exámenes debe estar igual o por encima de 70%.
            Si alguna no cumple esta regla, no se emite Condición por Examen
          */
          // console.log("[ *** QUIZ Grades PR-ON*** ]");
          if (student.itemType.quiz.length > 0) {
            // look up for idnumber: 'auditor' ONLY
            let auditorQuiz = student.itemType.quiz.find(x => AUDITOR_EXAM_REGEXP.test(x.idnumber));
            // console.log('auditorQuiz found?');
            // console.log(auditorQuiz);

            if (auditorQuiz) {
              if (auditorQuiz.graderaw < 70) {
                flagQuiz = false;
              }
              else {
                flagQuiz = true;
                flagQuizCount++;
              }
              studentProgress.auditorGradeC1 = auditorQuiz.graderaw;
            }
            else
              flagQuiz = false;

            // for (const grade of student.itemType.quiz) {
            //   if (grade.graderaw < 70) {
            //     //flagQuiz = false;
            //     continue;
            //   }
            //   flagQuizCount++;
            // }
            // if (flagQuizCount < student.itemType.quiz.length)
            //   flagQuiz = false;
          }
          else
            flagQuiz = false;
          //#endregion :::::::::::: Quiz ::::::::::::

          //#region :::::::::::: Certification resolution ::::::::::::
          // Resolución: texto que indicará el grado alcanzado en el certificado; puede ser
          // * Asistencia
          // * Asistencia Parcial
          // * Asistencia y Aprobación (aplica solamente casos especiales)
          //console.log("Total attendance: " + flagAttendance);
          if (flagAttendance) {

            if (programTypeName == 'diplomado') {
              // this condition is to define where to put the text below: in Paper (certificate) or Review Screen
              if (isForCertificate)
                studentProgress.attended_approved = 'Asistió al';
              else
                studentProgress.attended_approved = 'Asistencia.';

            }
            else if (programTypeName == 'curso' || programTypeName == 'programa') {
              // flag for Auditor Quiz approved
              if (flagQuiz) {
                if (isForCertificate)
                  studentProgress.attended_approved = 'Asistió y aprobó el '; // + programTypeText;
                else
                  studentProgress.attended_approved = 'Asistencia y aprobación.';
              }
              else {
                if (isForCertificate)
                  studentProgress.attended_approved = 'Asistió al';
                else
                  studentProgress.attended_approved = 'Asistencia.';
              }

            }

            studentProgress.status = 'ok';
          }
          else {
            if (flagAttendanceCount > 0) {
              studentProgress.attended_approved = 'Certificado parcial.';
              studentProgress.status = 'partial';
            }
            else {
              studentProgress.attended_approved = 'No se certifica.';
              studentProgress.status = 'no';
            }
          }
          studentProgress.assistance = `${flagAttendanceCount}/${student.itemType.attendance.length}`;
          studentProgress.assistanceDetails = {
            total: student.itemType.attendance.length,
            attended: flagAttendanceCount,
            percentage: 0,
          }
          if (student.itemType.attendance.length > 0) {
            studentProgress.assistanceDetails.percentage = Math.round(((flagAttendanceCount * 100)/student.itemType.attendance.length) * 100) / 100
          }
          // en revisión este elemento: quizGrade
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
          let flagQuiz = true;
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
          const progressBySection = {}
          for (const completion of respCompletionStatus.completion) {
            if (completion.state == 1) {
              completionPercentage += 1;
            }
            if (modulesListByInstance[completion?.instance]) {
              const instance = modulesListByInstance[completion?.instance];
              if (instance?.sectionid) {
                if (!progressBySection[instance?.sectionid]) {
                  progressBySection[instance?.sectionid] = {
                    totalComplete: 0,
                    totalIncomplete: 0,
                    total: 0,
                  }
                }
                progressBySection[instance?.sectionid].total += 1;
                if (completion.state == 1) {
                  progressBySection[instance?.sectionid].totalComplete += 1;
                } else {
                  progressBySection[instance?.sectionid].totalIncomplete += 1;
                }
              }
            }
          }
          completionPercentage /= respCompletionStatus.completion.length;
          studentProgress.average_grade = Math.trunc(average);
          studentProgress.completion = Math.trunc(completionPercentage * 100);
          for (const section in progressBySection) {
            if (Object.prototype.hasOwnProperty.call(progressBySection, section)) {
              const item = progressBySection[section];
              if (!studentProgress.progressByModule[section]) {
                studentProgress.progressByModule[section] = {
                  totalComplete: item.totalComplete,
                  totalIncomplete: item.totalIncomplete,
                  total: item.total,
                  percentage: 0
                }
                if (item.totalComplete > 0 && item.total > 0) {
                  studentProgress.progressByModule[section].percentage = Math.round((item.totalComplete / item.total) * 100)
                }
              }
            }
          }

          // keep compatibilty with OnSitu/Online modes
          respSchedulingsDetails.forEach(element => {
            studentProgress.approved_modules.push({ name: element.course.name, duration: element.duration });
          });

          //#endregion :::::::::::: Completion percentage ::::::::::::

          //#region :::::::::::: Quiz ::::::::::::
          /* Todas los exámenes debe estar igual o por encima de 70%.
            Si alguna no cumple esta regla, no se emite Condición por Examen
          */
          // console.log("[ *** QUIZ Grades VIRTUAL *** ]");
          if (student.itemType.quiz.length > 0) {
            // look up for idnumber: 'auditor' ONLY
            let auditorQuiz = student.itemType.quiz.find(x => AUDITOR_EXAM_REGEXP.test(x.idnumber));
            // console.log('auditorQuiz found?');
            // console.log(auditorQuiz);

            if (auditorQuiz) {
              if (auditorQuiz.graderaw < 70) {
                flagQuiz = false;
              }
              else {
                flagQuiz = true;
              }
              studentProgress.auditorGradeC1 = auditorQuiz.graderaw;
            }
            else
              flagQuiz = false;
          }
          else
            flagQuiz = false;
          //#endregion :::::::::::: Quiz ::::::::::::

          //#region :::::::::::: Certification resolution ::::::::::::

          //if (programTypeName === 'diplomado' || programTypeName === 'curso')

          if (programTypeName === 'diplomado') {
            if (studentProgress.completion == 100 && studentProgress.average_grade >= 70) {
              programTypeText = (programTypeName) ? ' al ' : '.';
              if (isForCertificate)
                studentProgress.attended_approved = 'Asistió al ';
              else
                studentProgress.attended_approved = 'Asistencia.'

              studentProgress.status = 'ok';
            }
            else {
              studentProgress.attended_approved = 'No se certifica.';
              studentProgress.status = 'no';
            }
          }
          else if (programTypeName == 'curso' || programTypeName == 'programa') {
            if (flagQuiz) {

              if (studentProgress.completion == 100 && studentProgress.average_grade >= 70) {
                programTypeText = (programTypeName) ? ' el ' : '.';
                if (isForCertificate)
                  studentProgress.attended_approved = 'Asistió y aprobó el ';
                else
                  studentProgress.attended_approved = 'Asistencia y Aprobación.'

                studentProgress.status = 'ok';
              }
              else {
                studentProgress.attended_approved = 'No se certifica.';
                studentProgress.status = 'no';
              }
            }
            else {
              if (studentProgress.completion == 100 && studentProgress.average_grade >= 70) {
                programTypeText = (programTypeName) ? ' al ' : '.';
                if (isForCertificate)
                  studentProgress.attended_approved = 'Asistió al ';
                else
                  studentProgress.attended_approved = 'Asistencia.'

                studentProgress.status = 'ok';
              }
              else {
                studentProgress.attended_approved = 'No se certifica.';
                studentProgress.status = 'no';
              }

            }
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


        //#region REGLAS PARA CERTIFICADO DE AUDITOR - TIPO 2
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
              studentProgress.auditorGradeC2 = quizGrade.graderaw;
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
      // console.log("──────────────────────────────────────────────────────────");
      // console.log("Auditor Quiz applied: " + auditorQuizApplies);
      // console.log("──────────────────────────────────────────────────────────");

      // firstCertificateIsAuditor check condition:
      // if any Student has grade in auditorGradeC1
      firstCertificateIsAuditor = Object.values(listOfStudentProgress).some(val => val.student.studentProgress.auditorGradeC1 != null);
      // console.log(`firstCertificateIsAuditor: ${firstCertificateIsAuditor}`);

      responseStudentProgress = {
        auditorQuizApplies,
        firstCertificateIsAuditor,
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

  /**
   *  request to create a new Certificate to "Huella de Confianza"
   */
  public requestSetCertificate = async (certificateParamsArray: ISetCertificateParams[]) => {
    const responseCertQueueArray = [];
    let counter = 1;
    for await (const certificateReq of certificateParamsArray) {

      console.log("Certificate n° " + counter);

      const courseScheduling = await CourseScheduling.findOne({_id: certificateReq.queueData.courseId}).select('metadata')

      const certificationMigration = this.certificateProviderStrategy(courseScheduling.metadata.service_id)
      const certificateIssuer = certificationMigration ? 'acredita' : 'huella'

      const responseCertificateQueue: any = await certificateQueueService.insertOrUpdate({
        id: certificateReq.queueData.certificateQueueId,
        courseId: certificateReq.queueData.courseId,
        users: [certificateReq.queueData.userId],
        certificateType: certificateReq.certificateType,
        certificateConsecutive: certificateReq.paramsHuella.numero_certificado,
        status: 'In-process',
        message: '',
        auxiliar: certificateReq.queueData.auxiliarId
      });
      const registerId = (certificateReq.queueData.certificateQueueId) ? (certificateReq.queueData.certificateQueueId) : responseCertificateQueue.certificateQueue._id;

      const responseIssuer = {
        status: '',
        serviceResponse: '',
        responseService: {},
        certificate: {
          hash: '',
          url: '',
          urlCredencial: '',
          source: ''
        },
        reason: ''
      }

      if (certificateIssuer === 'huella') {
        const respToken: any = await this.login();
        if (respToken.status == 'error') {
          return responseUtility.buildResponseFailed('json', null,
            { error_key: { key: 'certificate.login_invalid' } })
        }
        const tokenHC = respToken.token;

        const respHuella: any = await queryUtility.query({
          method: 'post',
          url: certificate_setup.endpoint.create_certificate,
          api: 'huellaDeConfianza',
          headers: { Authorization: tokenHC },
          params: JSON.stringify(certificateReq.paramsHuella)
        });
        responseIssuer.status = 'success'
        responseIssuer.serviceResponse = respHuella?.estado || 'No response data'
        responseIssuer.responseService = respHuella
        responseIssuer.certificate = {
          hash: respHuella?.resultado?.certificado,
          url: respHuella?.resultado?.url,
          source: 'huella',
          urlCredencial: '',
        }
        if (respHuella?.status === 'error' || respHuella?.estado === 'Error') {
          responseIssuer.status = 'error'
        }
      } else {
        const username = 'LegadoCampus'
        const password = 'quAngEraMuSTerGerEDE'
        const basicAuthHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');

        const respIssuer: any = await queryUtility.query({
          method: 'post',
          url: certificate_setup.endpoint.create_certificate_acredita,
          api: 'acredita',
          headers: {
            Authorization: basicAuthHeader
          },
          params: certificateReq.paramsHuella,
          sendBy: 'body'
        });
        responseIssuer.status = respIssuer.status || 'error'
        responseIssuer.serviceResponse = 'N/A'
        responseIssuer.responseService = respIssuer
        if (respIssuer?.resultado && respIssuer?.codigo === '200') {
          // const urlSplited = respIssuer?.url.split('/')
          responseIssuer.status = 'success';
          responseIssuer.certificate = {
            hash: respIssuer?.hash,
            source: 'acredita',
            // hash:urlSplited[urlSplited.length - 1],
            url: respIssuer?.url,
            urlCredencial: respIssuer?.urlCredencial
          }
        } else if (respIssuer?.resultado && respIssuer?.codigo === '404') {
          responseIssuer.reason = respIssuer?.resultado || 'Se ha presentado un error al generar el certificado'
        }
      }
      await certificateLogsService.insertOrUpdate({
        serviceResponse: responseIssuer.serviceResponse,
        idCertificateQueue: registerId,
        message: '',
        process: 'Set certificate',
        requestData: certificateReq.paramsHuella,
        responseService: responseIssuer.responseService
      });

      if (responseIssuer.status !== 'error') {
        const responseCertQueue: any = await certificateQueueService.insertOrUpdate({
          id: registerId,
          status: 'Requested',
          message: certificateReq.paramsHuella.certificado,
          certificateModule: certificateReq.paramsHuella.modulo,
          certificateType: certificateReq.certificateType,
          certificateConsecutive: certificateReq.paramsHuella.numero_certificado,
          auxiliar: certificateReq.queueData.auxiliarId,
          certificate: {
            source: responseIssuer.certificate.source,
            hash: responseIssuer.certificate.hash,
            url: responseIssuer.certificate.url,
            urlCredencial: responseIssuer.certificate.urlCredencial,
            title: (certificateReq.isComplete) ? certificateReq.paramsHuella.certificado : 'Certificado Parcial de ' + certificateReq.programName,
            date: certificateReq.paramsHuella.fecha_aprobacion
          }
        });

        responseCertQueueArray.push(responseCertQueue);

        await this.previewCertificate({
          certificate_queue: registerId,
          hash: responseIssuer.certificate.hash,
          format: 2,
          template: 1,
          updateCertificate: true,
        })
        counter++;
      } else {
        const responseCertQueue: any = await certificateQueueService.insertOrUpdate({
          id: registerId,
          status: 'Error',
          errorMessage: responseIssuer.reason
        });

        responseCertQueueArray.push(responseCertQueue);
      }

    }
    return responseCertQueueArray;
  }

  /**
   *  request to edit an existing Certificate to "Huella de Confianza"
   */
  private requestPutCertificate = async (certificateParamsArray: ISetCertificateParams[]) => {

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
        certificateConsecutive: certificateReq.paramsHuella.numero_certificado,
        status: 'In-process',
        message: '',
        auxiliar: certificateReq.queueData.auxiliarId
      });

      // console.log("--> After Insert/update cerfificateQueue:");
      // console.log(responseCertificateQueue.certificateQueue);

      // console.log("--> Send request to UPDATE Certificate on Huella de Confianza:");
      // console.log(`--> certificateReq.certificateQueue.hash ${responseCertificateQueue.certificateQueue.certificate.hash}`);
      // console.log('paramsHuella:');
      // console.log(certificateReq.paramsHuella);

      // Build request for Update Certificate
      let respHuella: any = await queryUtility.query({
        method: 'post',
        url: certificate_setup.endpoint.create_certificate,
        api: 'huellaDeConfianza',
        headers: { Authorization: tokenHC },
        // querystringParams: { id: responseCertificateQueue.certificateQueue.certificate.hash },
        params: JSON.stringify(certificateReq.paramsHuella)
      });
      console.log("**************************");
      console.log(respHuella);
      console.log("**************************");

      let registerId = (certificateReq.queueData.certificateQueueId) ? (certificateReq.queueData.certificateQueueId) : responseCertificateQueue.certificateQueue._id;
      // console.log("--> Register to update " + registerId);

      await certificateLogsService.insertOrUpdate({
        serviceResponse: respHuella.estado,
        idCertificateQueue: registerId,
        message: "",
        process: 'Re-issue certificate',
        reissueRequestData: certificateReq.paramsHuella,
        responseService: respHuella
      });

      // console.log("***************************");
      // console.log(responseLog);
      // console.log("***************************");

      let responseCertQueue: any = await certificateQueueService.insertOrUpdate({
        id: registerId, //(certificateReq.queueData.certificateQueueId) ? (certificateReq.queueData.certificateQueueId) : responseCertificateQueue.certificateQueue._id,
        status: 'Requested',
        message: certificateReq.paramsHuella.certificado,
        certificateModule: certificateReq.paramsHuella.modulo,
        certificateType: certificateReq.certificateType,
        certificateConsecutive: certificateReq.paramsHuella.numero_certificado,
        auxiliar: certificateReq.queueData.auxiliarId,
        certificate: {
          source: 'huella',
          hash: respHuella.resultado.certificado,
          url: respHuella.resultado.url,
          urlCredencial: '',
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
      if (params.updateCertificate) {
        const certificateQueue = await CertificateQueue.findOne({
          _id: params.certificate_queue
        }).populate([
          {
            path: 'courseId',
            select: 'id program metadata certificate auditor_certificate certificate_students certificate_clients multipleCertificate',
            populate: [{ path: 'program', select: 'id name code' }]
          }, {
            path: 'userId',
            select: 'profile'
          }
        ])

        const { courseId: courseScheduling, userId: user } = certificateQueue;

        const updateData = {
          $set: {
            "status": 'Complete'
          }
        }

        if (updateData) {
          if (courseScheduling?.certificate_students === true) {
            let forceNotificationSended = false;
            if (courseScheduling?.multipleCertificate?.status === true) {
              const notifications = await MailMessageLog.find({
                notification_source: {$regex: `participant_certificated_${user._id}_${courseScheduling._id}`}
              })
              .select('id')
              if (notifications.length > 0) {
                forceNotificationSended = true
              }
            }
            const notificationResponse = await notificationEventService.sendNotificationParticipantCertificated({
              certificateQueueId: certificateQueue._id,
              participantId: user._id,
              courseSchedulingId: courseScheduling._id,
              consecutive: certificateQueue.certificateConsecutive,
              forceNotificationSended
            });
            updateData['$set']['notificationSent'] = true
          }
          await CertificateQueue.findByIdAndUpdate(params.certificate_queue, updateData, { useFindAndModify: false, new: true })
        }
      }

      await certificateLogsService.insertOrUpdate({
        serviceResponse: 'OK', // respHuella.estado,
        idCertificateQueue: params.certificate_queue,
        message: 'Certificate complete',
        process: 'Complete',
      });

      const certificate = await CertificateQueue.findOne({ _id: params.certificate_queue })

      // Get Certificate Detail
      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          // tokenHC: tokenHC,
          preview: undefined, // (params.showPreviewBase64 === true) ? respHuella.resultado : undefined,
          certificate: {
            filename: `${certificate?.certificate?.hash}.pdf`, // filename,
            url: certificate?.certificate?.url,
            imagePath: certificate?.certificate?.imagePath ? this.certificateUrl(certificate?.certificate.imagePath) : null,
            pdfPath: certificate?.certificate?.hash ? this.certificateUrlV2(certificate?.certificate) : null,
            date: certificate?.certificate.date
          }
        }
      });

    }

    catch (e) {
      return responseUtility.buildResponseFailed('json', null, {message: e.message.toString()})
    }
  }

  public forceStage = async (params: ICertificateForceStage) => {
    try {
      if (!params.category) return responseUtility.buildResponseFailed('json', null, { error_key: "certificate.force_stage.params_invalid" })
      if (!params.certificateQueueIds) return responseUtility.buildResponseFailed('json', null, { error_key: "certificate.force_stage.params_invalid" })
      const isAsync = params.async || false

      // let status = undefined;
      // switch (params.category) {
      //   case CertificateCategory.FORCE_PREVIEW:
      //     status = 'Requested'
      //     break;
      // }
      // if (!status) return responseUtility.buildResponseFailed('json', null, { error_key: {key: "certificate.force_stage.error", params: {errorMessage: 'La categoria no tiene un valor valido'}} })

      // const query: any = {
      //   _id: {$in: params.certificateQueueIds},
      //   deleted: false
      // }

      // await CertificateQueue.updateMany(query, {
      //   $set: {
      //     status: status
      //   }
      // })
      // const certificatesQuery = await CertificateQueue.find({
      //   _id: {$in: params.certificateQueueIds},
      // });

      // const certificateLogs: {key: string, message: string, status: 'success' | 'error'}[] = []
      let logs = []
      if (isAsync) {
        certificateQueueService.processCertificateQueue({
          certificateQueueIds: params.certificateQueueIds,
          output: 'process'
        })
      } else {
        const responseProcess: any = await certificateQueueService.processCertificateQueue({
          certificateQueueIds: params.certificateQueueIds,
          output: 'process'
        })
        logs = responseProcess.logs || []
      }
      // for (let certificate of certificatesQuery) {
      //   try {
      //     const processResponse: any = await certificateQueueService.processCertificateQueue({
      //       certificateQueueId: certificate._id,
      //       output: 'process'
      //     })
      //     certificateLogs.push({
      //       key: certificate._id,
      //       message: processResponse?.message || '-',
      //       status: processResponse?.status || undefined
      //     })
      //   } catch (err) {
      //     certificateLogs.push({
      //       key: certificate._id,
      //       message: err?.message || 'Se ha presentado un error al procesar el certificado',
      //       status: 'error'
      //     })
      //     continue
      //   }
      // }

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          logs
        }
      })
    } catch (err) {
      return responseUtility.buildResponseFailed('json', null, {message: err?.message || 'Se ha presentado un error'})
    }
  }

  public reGenerateCertification = async (params: ICertificateReGenerate) => {
    try {
      const isMultiple = params.isMultiple || false;

      if (isMultiple) {
        if (!params.certificateQueueId) return responseUtility.buildResponseFailed('json', null, { error_key: "certificate.re_generate.params_invalid" })

        const certificate = await CertificateQueue.findOne({_id: params.certificateQueueId})

        const item: ICertificateQueueMultiple = {
          userId: certificate?.userId,
          courseId: certificate?.courseId,
          certificateSetting: certificate.certificateSetting,
          auxiliar: certificate.auxiliar,
          certificateType: certificate.certificateType,
          certificateConsecutive: certificate.certificateConsecutive,
          status: 'New',
          isPartial: certificate.isPartial,
        }

        await certificate.delete()

        const responseCertificateQueue = await CertificateQueue.create(item)

        if (responseCertificateQueue?._id) {
          certificateQueueService.processCertificateQueue({
            certificateQueueId: responseCertificateQueue?._id,
            output: 'process'
          })
        }

        return responseUtility.buildResponseSuccess('json', null)
      } else {
        if (!params.courseId) return responseUtility.buildResponseFailed('json', null, { error_key: "certificate.re_generate.params_invalid" })
        if (!params.userId) return responseUtility.buildResponseFailed('json', null, { error_key: "certificate.re_generate.params_invalid" })

        const query: any = {
          userId: params.userId,
          courseId: params.courseId,
          deleted: false
        }
        if (params.certificateQueueId) {
          query['_id'] = params.certificateQueueId
        }

        await CertificateQueue.delete(query)

        const responseQueue: any = await certificateQueueService.insertOrUpdate({
          users: [params.userId],
          courseId: params.courseId,
          auxiliar: params.auxiliar,
          status: "New"
        })

        if (responseQueue?.status === 'success' && responseQueue?.certificateQueue?._id) {
          certificateQueueService.processCertificateQueue({
            certificateQueueId: responseQueue?.certificateQueue?._id,
            output: 'process'
          })
        }

        return responseUtility.buildResponseSuccess('json', null)
      }

    } catch (err) {
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
      if (params.files) {
        params.files.map((item) => {
          zip.addLocalFile(item);
        })
      } else if (params.filesFromBuffer) {
        params.filesFromBuffer.map((item) => {
          if (item?.fileName && item.buffer) {
            zip.addFile(item.fileName, item.buffer);
          }
        })
      }
      zip.writeZip(full_path_file);

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          path: public_path_file,
          filename: params.to_file.file.name
        }
      })
    } catch (e) {
      console.log("[CertificateService] [generateZipCertifications] ERROR: ", e)
      return responseUtility.buildResponseFailed('json', null)
    }
  }

  public fetchCertification = async (certificateQueue: any) => {
    try {
      const certificationMigration = certificateQueue?.certificate?.source === 'acredita' ? true : false

      let api_link = customs['certificateBaseUrl_acredita']
      let url = `/${certificateQueue?.certificate?.hash}`
      if (certificationMigration) {
        api_link = 'N/A'
        url = `${certificateQueue?.certificate.url}`
      }

      const buffer = await queryUtility.query({
        api_link: api_link,
        method: 'get',
        url: url,
        responseBuffer: true
      })

      if (!Buffer.isBuffer(buffer)) return null

      const time = new Date().getTime()
      const fullName = generalUtility.normalizeFullName(certificateQueue.userId.profile.first_name, certificateQueue.userId.profile.last_name);
      const fileName = `${fullName}_${time}.pdf`
      return {fileName, buffer}
    } catch (err) {
      return null
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

  public certificateUrlV2 = (item) => {
    const certificationMigration = true
    // const certificationMigration = item?.source === 'acredita' ? true : false
    const ext = certificationMigration ? '' : '.pdf'
    let host = customs['certificateBaseUrl']
    const hasUrlCredencial = item?.urlCredencial || null;
    if (certificationMigration) {
      host = customs['certificateBaseUrl_acredita'];
      if (hasUrlCredencial) {
        host += `Pdf`
      }
    }
    return item?.hash && item?.hash !== ''
      ? `${host}/${item.hash}${ext}`
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

  public encodeAdditionaImageForCertificate = (base_path: string, imagePath: string, format: 'base64' | 'public_url' = 'base64', dimensions?: {width: number, height: number, position: string}) => {
    if (format === 'base64') {
      const height = dimensions?.height || 70;
      const width = dimensions?.width || 233;
      const position = dimensions?.position || 'center'

      let fullContentBase64 = '';

      if (imagePath) {

        let filePath = `${base_path}/${this.default_logo_path}/${imagePath}`;

        if (fileUtility.fileExists(filePath) === true) {
          const dimensionsFile = sizeOf(filePath)
          const {width: withImage, height: heightImage} = this.getImageDimensions({width, height}, dimensionsFile)
          const prefixMimeType = `<img style="float: ${position}; height:${heightImage}; width:${withImage}; margin-bottom:0px; margin-left:0px; margin-right:0px; margin-top:0px" src="data:image/png;base64,`;
          const sufixMimeType = `"/>`;

          const contentFile = fileUtility.readFileSyncBuffer(filePath);
          if (contentFile && contentFile.length > 0) {
            const dataArray = Buffer.from(contentFile);
            fullContentBase64 = `${prefixMimeType}${dataArray.toString('base64')}${sufixMimeType}`;
            return fullContentBase64;
          }
        }
      }
    } else if (format === 'public_url') {
      if (imagePath) {
        return `${customs['uploads']}/${this.default_logo_path}/${imagePath}`
      }
    }
    return null;
  }

  private getImageDimensions = (valuesDefault: {width: number, height: number}, imageDimensions: {width: number, height: number}) => {
    const relationDefault = valuesDefault.height / valuesDefault.width
    const relationImage = imageDimensions.height / imageDimensions.width
    let withImage = '';
    let heightImage = '';
    if (relationImage > relationDefault) {
      heightImage = `${valuesDefault.height}px`;
      withImage = `${Math.ceil(valuesDefault.height / relationImage)}px`
    } else {
      withImage = `${valuesDefault.width}px`
      heightImage = `${Math.ceil(valuesDefault.width * relationImage)}px`;
    }
    return {width: withImage, height: heightImage}
  }

  public getProgramTypeFromCode = (code: string) => {
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
    // console.log("codeProgram: " + codeProgram[0]);
    // console.log("abbr: " + programTypeName.abbr + " - Name:" + programTypeName.name);
    return programTypeName;
  }

  private getProgramTypeName = (abbr: string) => {
    let programTypeName = '';
    if (abbr === program_type_abbr.curso || abbr === program_type_abbr.curso_auditor) {
      programTypeName = 'curso';
    }
    if (abbr === program_type_abbr.programa || abbr === program_type_abbr.programa_auditor) {
      programTypeName = 'programa';
    }
    if (abbr === program_type_abbr.diplomado || abbr === program_type_abbr.diplomado_auditor) {
      programTypeName = 'diplomado';
    }
    return programTypeName;
  }


  /**
   * Format the modules list for Certificate 1
   */
  public formatAcademicModulesList = (academicModules: any, programTypeName: string, format: 'html' | 'plain' = 'html', showHeader: boolean = true) => {
    let mappingAcademicModulesList = '';
    let totalDuration = 0;
    try {
      if (format === 'html') {
        if (showHeader) mappingAcademicModulesList += 'El contenido comprendió: <br/>'
        if (programTypeName || programTypeName != null)
          mappingAcademicModulesList = 'El contenido del ' + programTypeName + ' comprendió: <br/>';

        mappingAcademicModulesList += '<ul>'
        academicModules.forEach(element => {
          mappingAcademicModulesList += `<li>${element.name} &#40;${generalUtility.getDurationFormatedForCertificate(element.duration)}&#41; </li>`
          if (element.duration)
            totalDuration += element.duration;
        });
        mappingAcademicModulesList += '</ul>'

        return {
          mappingModules: mappingAcademicModulesList,
          totalDuration: totalDuration
        };
      } else {
        if (showHeader) mappingAcademicModulesList += 'El contenido comprendió:\\n\\n'
        if (programTypeName || programTypeName != null)
          mappingAcademicModulesList = 'El contenido del ' + programTypeName + ' comprendió:\\n\\n';

        // mappingAcademicModulesList += '<ul>'
        academicModules.forEach(element => {
          mappingAcademicModulesList += `- ${element.name} (${generalUtility.getDurationFormatedForCertificate(element.duration)}).\\n`
          if (element.duration)
            totalDuration += element.duration;
        });
        return {
          mappingModules: mappingAcademicModulesList,
          totalDuration: totalDuration
        };
      }
    }
    catch (e) {
      console.log(">>> ERROR ON MODULE LIST <<<");
      console.log(e);
      console.log("..................................");
    }
  }

  /**
   * Format the modules list for Certificate 2
   */
  private formatAuditorModules = (auditorModules: any, format: 'html' | 'plain' = 'html') => {
    let mappingAuditorModulesList = '';
    let totalDuration = 0;

    if (format === 'html') {
      mappingAuditorModulesList = 'El contenido del programa comprendió: <br/>';
      mappingAuditorModulesList += '<ul>'
      auditorModules.forEach(element => {
        totalDuration += element.duration;
        mappingAuditorModulesList += `<li>${element.course.name} &#40;${generalUtility.getDurationFormatedForCertificate(element.duration)}&#41; </li>`;
      });
      mappingAuditorModulesList += '</ul>'
    } else {
      mappingAuditorModulesList = 'El contenido del programa comprendió:\\n\\n';
      auditorModules.forEach(element => {
        totalDuration += element.duration;
        mappingAuditorModulesList += `- ${element.course.name} (${generalUtility.getDurationFormatedForCertificate(element.duration)}).\\n`;
      });
    }

    return {
      mappingModules: mappingAuditorModulesList,
      totalDuration: totalDuration
    };
  }

  //#endregion Private Methods
}

export const certificateService = new CertificateService();
export { CertificateService as DefaultHuellaDeConfianzaCertificateCertificateService };
