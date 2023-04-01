// @import_dependencies_node Import libraries
// @end

// @import services
import { certificateService } from '@scnode_app/services/default/huellaDeConfianza/certificate/certificateService'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { queryUtility } from '@scnode_core/utilities/queryUtility';
import { moodle_setup } from '@scnode_core/config/globals';
import { generalUtility } from '@scnode_core/utilities/generalUtility';
// @end

// @import models
import { CertificateQueue, CourseScheduling, User } from '@scnode_app/models';
// @end

// @import types
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes'
import { ICompletionStatus, ICompletionStatusQuery, IActivitiesCompletion, IActivitiesSummary, IActivitiesSummaryResponse } from '@scnode_app/types/default/admin/completionStatus/completionstatusTypes'
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
    const summary: IActivitiesSummaryResponse = {
      schedulingMode: '',
      totalAdvance: undefined,
      finalGrade: '',
      programFinalState: '',
      certificateIssueState: '',
      auditor: false,
      auditorGrade: 0,
      notes: [],
      finalNote: undefined,
      emissionCertificate: {
        label: `Sin emitir`,
      },
      certification: {
        type: undefined,
        label: undefined,
        exam: undefined,
        status: {
          generated: false,
          label: 'Sin emitir'
        }
      },
      auditorCertification: {
        type: undefined,
        label: undefined,
        exam: undefined,
        status: {
          generated: false,
          label: 'Sin emitir'
        }
      },
      attendance: undefined,
      activities: undefined
    }

    try {

      const existUser = await User.findOne({ username: params.username })

      if (!existUser) return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'user.not_found' } });

      // Get Rules for completion:
      console.log('Get Rules for completion:');
      // const response: any = await certificateService.rulesForCompletion(params);
      const response: any = await certificateService.completion(params)

      if (response.status == 'error') {
        return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'user.not_found' } });
      }

      if (response?.enrollment) {
        let courseSchedling = undefined;
        const studentData = response?.enrollment[0] || undefined;
        if (studentData) {
          courseSchedling = await CourseScheduling.findOne({_id: studentData.course_scheduling}).select('endDate').lean()

          summary.schedulingMode = response?.schedulingMode?.toLowerCase() || ''
          const progress = studentData?.progress || undefined;
          if (progress) {
            if (response?.isAuditorCerficateEnabled) {
              summary.certification.label = progress?.attended_approved || '-';
              summary.certification.type = 'academic'

              summary.auditorCertification.label = progress?.auditorCertificate || '-'
              summary.auditorCertification.exam = (progress?.auditorGradeC2) ? generalUtility.round(progress?.auditorGradeC2) : '-'
              summary.auditorCertification.type = 'auditor'
              summary.notes.push(progress?.auditorGradeC2 ? progress?.auditorGradeC2 : 0)
            } else if (response?.firstCertificateIsAuditor) {
              summary.certification.label = progress?.attended_approved || '-'
              summary.certification.exam = (progress?.auditorGradeC1) ? generalUtility.round(progress?.auditorGradeC1) : '-'
              summary.certification.type = 'auditor'
              summary.notes.push(progress?.auditorGradeC1 ? progress?.auditorGradeC1 : 0)
            } else {
              summary.certification.label = progress?.attended_approved || '-'
              summary.certification.type = 'academic'
            }

            if (summary.schedulingMode !== '') {
              if (summary.schedulingMode == 'virtual') {
                summary.totalAdvance = progress?.completion || 0;
                summary.activities = progress?.average_grade || '-'
                summary.notes.push(progress?.average_grade ? progress?.average_grade : 0)
                summary.finalNote = progress?.average_grade ? generalUtility.round(progress.average_grade) : '-'
              } else {
                // summary.totalAdvance = progress?.assistanceDetails?.percentage || 0;
                summary.attendanceInformation = progress?.assistanceDetails
                summary.attendance = progress?.assistanceDetails?.percentage || 0
                // summary.notes.push(progress?.assistanceDetails?.percentage ? progress?.assistanceDetails?.percentage : 0)
                summary.notes = [];
              }
            }
          }

          // if (summary.notes.length > 0) {
          //   const note = summary.notes.reduce((accum, element) => {
          //     accum += element;
          //     return accum
          //   }, 0) / summary.notes.length
          //   summary.finalNote = generalUtility.round(note);
          // }

          // let studentData = response.completion[0].listOfStudentProgress[0].student;
          // summary.schedulingMode = response.schedulingMode.toLowerCase();
          // summary.finalGrade = `${studentData.itemType.course[0].graderaw} / 100`;
          // summary.auditor = studentData.studentProgress.auditor;
          // summary.auditorGrade = studentData.studentProgress.auditorGrade;

          // if (response.schedulingMode.toLowerCase() == 'virtual') {
          //   summary.totalAdvance = studentData.studentProgress.completion;
          // }

          // if (response.schedulingMode.toLowerCase() == 'presencial' || response.schedulingMode == 'en linea') {
          //   var arrNum = studentData.studentProgress.assistance.split('/');

          //   summary.totalAdvance = arrNum[0] / arrNum[1];
          // }


          // if (studentData.studentProgress.status == 'ok')
          //   summary.programFinalState = 'Aprobado';
          // else
          //   summary.programFinalState = 'No aprobado';

          const certifications = await CertificateQueue.find({
            userId: existUser._id,
            courseId: params.course_scheduling,
            // certificateType: 'academic'
          });

          if (certifications.length > 0) {
            for (const certification of certifications) {
              if (certification?.certificateType === 'academic') {
                summary.certification.status.generated = true;
                summary.certification.status.label = this.findCertificationsStatus(certification.status);
              } else if (certification?.certificateType === 'auditor') {
                summary.auditorCertification.status.generated = true;
                summary.auditorCertification.status.label = this.findCertificationsStatus(certification.status);
              } else {
                summary.certification.status.generated = true;
                summary.certification.status.label = this.findCertificationsStatus(certification.status);
              }
              summary.emissionCertificate.label = `Emitido`;
            }
          } else {
            if (studentData?.progress?.status === 'no') {
              summary.emissionCertificate.label = `No se certifica`;
            }
          }
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
        summary: summary
      }
    });
  }

  private findCertificationsStatus = (certificationStatus) => {
    let label = 'En cola'
    switch (certificationStatus) {
      case 'New':
        label = 'En cola';
        break;
      case 'In-process':
        label = 'En proceso';
        break;
      case 'Requested':
        label = 'En emisión';
        break;
      case 'Complete':
        label = 'Disponible';
        break;
      case 'Error':
        label = 'Error';
        break;
      case 'Re-issue':
        label = 'Reexpedido';
        break;
      case 'Deleted':
        label = 'Borrado';
        break;
      default:
        label = 'En cola';
        break;
    }
    return label;
  }

}

export const completionstatusService = new CompletionstatusService();
export { CompletionstatusService as DefaultAdminCompletionStatusCompletionstatusService };
