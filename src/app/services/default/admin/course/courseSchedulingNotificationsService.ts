// @import_dependencies_node Import libraries
import moment from 'moment';
// @end

// @import services
import { mailService } from '@scnode_app/services/default/general/mail/mailService';
import { courseContentService } from '@scnode_app/services/default/moodle/course/courseContentService';
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
// @end

class CourseSchedulingNotificationsService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * @INFO Enviar notificación de inicio de servicio al auxiliar logístico encargado
   */
  public sendNotificationOfServiceToAssistant = async (courseScheduling: any, type: 'started' | 'cancel' | 'modify' = 'started', populate?: boolean) => {
    try {
      let email_to_notificate = []

      if (populate) {
        courseScheduling = await this.getCourseSchedulingFromId(courseScheduling);
      }

      // @INFO Notificar al administrador
      const serviceScheduler = (courseScheduling.metadata && courseScheduling.metadata.user) ? courseScheduling.metadata.user : null
      if (serviceScheduler && (type === 'started')) {
        email_to_notificate.push(serviceScheduler.email)
      }

      // @INFO: Solo enviar al responsable del servicio
      const logisticAssistant = courseScheduling.material_assistant;
      if (logisticAssistant && logisticAssistant.email) {
        email_to_notificate.push(logisticAssistant.email);
      }

      // @INFO Encontrar las programaciones del servicio
      const modules = await this.getModulesOfCourseScheduling(courseScheduling);

      // @INFO Obtener si el servicio aplica para examen o no
      const exam: boolean = await this.verifyCourseSchedulingExercise(modules);

      if (email_to_notificate.length > 0) {
        const params = {
          mailer: customs['mailer'],
          today: moment().format('YYYY-MM-DD'),
          notification_source: `scheduling_notification_${type}_assistant_${courseScheduling._id}`,
          // Información
          assistant_name: `${courseScheduling.material_assistant.profile.first_name} ${courseScheduling.material_assistant.profile.last_name}`,
          program_name: courseScheduling.program.name,
          program_code: courseScheduling.program.code,
          service_id: courseScheduling.metadata.service_id,
          modality: courseScheduling.schedulingMode.name,
          modules: modules,
          duration: this.formatSecondsToHours(courseScheduling.duration),
          startDate: moment(courseScheduling.startDate).format('YYYY-MM-DD'),
          endDate: moment(courseScheduling.endDate).format('YYYY-MM-DD'),
          observations: courseScheduling.observations,
          exam: exam ? 'SI' : 'NO',
          accountExecutive: courseScheduling.account_executive.profile.first_name,
          regional: courseScheduling.regional.name
        };

        const path_template = type === 'started' || type === 'modify' ? 'course/startedServiceToAssistant' : 'course/cancelServiceToAssistant'

        const mail = await mailService.sendMail({
          emails: email_to_notificate,
          mailOptions: {
            subject: i18nUtility.__(type === 'started' ? 'mailer.scheduling_notification.subject' : type === 'modify' ? 'mailer.scheduling_update.subject' : 'mailer.scheduling_cancelled_notification.subject'),
            html_template: {
              path_layout: 'icontec',
              path_template: path_template,
              params: { ...params }
            },
            amount_notifications: null
          },
          notification_source: params.notification_source
        })
        return mail

      }
    } catch (e) {
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

    // @INFO Verificar si el courseSchedulingDetails aplica para examen
    const exam = await this.verifyCourseSchedulingDetailsExercise(courseSchedulingDetails);

    try {
      let path_template = 'survey/surveyNotification';
      const params = {
        mailer: customs['mailer'],
        // Informacion
        assistant_name: `${courseScheduling.material_assistant.profile.first_name} ${courseScheduling.material_assistant.profile.last_name}`,
        program_name: courseScheduling.program.name,
        service_id: courseScheduling.metadata.service_id,
        modality: courseScheduling.schedulingMode.name,
        module: courseSchedulingDetails.course.name,
        duration: this.formatSecondsToHours(courseSchedulingDetails.duration),
        startDate: moment(courseSchedulingDetails.startDate).format('YYYY-MM-DD'),
        endDate: moment(courseSchedulingDetails.endDate).format('YYYY-MM-DD'),
        teacher: `${courseSchedulingDetails.teacher.profile.first_name} ${courseSchedulingDetails.teacher.profile.last_name}`,
        observations: courseScheduling.observations,
        exam: exam ? 'SI' : 'NO',
        accountExecutive: courseScheduling.account_executive.profile.first_name,
        regional: courseScheduling.regional.name
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
        },
        notification_source: `survey_notification_${courseSchedulingDetailsId ? courseSchedulingDetailsId : courseSchedulingId}`
      })
      return mail
    }catch(e){
      console.log('Error send email notification: ', e);
      return e;
    }
  }

  /**
   * @INFO Obtener los módulos del servicio
   * @param courseScheduling
   * @returns
   */
  private getModulesOfCourseScheduling = async (courseScheduling: any) => {
    const response = await CourseSchedulingDetails.find({course_scheduling: courseScheduling._id})
    .populate({path: 'teacher', select: 'profile'})
    .populate({path: 'course', select: 'name code id'})
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
    const courseScheduling = await CourseScheduling.findOne({_id: id})
    .populate({ path: 'schedulingMode', select: 'id name moodle_id' })
    .populate({ path: 'modular', select: 'id name' })
    .populate({ path: 'program', select: 'id name moodle_id code' })
    .populate({ path: 'schedulingType', select: 'id name' })
    .populate({ path: 'schedulingStatus', select: 'id name' })
    .populate({ path: 'regional', select: 'id name moodle_id' })
    .populate({ path: 'account_executive', select: 'id profile.first_name profile.last_name email' })
    .populate({ path: 'material_assistant', select: 'id profile.first_name profile.last_name email' })
    .populate({ path: 'city', select: 'id name' })
    .populate({ path: 'country', select: 'id name' })
    .populate({ path: 'metadata.user', select: 'id profile.first_name profile.last_name email' })
    .populate({ path: 'client', select: 'id name' })
    .lean();

    return courseScheduling;
  }

  /**
   * @INFO Obtener el courseSchedulingDetails populado por id
   * @param id
   */
  private getCourseSchedulingDetailsFromId = async (id: string) => {
    const courseSchedulingDetails = await CourseSchedulingDetails.findOne({_id: id})
    .populate({ path: 'teacher', select: 'id profile' })
    .populate({path: 'course', select: 'name code id'})
    .lean();
    return courseSchedulingDetails;
  }

  /**
   * @INFO Formatear segundos a diferentes formatos
   * @param _seconds
   * @returns
   */
  private formatSecondsToHours = (_seconds: number) => {
    if (typeof _seconds !== 'number') {
      _seconds = Number(_seconds);
    }
    return `${Math.trunc((_seconds/60)/60)}h`
  }

  /**
   * @INFO Verificar si un servicio aplica para examen
   * @param courseScheduling : Módulos del servicio
   */
  private verifyCourseSchedulingExercise = async (modules: any[]): Promise<boolean> => {
    let response: boolean = false;
    if (modules && modules.length) {
      for await (let module of modules) {
        if (!response) {
          const verify = await this.verifyCourseSchedulingDetailsExercise(module);
          if (verify) {
            response = true;
          }
        }
      }
    }
    return response;
  }

  /**
   * @INFO Verificar si un modulo del servicio tiene examen
   * @param module : Objeto de courseSchedulingDetails
   */
  private verifyCourseSchedulingDetailsExercise = async (module: any): Promise<boolean> => {
    if (!module || !module.course || !module.course.code) return false;
    const exams: any = await this.getCourseExamList(module.course.code);
    if (exams && exams.courseModules && exams.courseModules.length) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * @INFO Obtener los exámenes de un curso en moodle
   * @param courseId
   * @param moduleType
   */
  private getCourseExamList = async (courseID: string) => {
    const moduleType: string[] = ['quiz'];
    const response = await courseContentService.moduleList({courseID, moduleType});
    return response;
  }


}

export const courseSchedulingNotificationsService = new CourseSchedulingNotificationsService();
export { CourseSchedulingNotificationsService as DefaultAdminCourseCourseSchedulingNotificationsService };
