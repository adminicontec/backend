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
import { gradesService } from '@scnode_app/services/default/moodle/grades/gradesService'
import { calendarEventsService } from '@scnode_app/services/default/moodle/calendarEvents/calendarEventsService'
import { completionstatusService } from '@scnode_app/services/default/admin/completionStatus/completionstatusService'
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
  ICertificateCompletion, ISetCertificateParams
} from '@scnode_app/types/default/admin/certificate/certificateTypes';
import { generalUtility } from '@scnode_core/utilities/generalUtility';
import { UpdateCACertificateParams } from "aws-sdk/clients/iot";
import { certificatePreviewProcessorProgram } from "client/tasks/certificateProcessor/certificatePreviewProcessorProgram";
// @end

class CertificateService {

  private default_certificate_path = 'certifications'
  public default_certificate_zip_path = 'certifications'

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

    let isAuditorCerficateEnabled = false;

    //#region query Filters
    console.log("Filters from Request:");
    console.log(filters);

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

      // Estatus de Programa: se permite crear la cola de certificados si está confirmado o ejecutado.
      schedulingMode = respCourse.scheduling.schedulingMode.name;
      console.log("Program Status --> " + respCourse.scheduling.schedulingStatus.name);
      if (respCourse.scheduling.schedulingStatus.name == 'Programado' || respCourse.scheduling.schedulingStatus.name == 'Cancelado') {
        return responseUtility.buildResponseFailed('json', null,
          { error_key: { key: 'certificate.requirements.program_status', params: { error: respCourse.scheduling.schedulingStatus.name } } });
      }
      console.log("*********************");
      console.log(respCourse.scheduling.program.name);
      console.log(respCourse.scheduling.schedulingMode.name);
      console.log("*********************");

      // Tipo de
      const programType = program_type_collection.find(element => element.abbr == respCourse.scheduling.program.code.substring(0, 2));

      if (respCourse.scheduling.auditor_certificate) {
        isAuditorCerficateEnabled = true;
        // get modules need to process Second certificate
      }

      //#endregion Información del curso

      enrollmentRegisters = await Enrollment.find(where)
        .select(select)
        .populate({ path: 'user', select: 'id email phoneNumber profile.first_name profile.last_name profile.doc_type profile.doc_number profile.regional profile.origen moodle_id' })
        .skip(paging ? (pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0) : null)
        .limit(paging ? nPerPage : null)
        .lean()

      let count = 1
      console.log('total de registros: ------');
      console.log(enrollmentRegisters.length);


      for await (const register of enrollmentRegisters) {

        let studentProgress = {
          status: '',
          attended_approved: '',
          average_grade: null,
          completion: null,
          assistance: null,
          quizGrade: null,
          auditor: false
        };

        register.count = count
        if (register.user && register.user.profile) {
          register.user.profile.full_name = `${register.user.profile.first_name} ${register.user.profile.last_name}`
        }

        console.log("=================================");
        console.log("[" + register.user.moodle_id + "] " + register.user.profile.full_name);

        //#region ::::::::::::::::: Reglas para Formación Virtual
        if (respCourse.scheduling.schedulingMode.name.toLowerCase() == 'virtual') {

          //var filterByGrades = ['assign', 'quiz', 'forum']
          const respUserGrades: any = await gradesService.fetchFinalGrades({
            courseID: register.courseID,
            userID: register.user.moodle_id,
            filter: ['course']
          });
          const respCompletionStatus: any = await completionstatusService.activitiesCompletion({ courseID: register.courseID, userID: register.user.moodle_id });

          //#region Error control
          if (respUserGrades.error || respCompletionStatus.error) {
            console.log('Error with UserID: ' + register.user.moodle_id);

            studentProgress.status = 'error';
            studentProgress.attended_approved = 'error';
            register.progress = studentProgress;
            listOfStudents.push(register);
            continue;
          }
          //#endregion Error control

          console.log("General Grade and Completion for " + register.user.profile.full_name);

          //#region  Grades for UserName
          let average = 0;
          for (const grade of respUserGrades.grades) {
            if (grade.graderaw) {
              average += grade.graderaw;
            }
          }
          average /= respUserGrades.grades.length;
          //#endregion  Grades for UserName

          //#region Completion percentage
          let completionPercentage = 0;
          for (const completion of respCompletionStatus.completion) {
            if (completion.state == 1) {
              completionPercentage += 1;
            }
          }
          completionPercentage /= respCompletionStatus.completion.length;
          console.log("Avg: " + average + '\t|\t' + "Completion: " + completionPercentage);
          //#endregion Completion percentage

          studentProgress.average_grade = average;
          studentProgress.completion = Math.round(completionPercentage * 100);

          if (studentProgress.completion == 100) {
            if (studentProgress.average_grade >= 70) {
              studentProgress.attended_approved = 'Asistió y aprobó';
            }
            else {
              studentProgress.attended_approved = 'Asistió';
            }
            studentProgress.auditor = isAuditorCerficateEnabled;
            studentProgress.status = 'ok';
          }
          else {
            studentProgress.attended_approved = 'No aprobó';
            studentProgress.status = 'no';
          }

          register.progress = studentProgress;
          console.log("--> " + register.user.profile.full_name + " " + studentProgress.attended_approved);
        }
        //#endregion Reglas para Formación Virtual

        //#region ::::::::::::::::: Reglas para Formación Presencial y en Línea
        if (respCourse.scheduling.schedulingMode.name.toLowerCase() == 'presencial' ||
          respCourse.scheduling.schedulingMode.name.toLowerCase() == 'en linea') {
          // Presencial - Online
          // Asistencia >= 75
          console.log("General Assistance and Quiz grades for " + register.user.profile.full_name);

          const respUserAssistances: any = await gradesService.fetchGradesByFilter({ courseID: register.courseID, userID: register.user.moodle_id, filter: ['attendance'] });
          const respGradeQuiz: any = await gradesService.fetchGradesByFilter({ courseID: register.courseID, userID: register.user.moodle_id, filter: ['quiz'] });

          //#region Error control
          if (respUserAssistances.error || respGradeQuiz.error) {
            console.log('Error with UserID: ' + register.user.moodle_id);

            studentProgress.status = 'error';
            studentProgress.attended_approved = 'error';
            register.progress = studentProgress;
            listOfStudents.push(register);
            continue;
          }
          //#endregion Error control

          //#region  Assistance:
          /* Todas las asistencia debe estar igual o por encima de 75%.
            Si alguna no cumple esta regla, no se emite Condición por Asistencia
          */
          let flagAssistance = true;
          let flagAssistanceCount = 0;
          let flagQuiz = true;

          for (const grade of respUserAssistances.grades) {
            if (grade.graderaw < 75) {
              flagAssistance = false;
              break;
            }
            flagAssistanceCount++;
          }
          //#endregion  Grades for UserName

          //#region  Quiz:
          /* Todas los exámenes debe estar igual o por encima de 70%.
            Si alguna no cumple esta regla, no se emite Condición por Examen
          */
          for (const grade of respGradeQuiz.grades) {
            if (grade.graderaw < 70) {
              flagQuiz = false;
              break;
            }
          }
          //#endregion  Grades for UserName

          if (flagAssistance) {
            if (flagQuiz) {
              studentProgress.attended_approved = 'Asistió y aprobó';
            }
            else {
              studentProgress.attended_approved = 'Asistió';
            }
            studentProgress.auditor = isAuditorCerficateEnabled;
            studentProgress.status = 'ok';
          }
          else {
            if (flagAssistanceCount > 0) {
              studentProgress.attended_approved = 'Asistencia parcial';
              studentProgress.status = 'ok';

            }
            else {
              studentProgress.attended_approved = 'No asistió';
              studentProgress.status = 'no';
            }
          }

          studentProgress.assistance = flagAssistance;
          studentProgress.quizGrade = flagQuiz;
          register.progress = studentProgress;
          console.log("-->" + register.user.profile.full_name + " " + studentProgress.attended_approved);
        }
        //#endregion Reglas para Formación Presencial y en Línea

        //#region Add certification to response
        if (filters.check_certification) {
          const certificate = await CertificateQueue.findOne({
            userId: register.user._id,
            courseId: register.course_scheduling,
            status: { $in: ['New', 'In-process', 'Complete'] }
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
        //#endregion Add certification to response

        // console.log('+++++++++++++++++++++++++');
        // console.log(register);
        // console.log('+++++++++++++++++++++++++\n');
      }
    } catch (e) { }

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        schedulingMode: schedulingMode,
        enrollment: [
          ...listOfStudents
        ],
        total_register: (paging) ? await Enrollment.find(where).countDocuments() : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    });

  }


  public setCertificate = async (params: IQueryUserToCertificate) => {

    try {
      console.log("Certifcate for username: " + params.userId);

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
      // console.log('-------------------');
      // console.log(respCourse);
      // console.log('-------------------');
      // console.log(respCourseDetails);
      // console.log('-------------------');

      if (respCourse.status == 'error' || respCourseDetails.status == 'error') {
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

      let mapping_dato_1 = '';
      let mapping_template = '';
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

      let programTypeName = '';
      let isAuditorCerficateEnabled = false;
      let studentProgress = {
        average_grade: null,
        completion: null,
        assistance: null,
        quizGrade: null,
        auditor: false
      };

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
      //#endregion Tipo de programa

      //#region Listado de Módulos (cursos) que comprende el programa <li>
      if (respCourseDetails.schedulings) {
        mapping_listado_cursos = 'El contenido del ' + programTypeName + ' comprendió: <br/>';
        mapping_listado_cursos += '<ul>'
        respCourseDetails.schedulings.forEach(element => {
          mapping_listado_cursos += '<li>' + element.course.name + '</li>';
        });
        mapping_listado_cursos += '</ul>'
      }
      //#endregion

      // console.log(programTypeName);
      // console.log("---------------------");
      // console.log(respDataUser);
      // console.log(respCourse);
      // console.log("---------------------");

      if (respCourse.scheduling.auditor_certificate) {
        isAuditorCerficateEnabled = true;
        // get modules need to process Second certificate
      }
      //#endregion Tipo de programa

      //#region ::::::::::::::::: Reglas para Formación Virtual
      if (respCourse.scheduling.schedulingMode.name.toLowerCase() == 'virtual') {

        const respUserGrades: any = await gradesService.fetchGrades({ courseID: respCourse.scheduling.moodle_id, userID: respDataUser.user.moodle_id });
        const respCompletionStatus: any = await completionstatusService.activitiesCompletion({ courseID: respCourse.scheduling.moodle_id, userID: respDataUser.user.moodle_id });

        //#region Error control
        if (respUserGrades.error || respCompletionStatus.error) {
          console.log('Error with UserID: ' + respDataUser.user.profile.moodle_id);
          return;
        }
        //#endregion Error control

        console.log("Modalidad: " + respCourse.scheduling.schedulingMode.name.toLowerCase());
        console.log("General Grade and Completion for " + respDataUser.user.profile.full_name);

        //#region  Grades for UserName
        let average = 0;
        for (const grade of respUserGrades.grades) {
          if (grade.graderaw) {
            average += grade.graderaw;
          }
        }
        average /= respUserGrades.grades.length;
        //#endregion  Grades for UserName

        //#region Completion percentage
        let completionPercentage = 0;
        for (const completion of respCompletionStatus.completion) {
          if (completion.state == 1) {
            completionPercentage += 1;
          }
        }
        completionPercentage /= respCompletionStatus.completion.length;
        console.log("Avg: " + average + '\t|\t' + "Completion: " + completionPercentage);
        //#endregion Completion percentage

        studentProgress.average_grade = average;
        studentProgress.completion = Math.round(completionPercentage * 100);

        if (studentProgress.completion == 100) {
          if (studentProgress.average_grade >= 70) {
            mapping_dato_1 = 'Asistió y aprobó el ' + programTypeName;
          }
          else {
            mapping_dato_1 = 'Asistió al ' + programTypeName;
          }
          studentProgress.auditor = isAuditorCerficateEnabled;
        }
        else {
          mapping_dato_1 = 'No aprobó';
          // error
          return;
        }
        console.log("-->" + respDataUser.user.profile.full_name + " " + mapping_dato_1);
      }
      //#endregion Reglas para Formación Virtual

      //#region ::::::::::::::::: Reglas para Formación Presencial y en Línea
      if (respCourse.scheduling.schedulingMode.name.toLowerCase() == 'presencial' ||
        respCourse.scheduling.schedulingMode.name.toLowerCase() == 'en linea') {
        // Presencial - Online
        // Asistencia >= 75
        console.log("Modalidad: " + respCourse.scheduling.schedulingMode.name.toLowerCase());
        console.log("General Assistance and Quiz grades for " + respDataUser.user.profile.first_name);

        const respUserAssistances: any = await gradesService.fetchGradesByFilter({ courseID: respCourse.scheduling.moodle_id, userID: respDataUser.user.moodle_id, filter: ['attendance'] });
        const respGradeQuiz: any = await gradesService.fetchGradesByFilter({ courseID: respCourse.scheduling.moodle_id, userID: respDataUser.user.moodle_id, filter: ['quiz'] });

        //#region Error control
        if (respUserAssistances.error || respGradeQuiz.error) {
          console.log('Error with UserID: ' + respDataUser.moodle_id);
          return;
        }
        //#endregion Error control

        //#region  Assistance:
        /* Todas las asistencia debe estar igual o por encima de 75%.
          Si alguna no cumple esta regla, no se emite Condición por Asistencia
        */
        let flagAssistanceCount = 0;
        let flagAssistance = true;
        let flagPartialAssistance = false;
        let flagQuiz = true;


        for (const grade of respUserAssistances.grades) {
          if (grade.graderaw < 75) {
            flagAssistance = false;
            break;
          }
          flagAssistanceCount++;
        }
        //#endregion  Grades for UserName

        //#region  Quiz:
        /* Todas los exámenes debe estar igual o por encima de 70%.
          Si alguna no cumple esta regla, no se emite Condición por Examen
        */
        for (const grade of respGradeQuiz.grades) {
          if (grade.graderaw < 70) {
            flagQuiz = false;
          }
        }
        //#endregion  Grades for UserName

        if (flagAssistance) {
          if (flagQuiz) {
            mapping_dato_1 = 'Asistió y aprobó el ' + programTypeName;
          }
          else {
            mapping_dato_1 = 'Asistió al ' + programTypeName;
          }
          studentProgress.auditor = isAuditorCerficateEnabled;
        }
        else {
          if (flagAssistanceCount > 0)
            //studentProgress.attended_approved = 'Asistencia parcial';
            flagPartialAssistance = true;
          else
            //studentProgress.attended_approved = 'No asistió';
            //flagPartialAssistance
            return;
        }

        studentProgress.assistance = flagAssistance;
        studentProgress.quizGrade = flagQuiz;
        console.log("-->" + respDataUser.user.profile.full_name + " " + mapping_dato_1);
      }
      //#endregion Reglas para Formación Presencial y en Línea


      //#endregion


      //#region Build the certificate Parameters
      const currentDate = new Date(Date.now());
      let certificateParamsArray: ISetCertificateParams[] = [];

      // Add first Certificate (nominal)
      let certificateParams: ICertificate = {
        modulo: mapping_template,
        numero_certificado: mapping_numero_certificado,
        correo: respDataUser.user.email,
        documento: respDataUser.user.profile.doc_type + " " + respDataUser.user.profile.doc_number,
        nombre: respDataUser.user.profile.full_name.toUpperCase(), // + " " + respDataUser.user.profile.last_name.toUpperCase(),
        asistio: null,
        certificado: (respCourse.scheduling.certificate) ? respCourse.scheduling.certificate : respCourse.scheduling.program.name,
        certificado_ingles: '', // respCourse.scheduling.english_certificate,
        alcance: '', //respCourse.scheduling.scope,
        alcance_ingles: '', //respCourse.scheduling.scope,
        intensidad: generalUtility.getDurationFormatedForCertificate(respCourse.scheduling.duration),
        listado_cursos: mapping_listado_cursos,
        ciudad: mapping_ciudad,
        pais: mapping_pais,
        fecha_certificado: respCourse.scheduling.endDate,
        fecha_aprobacion: currentDate,
        fecha_ultima_modificacion: null,
        fecha_renovacion: null,
        fecha_vencimiento: null,
        fecha_impresion: currentDate,
        dato_1: mapping_dato_1,
        dato_2: moment(currentDate).locale('es').format('LL'),
      }
      certificateParamsArray.push({
        queueData: params,
        template: mapping_template,
        certificateType: certificate_type.academic,
        params: certificateParams,
      });
      console.log("[1]------------------------------------------");
      console.log("Set first Certificate: ");
      // console.log(certificateParams);
      // Second certificate: auditor Certificate
      if (isAuditorCerficateEnabled) {

        console.log('Título de certificado de auditor:');
        console.log(respCourse.scheduling.auditor_certificate);

        let auditorCertificateParams: ICertificate = {
          modulo: mapping_template,
          numero_certificado: mapping_numero_certificado + '-A',
          correo: respDataUser.user.email,
          documento: respDataUser.user.profile.doc_type + " " + respDataUser.user.profile.doc_number,
          nombre: respDataUser.user.profile.full_name.toUpperCase(), // + " " + respDataUser.user.profile.last_name.toUpperCase(),
          asistio: null,
          certificado: respCourse.scheduling.auditor_certificate,
          certificado_ingles: '', // respCourse.scheduling.english_certificate,
          alcance: '', //respCourse.scheduling.scope,
          alcance_ingles: '', //respCourse.scheduling.scope,
          intensidad: generalUtility.getDurationFormatedForCertificate(respCourse.scheduling.duration),
          listado_cursos: mapping_listado_cursos,
          ciudad: mapping_ciudad,
          pais: mapping_pais,
          fecha_certificado: respCourse.scheduling.endDate,
          fecha_aprobacion: currentDate,
          fecha_ultima_modificacion: null,
          fecha_renovacion: null,
          fecha_vencimiento: null,
          fecha_impresion: currentDate,
          dato_1: "Asistió y aprobó el",
          dato_2: moment(currentDate).locale('es').format('LL'),
        }
        //certificateParams.numero_certificado = mapping_numero_certificado + 'A';
        //certificateParams.certificado = 'Auditor en ' + respCourse.scheduling.program.name;

        certificateParamsArray.push({
          queueData: {
            certificateQueueId: null, // as new record
            userId: params.userId, // Nombre de usario
            courseId: params.courseId
          },
          certificateType: certificate_type.auditor,
          template: mapping_template,
          params: auditorCertificateParams,
        });
        console.log("[2]------------------------------------------");
        console.log("Set Auditor Certificate: ");
        // console.log(certificateParams);
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
        message: ''
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
        params: JSON.stringify(certificateReq.params)
      });
      console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^");
      console.log(respHuella);
      console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^");

      let registerId = (certificateReq.queueData.certificateQueueId) ? (certificateReq.queueData.certificateQueueId) : responseCertificateQueue.certificateQueue._id;
      console.log("--> Register to update " + registerId);

      let responseCertQueue: any = await certificateQueueService.insertOrUpdate({
        id: registerId, //(certificateReq.queueData.certificateQueueId) ? (certificateReq.queueData.certificateQueueId) : responseCertificateQueue.certificateQueue._id,
        status: 'Requested',
        message: 'Certificado generado.',
        certificateModule: certificateReq.params.modulo,
        certificateType: certificateReq.certificateType,
        certificate: {
          hash: respHuella.resultado.certificado,
          url: respHuella.resultado.url
        }
      });

      responseCertQueueArray.push(responseCertQueue);
      counter++;
    }
    return responseCertQueueArray;
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

  //#endregion Private Methods
}

export const certificateService = new CertificateService();
export { CertificateService as DefaultHuellaDeConfianzaCertificateCertificateService };
