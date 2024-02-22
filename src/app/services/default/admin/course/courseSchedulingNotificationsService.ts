// @import_dependencies_node Import libraries
import moment from 'moment';
// @end

// @import services
import { mailService } from '@scnode_app/services/default/general/mail/mailService';
import { courseContentService } from '@scnode_app/services/default/moodle/course/courseContentService';
import { certificateService } from '@scnode_app/services/default/huellaDeConfianza/certificate/certificateService';
import { courseSchedulingDetailsService } from '@scnode_app/services/default/admin/course/courseSchedulingDetailsService';
// @end

// @import utilities
import { i18nUtility } from '@scnode_core/utilities/i18nUtility';
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { customs } from '@scnode_core/config/globals';
// @end

// @import models
import { Role, User, CourseSchedulingDetails, CourseScheduling } from '@scnode_app/models';
// @end

// @import types
import { IQuizModuleData } from '@scnode_app/types/default/admin/completionStatus/completionstatusTypes'
import { IStudentExamNotification } from '@scnode_app/types/default/admin/notification/notificationTypes'
import { CourseSchedulingDetailsSync, TCourseSchedulingModificationFn } from '@scnode_app/types/default/admin/course/courseSchedulingTypes';
import { IUser, TimeZone } from '@scnode_app/types/default/admin/user/userTypes';
import { TCourseSchedulingDetailsModificationFn } from '@scnode_app/types/default/admin/course/courseSchedulingDetailsTypes';
import { TIME_ZONES_WITH_OFFSET } from '@scnode_app/types/default/admin/user/userTypes';
// @end

const DATE_FORMAT = 'YYYY-MM-DD'

class CourseSchedulingNotificationsService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor() { }

  /**
   * @INFO Enviar notificación de inicio de servicio al auxiliar logístico encargado
   */
  public sendNotificationOfServiceToAssistant = async (
    courseScheduling: any,
    type: 'started' | 'cancel' | 'modify' = 'started',
    populate?: boolean,
    changesFn?: TCourseSchedulingDetailsModificationFn | TCourseSchedulingModificationFn,
    syncupSessionsInMoodle?: CourseSchedulingDetailsSync,
    subject?: string
  ) => {
    try {
      let email_to_notificate: { email: string, name: string, timezone?: TimeZone }[] = []

      if (populate) {
        courseScheduling = await this.getCourseSchedulingFromId(courseScheduling);
      }

      // Notificar al correo especificado en el env.json
      if ((type === 'started' || type === 'modify' || type === 'cancel') && customs && (customs as any).mailer && (customs as any).mailer.email_confirm_service) {
        if (typeof (customs as any).mailer.email_confirm_service === 'string') {
          email_to_notificate.push({
            email: (customs as any).mailer.email_confirm_service,
            name: 'Jhonatan Malaver'
          });
        } else if (Array.isArray((customs as any).mailer.email_confirm_service)) {
          for (const email_confirm_service of (customs as any).mailer.email_confirm_service) {
            email_to_notificate.push({
              email: email_confirm_service.email,
              name: email_confirm_service.name
            });
          }
        }
      }

      // @INFO Notificar al programador
      const serviceScheduler: IUser = (courseScheduling.metadata && courseScheduling.metadata.user) ? courseScheduling.metadata.user : null
      serviceScheduler.profile.timezone
      if (serviceScheduler) {
        email_to_notificate.push({
          email: serviceScheduler.email,
          name: `${serviceScheduler.profile.first_name} ${serviceScheduler.profile.last_name}`,
          timezone: serviceScheduler?.profile?.timezone,
        })
      }

      // @INFO Notificar al ejecutivo de cuenta
      const accountExecutive: IUser = (courseScheduling && courseScheduling.account_executive) ? courseScheduling.account_executive : null
      if (accountExecutive) {
        email_to_notificate.push({
          email: accountExecutive.email,
          name: `${accountExecutive.profile.first_name} ${accountExecutive.profile.last_name}`,
          timezone: accountExecutive?.profile?.timezone,
        })
      }

      // @INFO: Solo enviar al auxiliar logístico
      const logisticAssistant: IUser = courseScheduling.material_assistant;
      if (logisticAssistant && logisticAssistant.email) {
        email_to_notificate.push({
          email: logisticAssistant.email,
          name: `${logisticAssistant.profile.first_name} ${logisticAssistant.profile.last_name}`,
          timezone: logisticAssistant?.profile?.timezone,
        });
      }

      // Eliminar emails repetidos
      email_to_notificate = email_to_notificate.reduce((accum: { email: string, name: string }[], item) => {
        if (!accum.find((e) => e.email === item.email)) {
          accum.push(item);
        }
        return accum;
      }, []);

      // @INFO Encontrar las programaciones del servicio
      const modules = await this.getModulesOfCourseScheduling(courseScheduling);

      // @INFO Obtener si el servicio aplica para examen o no
      const exam: IQuizModuleData = await this.verifyCourseSchedulingExercise(courseScheduling.moodle_id);

      if (email_to_notificate.length > 0) {
        let syncupSessionsInMoodleMessage = undefined;
        let material_address = undefined;
        if (syncupSessionsInMoodle && [CourseSchedulingDetailsSync.SYNCHRONIZED, CourseSchedulingDetailsSync.PENDING].includes(syncupSessionsInMoodle)) {
          switch(syncupSessionsInMoodle) {
            case CourseSchedulingDetailsSync.SYNCHRONIZED:
              syncupSessionsInMoodleMessage = 'Las sesiones fueron actualizadas en moodle.'
              break;
            case CourseSchedulingDetailsSync.PENDING:
              syncupSessionsInMoodleMessage = 'Las sesiones aún no han sido actualizadas en moodle.'
              break;
          }
        }

        if (courseScheduling?.material_delivery === 'physic' && courseScheduling?.material_address) {
          material_address = courseScheduling?.material_address;
        }
        const params = {
          mailer: customs['mailer'],
          today: moment.utc().format(DATE_FORMAT),
          notification_source: `scheduling_notification_${type}_assistant_${courseScheduling._id}`,
          // Información
          assistant_name: `${courseScheduling.material_assistant.profile.first_name} ${courseScheduling.material_assistant.profile.last_name}`,
          program_name: courseScheduling.program.name,
          program_code: courseScheduling.program.code,
          service_id: courseScheduling.metadata.service_id,
          modality: courseScheduling.schedulingMode.name,
          modules: modules,
          duration: this.formatSecondsToHours(courseScheduling.duration),
          startDate: moment.utc(courseScheduling.startDate).format(DATE_FORMAT),
          endDate: moment.utc(courseScheduling.endDate).format(DATE_FORMAT),
          observations: courseScheduling.observations,
          exam: exam?.hasExam ? 'SI' : 'NO',
          changes: undefined,
          syncupSessionsInMoodle: syncupSessionsInMoodleMessage,
          accountExecutive: `${courseScheduling.account_executive.profile.first_name} ${courseScheduling.account_executive.profile.last_name}`,
          client: courseScheduling.client?.name,
          regional: courseScheduling.regional.name,
          material_address
        };

        // @ts-ignore
        const path_template = type === 'started' || type === 'modify' ? 'course/startedServiceToAssistant' : 'course/cancelServiceToAssistant'

        let mail: any = undefined;
        for await (let emailNotificate of email_to_notificate) {
          if (changesFn) {
            params.changes = await changesFn(emailNotificate.timezone)
          }
          mail = await mailService.sendMail({
            emails: [emailNotificate.email],
            mailOptions: {
              // @ts-ignore
              subject: subject ? subject : (i18nUtility.__(type === 'started' ? 'mailer.scheduling_notification.subject' : type === 'modify' ? 'mailer.scheduling_update.subject' : 'mailer.scheduling_cancelled_notification.subject')),
              html_template: {
                path_layout: 'icontec',
                path_template: path_template,
                params: {
                  ...params,
                  assistant_name: emailNotificate.name
                }
              },
              amount_notifications: type === 'modify' ? null : 10
            },
            notification_source: params.notification_source
          })
        }
        return mail

      }
    } catch (e) {
      console.log('CourseSchedulingNotification - sendNotificationOfServiceToAssistant', e)
      return responseUtility.buildResponseFailed('json', null)
    }
  }

  /**
   * @INFO Enviar correo de recordatorio de encuesta o asistencia
   * @param courseScheduling
   * @param courseSchedulingDetails
   */
  public sendSurveyAssistanceNotification = async (courseSchedulingId: string, courseSchedulingDetailsId?: string) => {
    const courseScheduling = await this.getCourseSchedulingFromId(courseSchedulingId);
    let courseSchedulingDetails;
    if (courseSchedulingDetailsId) {
      courseSchedulingDetails = await this.getCourseSchedulingDetailsFromId(courseSchedulingDetailsId);
    }

    if (!courseScheduling.material_assistant || !courseScheduling.account_executive) return;

    // @INFO Verificar si el courseSchedulingDetails aplica para examen
    const exam = await this.verifyCourseSchedulingDetailsExercise(courseScheduling.moodle_id);

    try {
      let path_template = 'survey/surveyNotification';
      const params = {
        mailer: customs['mailer'],
        // Información
        assistant_name: `${courseScheduling.material_assistant.profile.first_name} ${courseScheduling.material_assistant.profile.last_name}`,
        program_name: courseScheduling.program.name,
        program_code: courseScheduling.program.code,
        service_id: courseScheduling.metadata.service_id,
        modality: courseScheduling.schedulingMode.name,
        module: courseSchedulingDetails?.course?.name,
        duration: courseSchedulingDetails ? this.formatSecondsToHours(courseSchedulingDetails.duration) : this.formatSecondsToHours(courseScheduling.duration),
        startDate: courseSchedulingDetails ? moment.utc(courseSchedulingDetails.startDate).format('YYYY-MM-DD') : moment.utc(courseScheduling.startDate).format('YYYY-MM-DD'),
        endDate: courseSchedulingDetails ? moment.utc(courseSchedulingDetails.endDate).format('YYYY-MM-DD') : moment.utc(courseScheduling.endDate).format('YYYY-MM-DD'),
        teacher: `${courseSchedulingDetails?.teacher?.profile?.first_name} ${courseSchedulingDetails?.teacher?.profile?.last_name}`,
        observations: courseScheduling.observations,
        exam: exam ? 'SI' : 'NO',
        accountExecutive: `${courseScheduling.account_executive.profile.first_name} ${courseScheduling.account_executive.profile.last_name}`,
        regional: courseScheduling.regional.name,
        courseSchedulingDetails
      }
      const emails: string[] = [courseScheduling.material_assistant.email];
      const mail = await mailService.sendMail({
        emails,
        mailOptions: {
          subject: i18nUtility.__('mailer.survey_notification.subject'),
          html_template: {
            path_layout: 'icontec',
            path_template: path_template,
            params
          },
          amount_notifications: 1
        },
        notification_source: `survey_notification_${courseSchedulingDetailsId ? courseSchedulingDetailsId : courseSchedulingId}`
      })
      return mail
    } catch (e) {
      console.log('Error send email notification: ', e);
      return e;
    }
  }

  /**
   * @INFO Enviar correo al auxiliar logístico sobre la activación del examen
   */
  public sendNotificationExamToAssistance = async (courseSchedulingId: string) => {
    try {
      const courseScheduling = await this.getCourseSchedulingFromId(courseSchedulingId);
      if (!courseScheduling.material_assistant || !courseScheduling.account_executive) return;
      // Enviar la notificación
      let path_template = 'course/schedulingExamToAssistance';
      const params = {
        mailer: customs['mailer'],
        today: moment.utc().format('YYYY-MM-DD'),
        notification_source: `scheduling_notification_exam_assistant_${courseScheduling._id}`,
        // Información
        assistant_name: `${courseScheduling.material_assistant?.profile?.first_name} ${courseScheduling.material_assistant?.profile?.last_name}`,
        program_name: courseScheduling.program.name,
        program_code: courseScheduling.program.code,
        service_id: courseScheduling.metadata.service_id,
        modality: courseScheduling.schedulingMode.name,
        duration: this.formatSecondsToHours(courseScheduling.duration),
        startDate: moment.utc(courseScheduling.startDate).format('YYYY-MM-DD'),
        endDate: moment.utc(courseScheduling.endDate).format('YYYY-MM-DD'),
        observations: courseScheduling.observations,
        accountExecutive: courseScheduling.account_executive?.profile?.first_name,
        regional: courseScheduling.regional.name
      };
      const emails: string[] = [courseScheduling.material_assistant.email];
      const mail = await mailService.sendMail({
        emails,
        mailOptions: {
          subject: i18nUtility.__('mailer.scheduling_exam_to_assistance.subject'),
          html_template: {
            path_layout: 'icontec',
            path_template: path_template,
            params
          },
          amount_notifications: 1
        },
        notification_source: params.notification_source
      });
      return mail
    } catch (e) {
      console.log('sendNotificationExamToAssistance Error: ', e);
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * @INFO Enviar correo al auxiliar logístico sobre la activación del examen
   */
  public sendNotificationExamToParticipant = async (studentParams: IStudentExamNotification) => {
    try {

      // Enviar la notificación
      let path_template = 'course/schedulingExamToParticipant';
      const params = {
        mailer: customs['mailer'],
        today: moment.utc().format('YYYY-MM-DD'),
        notification_source: `scheduling_notification_exam_participant_${studentParams.courseSchedulingId}_${studentParams.studentId}`,
        // Información
        studentParams: studentParams
      };
      const emails: string[] = [studentParams.email];
      const mail = await mailService.sendMail({
        emails,
        mailOptions: {
          subject: i18nUtility.__('mailer.scheduling_exam_to_assistance.subject'),
          html_template: {
            path_layout: 'icontec',
            path_template: path_template,
            params
          },
          amount_notifications: 1
        },
        notification_source: params.notification_source
      });
      return mail
    } catch (e) {
      console.log('sendNotificationExamToAssistance Error: ', e);
      return responseUtility.buildResponseFailed('json')
    }
  }


  /**
   * @INFO: Enviar notificación de emisión de certificados
   * @param courseSchedulingId
   */
  public sendNotificationCertificate = async (courseSchedulingId: string) => {
    try {
      const courseScheduling = await this.getCourseSchedulingFromId(courseSchedulingId);
      if (!courseScheduling.material_assistant || !courseScheduling.account_executive) return;
      // Enviar la notificación
      let path_template = 'course/schedulingCertificate';
      const params = {
        mailer: customs['mailer'],
        today: moment.utc().format('YYYY-MM-DD'),
        notification_source: `scheduling_notification_certificate_${courseScheduling._id}`,
        // Información
        assistant_name: `${courseScheduling.material_assistant?.profile?.first_name} ${courseScheduling.material_assistant?.profile?.last_name}`,
        program_name: courseScheduling.program.name,
        program_code: courseScheduling.program.code,
        service_id: courseScheduling.metadata.service_id,
        modality: courseScheduling.schedulingMode.name,
        duration: this.formatSecondsToHours(courseScheduling.duration),
        startDate: moment.utc(courseScheduling.startDate).format('YYYY-MM-DD'),
        endDate: moment.utc(courseScheduling.endDate).format('YYYY-MM-DD'),
        observations: courseScheduling.observations,
        accountExecutive: courseScheduling.account_executive?.profile?.first_name,
        regional: courseScheduling.regional.name
      };
      const emails: string[] = [courseScheduling.material_assistant.email];
      const mail = await mailService.sendMail({
        emails,
        mailOptions: {
          subject: i18nUtility.__('mailer.scheduling_certificate.subject'),
          html_template: {
            path_layout: 'icontec',
            path_template: path_template,
            params
          },
          amount_notifications: 1
        },
        notification_source: params.notification_source
      });
      return mail
    } catch (error) {
      console.log('sendNotificationCertificate Error: ', error);
      return responseUtility.buildResponseFailed('json');
    }
  }

  /**
   * @INFO Enviar notificación de no descarga de certificados
   */
  public sendNotificationReminderCertificate = async (courseSchedulingId: string) => {
    try {
      const courseScheduling = await this.getCourseSchedulingFromId(courseSchedulingId);
      if (!courseScheduling.material_assistant || !courseScheduling.account_executive) return;
      // Enviar la notificación
      let path_template = 'course/schedulingReminderCertificated';
      const params = {
        mailer: customs['mailer'],
        today: moment.utc().format('YYYY-MM-DD'),
        notification_source: `scheduling_notification_reminder_certificate_${courseScheduling._id}`,
        // Información
        assistant_name: `${courseScheduling.material_assistant?.profile?.first_name} ${courseScheduling.material_assistant?.profile?.last_name}`,
        program_name: courseScheduling.program.name,
        program_code: courseScheduling.program.code,
        service_id: courseScheduling.metadata.service_id,
        modality: courseScheduling.schedulingMode.name,
        duration: this.formatSecondsToHours(courseScheduling.duration),
        startDate: moment.utc(courseScheduling.startDate).format('YYYY-MM-DD'),
        endDate: moment.utc(courseScheduling.endDate).format('YYYY-MM-DD'),
        observations: courseScheduling.observations,
        accountExecutive: courseScheduling.account_executive?.profile?.first_name,
        regional: courseScheduling.regional.name
      };
      const emails: string[] = [courseScheduling.material_assistant.email];
      const mail = await mailService.sendMail({
        emails,
        mailOptions: {
          subject: i18nUtility.__('mailer.scheduling_reminder_certificate.subject'),
          html_template: {
            path_layout: 'icontec',
            path_template: path_template,
            params
          },
          amount_notifications: 1
        },
        notification_source: params.notification_source
      });
      return mail
    } catch (error) {
      console.log('sendNotificationReminderCertificate Error: ', error);
      return responseUtility.buildResponseFailed('json');
    }
  }

  /**
   * @INFO Verificar si un courseScheduling ya tiene cargadas todas las asistencias en moodle
   * @param moodle_id
   */
  public isAttendanceComplete = async (moodle_id: string, courseSchedulingId: string, minimumPercentage?: number): Promise<boolean> => {
    const moduleType = ['attendance'];
    // Obtener los módulos de asistencia que tiene la programación
    const modules: any = await this.getCourseExamList(moodle_id, moduleType);
    let completeAssistance: boolean = true;
    if (modules && modules.courseModules && modules.courseModules.length) {
      const courseModules = modules.courseModules;
      const qualifiedModules: any = await certificateService.rulesForCompletion({
        courseID: moodle_id,
        course_scheduling: courseSchedulingId,
        without_certification: true
      });
      if (qualifiedModules && qualifiedModules.completion && qualifiedModules.completion.length) {
        qualifiedModules.completion.forEach((_itemCompletion) => {
          if (_itemCompletion && _itemCompletion.listOfStudentProgress && _itemCompletion.listOfStudentProgress.length) {
            _itemCompletion.listOfStudentProgress.forEach((itemStudent) => {
              if (completeAssistance && itemStudent.student && itemStudent.student.itemType && itemStudent.student.itemType.attendance) {
                // Revisar la asistencia por cada estudiante
                itemStudent.student.itemType.attendance.forEach((attendance) => {
                  if (attendance && courseModules.find((item) => item.id === attendance.cmid)) {
                    if (attendance && attendance.graderaw !== null && attendance.graderaw !== undefined) {
                    } else {
                      // @INFO Si la asistencia tiene calificación de null o undefined la marca como no diligenciada
                      completeAssistance = false;
                    }
                  } else {
                    // @INFO Si no encuentra la asistencia en el curso la marca como false porque es un error
                    completeAssistance = false;
                  }
                });
              }
            })
          }
        })
      }
    } else {
      completeAssistance = false;
    }
    return completeAssistance;
  }

  public sendReminderEmailForFreeOrMooc = async (courseSchedulingId: string, userId: string) => {
    try {
      const user: IUser = await User.findOne({ _id: userId }).select('_id email')
      if (!user || !user?.email?.length) return responseUtility.buildResponseFailed('json')
      const courseScheduling = await this.getCourseSchedulingFromId(courseSchedulingId);
      if (!courseScheduling.material_assistant || !courseScheduling.account_executive) return;
      // Enviar la notificación
      let path_template = 'course/schedulingReminderCertificated';
      const params = {
        mailer: customs['mailer'],
        today: moment.utc().format('YYYY-MM-DD'),
        notification_source: `scheduling_notification_reminder_certificate_${courseScheduling._id}`,
        // Información
        assistant_name: `${courseScheduling.material_assistant?.profile?.first_name} ${courseScheduling.material_assistant?.profile?.last_name}`,
        program_name: courseScheduling.program.name,
        program_code: courseScheduling.program.code,
        service_id: courseScheduling.metadata.service_id,
        modality: courseScheduling.schedulingMode.name,
        duration: this.formatSecondsToHours(courseScheduling.duration),
        startDate: moment.utc(courseScheduling.startDate).format('YYYY-MM-DD'),
        endDate: moment.utc(courseScheduling.endDate).format('YYYY-MM-DD'),
        observations: courseScheduling.observations,
        accountExecutive: courseScheduling.account_executive?.profile?.first_name,
        regional: courseScheduling.regional.name
      };
      const emails: string[] = [user.email];
      const mail = await mailService.sendMail({
        emails,
        mailOptions: {
          subject: i18nUtility.__('mailer.scheduling_reminder_certificate.subject'),
          html_template: {
            path_layout: 'icontec',
            path_template: path_template,
            params
          },
          amount_notifications: 1
        },
        notification_source: params.notification_source
      });
      return mail
    } catch (error) {
      console.log('sendReminderEmailForFreeOrMooc Error: ', error);
      return responseUtility.buildResponseFailed('json');
    }
  }

  /**
   * @INFO Obtener los módulos del servicio
   * @param courseScheduling
   * @returns
   */
  private getModulesOfCourseScheduling = async (courseScheduling: any) => {
    const response = await CourseSchedulingDetails.find({ course_scheduling: courseScheduling._id })
      .populate({ path: 'teacher', select: 'profile' })
      .populate({ path: 'course', select: 'name code moodle_id id' })
      .lean();
    if (response) {
      return response;
    }
    return [];
  }

  /**
   * @INFO Obtener el courseScheduling populado por id
   * @param id
   * @returns
   */
  private getCourseSchedulingFromId = async (id: string) => {
    const courseScheduling = await CourseScheduling.findOne({ _id: id })
      .populate({ path: 'schedulingMode', select: 'id name moodle_id' })
      .populate({ path: 'modular', select: 'id name' })
      .populate({ path: 'program', select: 'id name moodle_id code' })
      .populate({ path: 'schedulingType', select: 'id name' })
      .populate({ path: 'schedulingStatus', select: 'id name' })
      .populate({ path: 'regional', select: 'id name moodle_id' })
      .populate({ path: 'account_executive', select: 'id profile.first_name profile.last_name profile.timezone email' })
      .populate({ path: 'material_assistant', select: 'id profile.first_name profile.last_name profile.timezone email' })
      .populate({ path: 'city', select: 'id name' })
      .populate({ path: 'country', select: 'id name' })
      .populate({ path: 'metadata.user', select: 'id profile.first_name profile.last_name profile.timezone email' })
      .populate({ path: 'client', select: 'id name' })
      .lean();

    return courseScheduling;
  }

  /**
   * @INFO Obtener el courseSchedulingDetails populado por id
   * @param id
   */
  private getCourseSchedulingDetailsFromId = async (id: string) => {
    const courseSchedulingDetails = await CourseSchedulingDetails.findOne({ _id: id })
      .populate({ path: 'teacher', select: 'id profile' })
      .populate({ path: 'course', select: 'name code moodle_id id' })
      .lean();
    return courseSchedulingDetails;
  }

  /**
   * @INFO Formatear segundos a diferentes formatos [moveToUtils]
   * @param _seconds
   * @returns
   */
  private formatSecondsToHours = (_seconds: number) => {
    if (typeof _seconds !== 'number') {
      _seconds = Number(_seconds);
    }
    return `${Math.trunc((_seconds / 60) / 60)}h`
  }

  /**
   * @INFO Verificar si un servicio aplica para examen
   * @param courseScheduling : Módulos del servicio
   */
  public verifyCourseSchedulingExercise = async (moodle_id: string): Promise<IQuizModuleData> => {
    let response: IQuizModuleData = await this.verifyCourseSchedulingDetailsExercise(moodle_id);;
    return response;
  }

  /**
   * @INFO Verificar si un modulo del servicio tiene examen
   * @param module : Objeto de courseSchedulingDetails
   */
  private verifyCourseSchedulingDetailsExercise = async (moodle_id: string): Promise<IQuizModuleData> => {
    const exams: any = await this.getCourseExamList(moodle_id);
    if (exams && exams.courseModules && exams.courseModules.length) {

      let auditorQuizModule = exams.courseModules.find(field => field.isauditorquiz == true);

      if (auditorQuizModule) {
        let quizModuleData: IQuizModuleData = {
          sectionid: auditorQuizModule.sectionid,
          instanceid: auditorQuizModule.instance,
          moduleName: auditorQuizModule.sectionname,
          examnName: auditorQuizModule.name,
          hasExam: true,
          numberOfQuestions: 20
        }

        return quizModuleData;
      }
      return null;
    } else {
      return null;
    }
  }

  /**
   * @INFO Obtener los exámenes de un curso en moodle
   * @param courseId
   * @param moduleType
   */
  private getCourseExamList = async (courseID: string, _moduleType?: string[]) => {
    const moduleType: string[] = ['quiz'];
    const response = await courseContentService.moduleList({ courseID, moduleType: _moduleType ? _moduleType : moduleType });
    return response;
  }

  private getTimezoneOffset = (timezone: TimeZone = TimeZone.GMT_5) => TIME_ZONES_WITH_OFFSET[timezone]

}

export const courseSchedulingNotificationsService = new CourseSchedulingNotificationsService();
export { CourseSchedulingNotificationsService as DefaultAdminCourseCourseSchedulingNotificationsService };
