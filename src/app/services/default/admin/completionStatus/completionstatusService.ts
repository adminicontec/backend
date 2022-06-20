// @import_dependencies_node Import libraries
// @end

// @import services
import { certificateService } from '@scnode_app/services/default/huellaDeConfianza/certificate/certificateService'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { queryUtility } from '@scnode_core/utilities/queryUtility';
import { moodle_setup } from '@scnode_core/config/globals';
// @end

// @import models
import { CertificateQueue, User } from '@scnode_app/models';
// @end

// @import types
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes'
import { ICompletionStatus, ICompletionStatusQuery, IActivitiesCompletion, IActivitiesSummary } from '@scnode_app/types/default/admin/completionStatus/completionstatusTypes'
// @end

class CompletionstatusService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor() { }

  /**
 * Metodo que permite listar todos los registros
 * @param [filters] Estructura de filtros para la consulta
 * @returns
 */
  public list = async (params: ICompletionStatus) => {

    let registers = []
    var paramGetCompletionStatus = {
      moodleCourseID: 0
    };

    //#region [ 1. Consultar por ShortName de curso para enrolamiento - moodle]
    let moodleParamsInfoCourse = {
      wstoken: moodle_setup.wstoken,
      wsfunction: moodle_setup.services.courses.getByField,
      moodlewsrestformat: moodle_setup.restformat,
      'field': 'shortname',
      'value': params.course
    };
    console.log("[moodle] search completion >>> " + params.course)
    let respDataCourse = await queryUtility.query({ method: 'get', url: '', api: 'moodle', params: moodleParamsInfoCourse });

    console.log(">>>>>>>>> Resp DataCourse:");
    console.log(respDataCourse);

    if (respDataCourse.courses.length == 0) {
      // ERROR al consultar el curso en Moodle
      console.log("Moodle: ERROR." + JSON.stringify(respDataCourse));
      return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'moodle_course.not_found', params: { coursename: params.course } } })
    }
    else {
      // id de curso en Moodle
      paramGetCompletionStatus.moodleCourseID = respDataCourse.courses[0].id;
      console.log("Moodle CourseID: " + respDataCourse.courses[0].id);
    }

    //#endregion

    //#region [ 2. Consultar el listado de estudiantes en el curso - moodle]
    let moodleParamsEnrolledUsers = {
      wstoken: moodle_setup.wstoken,
      wsfunction: moodle_setup.services.enrollment.get,
      moodlewsrestformat: moodle_setup.restformat,
      'courseid': paramGetCompletionStatus.moodleCourseID
    };
    let respEnrolledUsers = await queryUtility.query({ method: 'get', url: '', api: 'moodle', params: moodleParamsEnrolledUsers });
    // console.log("=== Resp Enrolled users:");
    // console.log(respEnrolledUsers);

    if (respEnrolledUsers.length != 0) {

      let studentDataArray = [];

      for (var item of respEnrolledUsers) {
        let studentData = {
          id: 0,
          username: '',
          email: '',
          fullname: '',
          documentId: '',
          schedule: 0,
          status: false
        };

        if (item.roles[0].roleid == 5) {
          studentData.id = item.id;
          studentData.username = item.username;
          studentData.email = item.email;
          studentData.fullname = item.fullname;
          studentDataArray.push(studentData);

          // Check if Student completes the course
          let moodleParamsCourseCompletionStatus = {
            wstoken: moodle_setup.wstoken,
            wsfunction: moodle_setup.services.courses.completion,
            moodlewsrestformat: moodle_setup.restformat,
            'courseid': paramGetCompletionStatus.moodleCourseID,
            'userid': item.id
          };
          let respCourseCompletionStatus = await queryUtility.query({ method: 'get', url: '', api: 'moodle', params: moodleParamsCourseCompletionStatus });

          studentData.status = respCourseCompletionStatus.completionstatus.completed;
          registers = studentDataArray;
          console.log("Status de Terminación de " + item.fullname);
          console.log(respCourseCompletionStatus);
        }
      }

      // console.log("Datos de estudiantes: ")
      // console.log(studentDataArray);


      // // Check if Student completes the course
      // for (var student of studentDataArray) {
      //   let moodleParamsCourseCompletionStatus = {
      //     wstoken: moodle_setup.wstoken,
      //     wsfunction: moodle_setup.services.courses.completion,
      //     moodlewsrestformat: moodle_setup.restformat,
      //     'courseid': paramGetCompletionStatus.moodleCourseID,
      //     'userid': item.id
      //   };
      //   let respCourseCompletionStatus = await queryUtility.query({ method: 'get', url: '', api: 'moodle', params: moodleParamsCourseCompletionStatus });

      //   registers = studentDataArray;
      //   console.log("Status de Terminación de " + student.fullname);
      //   console.log(respCourseCompletionStatus);
      // }


    }
    else {
      // check error message
      return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'moodle_enrollment.empty', params: { name: params.course } } })
    }

    //#endregion


    const paging = true; //(filters.pageNumber && filters.nPerPage) ? true : false
    const pageNumber = 1; // filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage = 10; //filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    // Success Response

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        courseName: params.course,
        completionstatus: [
          ...registers
        ],
        total_register: (paging) ? 1 : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    })
  }

  public activitiesCompletion = async (params: IActivitiesCompletion) => {
    try {

      let moodleParamsActivitiesCompletion = {
        wstoken: moodle_setup.wstoken,
        wsfunction: moodle_setup.services.completion.getActivitiesStatus,
        moodlewsrestformat: moodle_setup.restformat,
        'courseid': params.courseID,
        'userid': params.userID
      }

      let respActivitiesCompletion = await queryUtility.query({ method: 'get', url: '', api: 'moodle', params: moodleParamsActivitiesCompletion });

      //console.log(respActivitiesCompletion);

      if (respActivitiesCompletion.exception) {
        console.log("Moodle: ERROR on moodleParamsActivitiesCompletion request." + JSON.stringify(respActivitiesCompletion));
        return responseUtility.buildResponseFailed('json', null,
          {
            error_key: 'calendarEvent.exception',
            additional_parameters: {
              process: moodleParamsActivitiesCompletion.wsfunction,
              error: respActivitiesCompletion
            }
          });
      }

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          completion: respActivitiesCompletion.statuses, //respMoodleEvents.events,
        }
      })

    } catch (e) {
      console.log(e.message);

      return responseUtility.buildResponseFailed('json', null,
        {
          error_key: 'calendarEvent.exception',
          additional_parameters: {
            process: 'fetchEvents()',
            error: e.message
          }
        });

    }

  }


  public activitiesSummary = async (params: IActivitiesSummary) => {

    console.log('activitiesSummary');
    console.log(params);

    let summary = {
      schedulingMode: '',
      totalAdvance: 0,
      finalGrade: '',
      programFinalState: '',
      certificateIssueState: '',
      auditor: false,
      auditorGrade: 0
    }

    try {

      // Get Rules for completion:
      console.log('Get Rules for completion:');
      const response: any = await certificateService.rulesForCompletion(params);

      if (response.status == 'error') {
        return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'user.not_found' } });
      }

      if (response.completion[0].listOfStudentProgress) {
        let studentData = response.completion[0].listOfStudentProgress[0].student;
        summary.schedulingMode = response.schedulingMode.toLowerCase();
        summary.finalGrade = `${studentData.itemType.course[0].graderaw} / 100`;
        summary.auditor = studentData.studentProgress.auditor;
        summary.auditorGrade = studentData.studentProgress.auditorGrade;

        if (response.schedulingMode.toLowerCase() == 'virtual') {
          summary.totalAdvance = studentData.studentProgress.completion;
        }

        if (response.schedulingMode.toLowerCase() == 'presencial' || response.schedulingMode == 'en linea') {
          var arrNum = studentData.studentProgress.assistance.split('/');

          summary.totalAdvance = arrNum[0] / arrNum[1];
        }


        if (studentData.studentProgress.status == 'ok')
          summary.programFinalState = 'Aprobado';
        else
          summary.programFinalState = 'No aprobado';
      }


      // Get status of Certificate Issue:

      //params.username
      const existUser = await User.findOne({ username: params.username })
      console.log('existUser');
      console.log(existUser);

      const respCertification = await CertificateQueue.findOne({
        userId: existUser._id,
        courseId: params.course_scheduling,
        certificateType: 'academic'
      });

      console.log('Certifications');
      console.log(respCertification);
      if (respCertification) {
        console.log(respCertification.status);

        //['New', 'In-process', 'Requested', 'Complete', 'Error', 'Re-issue']
        switch (respCertification.status) {
          case 'New':
            summary.certificateIssueState = 'En cola';
            break;
          case 'In-process':
            summary.certificateIssueState = 'En proceso';
            break;
          case 'Requested':
            summary.certificateIssueState = 'En emisión';
            break;
          case 'Complete':
            summary.certificateIssueState = 'Disponible';
            break;
          case 'Error':
            summary.certificateIssueState = 'Error';
            break;
          case 'Re-issue':
            summary.certificateIssueState = 'Reexpedido';
            break;
          case 'Deleted':
            summary.certificateIssueState = 'Borrado';
            break;

          default:
            summary.certificateIssueState = 'En cola';
            break;
        }
      }
      else {
        summary.certificateIssueState = 'Sin emitir';
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
        summary: summary
      }
    });

  }

}

export const completionstatusService = new CompletionstatusService();
export { CompletionstatusService as DefaultAdminCompletionStatusCompletionstatusService };
