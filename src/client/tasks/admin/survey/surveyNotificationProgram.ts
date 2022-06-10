// @import_services Import Services
import { DefaultPluginsTaskTaskService } from "@scnode_core/services/default/plugins/tasks/taskService";
import { courseSchedulingNotificationsService } from '@scnode_app/services/default/admin/course/courseSchedulingNotificationsService';
// @end

// @import_models Import models
import { SurveyLog, CourseScheduling, CourseSchedulingStatus, MailMessageLog, CourseSchedulingDetails, CertificateQueue } from '@scnode_app/models';
// @end

// @import_utilitites Import utilities
import moment from 'moment';
// @end

// @import types
import {TaskParams} from '@scnode_core/types/default/task/taskTypes'
// @end

class SurveyNotificationProgram extends DefaultPluginsTaskTaskService {

  /**
   * Metodo que contiene la logica de la tarea
   * @return Booleano que identifica si se pudo o no ejecutar la tarea
   */
  public run = async (taskParams: TaskParams) => {
    // @task_logic Add task logic

    //await this.sendSchedulingCertificateNotification();

    await this.sendSchedulingExamNotification();

    //await this.sendAssistanceNotification();

    //await this.sendSurveyNotifications();

    // @end

    return true; // Always return true | false
  }

  // @add_more_methods

  private sendSchedulingExamNotification = async () => {
    // Obtener todos los servicios confirmados y finalizados con fecha de finalización inferior a 3 meses
    // TODO: Revisar si es necesario el status de Ejecutado
    const status = await CourseSchedulingStatus.find({name: {$in: ['Confirmado', 'Ejecutado']}});
    const date = new Date();
    // TODO: Revisar si solo se deben escoger hasta los servicios que hayan finalizado los últimos 3 meses
    date.setMonth(date.getMonth() - 3);
    const schedulings = await CourseScheduling.find({schedulingStatus: {$in: status.map(s => s._id)}, endDate: {$gt: date}}).select('id moodle_id').lean();
    // Enviar notificación de activación de examen
    if (schedulings && schedulings.length) {
      for await (let scheduling of schedulings) {
        const attendanceComplete = await courseSchedulingNotificationsService.isAttendanceComplete(scheduling.moodle_id, scheduling._id);
        const hasAnExam = await courseSchedulingNotificationsService.verifyCourseSchedulingExercise(scheduling.moodle_id);
        if (attendanceComplete && hasAnExam) {
          await courseSchedulingNotificationsService.sendNotificationExamToAssistance(scheduling._id);
          // ! ==================================================================
          // ! NICO!!! Aquí va la linea para enviar la notificación de examen
          // ! ==================================================================
        }
      }
    }
  }

  private sendSchedulingCertificateNotification = async () => {
    // Obtener todos los servicios confirmados y finalizados con fecha de finalización inferior a 3 meses
    // TODO: Revisar si es necesario el status de finalizado
    const status = await CourseSchedulingStatus.find({name: {$in: ['Confirmado', 'Ejecutado']}});
    const date = new Date();
    // TODO: Revisar si solo se deben escoger hasta los servicios que hayan finalizado los últimos 3 meses
    date.setMonth(date.getMonth() - 3);
    const schedulings = await CourseScheduling.find({schedulingStatus: {$in: status.map(s => s._id)}, endDate: {$gt: date}}).select('id moodle_id').lean();
    // Enviar notificación de activación de examen
    if (schedulings && schedulings.length) {
      for await (let scheduling of schedulings) {
        // Buscar si se envió un email de activación de examen del servicio
        const log = await MailMessageLog.findOne({notification_source: `scheduling_notification_exam_assistant_${scheduling._id}`}).select('id created_at');
        if (log) {
          // Revisar si han pasado 8 días desde el envío de la notificación de examen
          const sendDate = new Date(log.created_at);
          sendDate.setDate(sendDate.getDate() + 8);
          if (moment().format('YYYY - MM - DD') === moment(sendDate).format('YYYY - MM - DD')) {
            await courseSchedulingNotificationsService.sendNotificationCertificate(scheduling._id);
          }
          // Revisar si han pasado 2 meses desde el envío de la notificación de examen
          const sendDate2 = new Date(log.created_at);
          sendDate2.setMonth(sendDate2.getMonth() + 2);
          if (moment().format('YYYY - MM - DD') === moment(sendDate2).format('YYYY - MM - DD')) {
            // Revisar si hay certificados pendientes por descargar en el servicio
            const certificates = await CertificateQueue.find({courseId: scheduling._id, downloadDate: {$exists: false}});
            if (certificates && certificates.length) {
              await courseSchedulingNotificationsService.sendNotificationReminderCertificate(scheduling._id);
            }
          }
        } else {
          let details = await CourseSchedulingDetails.find({course_scheduling: scheduling._id});
          if (details && details.length) {
            details = details.sort((a,b) => (new Date(b.endDate).getTime()) - (new Date(a.endDate).getTime()));
            // Si no se ha emitido examen revisar si han pasado 8 días desde la ultima sesión
            const compareDate = new Date(details[0].endDate);
            compareDate.setDate(compareDate.getDate() + 8);
            if (moment().format('YYYY - MM - DD') === moment(compareDate).format('YYYY - MM - DD')) {
              await courseSchedulingNotificationsService.sendNotificationCertificate(scheduling._id);
            }
            // Revisar si han pasado 2 meses desde la ultima sesión
            const compareDate2 = new Date(details[0].endDate);
            compareDate2.setMonth(compareDate2.getMonth() + 2);
            if (moment().format('YYYY - MM - DD') === moment(compareDate2).format('YYYY - MM - DD')) {
              // Revisar si hay certificados pendientes por descargar en el servicio
              const certificates = await CertificateQueue.find({courseId: scheduling._id, downloadDate: {$exist: false}});
              if (certificates && certificates.length) {
                await courseSchedulingNotificationsService.sendNotificationReminderCertificate(scheduling._id);
              }
            }
          }
        }
      }
    }
  }

  private sendAssistanceNotification = async () => {
    // Obtener todos los servicios confirmados y finalizados con fecha de finalización inferior a 3 meses
    // TODO: Revisar si es necesario el status de finalizado
    const status = await CourseSchedulingStatus.find({name: {$in: ['Confirmado', 'Ejecutado']}});
    const date = new Date();
    // TODO: Revisar si solo se deben escoger hasta los servicios que hayan finalizado los últimos 3 meses
    date.setMonth(date.getMonth() - 3);
    const schedulings = await CourseScheduling.find({schedulingStatus: {$in: status.map(s => s._id)}, endDate: {$gt: date}}).select('id moodle_id').lean();
    if (schedulings && schedulings.length) {
      for await (let scheduling of schedulings) {
        let details = await CourseSchedulingDetails.find({course_scheduling: scheduling._id});
        if (details && details.length) {
          details = details.sort((a,b) => (new Date(b.endDate).getTime()) - (new Date(a.endDate).getTime()));
          // Si no se ha emitido examen revisar si ha pasado 1 día desde la ultima sesión
          const compareDate = new Date(details[0].endDate);
          compareDate.setDate(compareDate.getDate() + 1);
          console.log('Today: ', moment().format('YYYY - MM - DD'));
          console.log('compareDate: ', moment(compareDate).format('YYYY - MM - DD'));
          if (moment(compareDate).isBefore(new Date())) {
            // Verificar si no se ha subido toda la asistencia
            const assistanceComplete = await courseSchedulingNotificationsService.isAttendanceComplete(scheduling.moodle_id, scheduling._id);
            if (!assistanceComplete) {
              await courseSchedulingNotificationsService.sendSurveyAssistanceNotification(scheduling._id);
            }
          }
        }
      }
    }
  }

  private sendSurveyNotifications = async () => {
    // @INFO Buscar los survey_log que no hayan sido respondidos
    const logs = await SurveyLog.find({answer_users: {$size: 0}});
    if (logs && logs.length) {
      // @INFO Verificar si ha pasado el tiempo suficiente
      const hoursToVerify = 24;
      for await (let log of logs) {
        const endDate = moment(log.endDate);
        const today = moment();
        if (today.isAfter(endDate.add(hoursToVerify, 'hours'))) {
          // @INFO Notificar al auxiliar logístico del servicio
          if (log.course_scheduling && log.course_scheduling_details) {
            await courseSchedulingNotificationsService.sendSurveyAssistanceNotification(log.course_scheduling, log.course_scheduling_details);
          }
        }
      }
    }
  }
  // @end
}

export const surveyNotificationProgram = new SurveyNotificationProgram();
export { SurveyNotificationProgram };
