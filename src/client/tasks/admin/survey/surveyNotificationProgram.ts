// @import_services Import Services
import { DefaultPluginsTaskTaskService } from "@scnode_core/services/default/plugins/tasks/taskService";
import { courseSchedulingNotificationsService } from '@scnode_app/services/default/admin/course/courseSchedulingNotificationsService';
import { enrollmentService } from '@scnode_app/services/default/admin/enrollment/enrollmentService';
// @end

// @import_models Import models
import { SurveyLog, CourseScheduling, CourseSchedulingStatus, MailMessageLog, CourseSchedulingDetails, CertificateQueue } from '@scnode_app/models';
// @end

// @import_utilitites Import utilities
import moment from 'moment';
// @end

// @import types
import { TaskParams } from '@scnode_core/types/default/task/taskTypes'
import { IStudentExamNotification } from '@scnode_app/types/default/admin/notification/notificationTypes'
import { certificateService } from '@scnode_app/services/default/huellaDeConfianza/certificate/certificateService'
import { calendarEventsService } from "@scnode_app/services/default/moodle/calendarEvents/calendarEventsService";
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

  private getExamEndDate = (date): boolean | string => {
    const today = moment.utc(moment.utc().format('YYYY-MM-DD 23:59:59'));
    const limitDate  = moment.utc(date).add('8', 'days')
    const diffDays = limitDate.diff(today, 'days')
    let examEndDate: boolean | string = false;
    if (diffDays < 0) {
    //  console.log('*** Exam is closed')
    } else if (diffDays === 0) {
      // console.log('*** Exam close today')
      examEndDate = today.format('YYYY-MM-DD 23:59:59')
    } else {
      // console.log(`*** Exam end in ${diffDays}`)
      examEndDate = today.add(diffDays > 8 ? 8 : diffDays, 'days').format('YYYY-MM-DD 23:59:59')
    }
    // console.log('--- examEndDate', examEndDate)
    // console.groupEnd()
    return examEndDate
  }

  private sendSchedulingExamNotification = async () => {
    const status = await CourseSchedulingStatus.find({ name: { $in: ['Confirmado'] } });
    const today = moment.utc();
    // const ids = ['6331b3249cfa2f84c37518b7']

    const schedulings = await CourseScheduling.find({
      schedulingStatus: { $in: status.map(s => s._id) },
      _id: {
        $in: ['652418de403a1a0313569b01']
      }
    })
    .populate({path: 'schedulingMode', select: 'id name'})
    .select('id moodle_id schedulingMode endDate metadata').lean();

    if (schedulings && schedulings.length) {

      for await (let scheduling of schedulings) {
        console.group(`--------  Service ${scheduling?.metadata?.service_id} - ${scheduling?.schedulingMode?.name} --------`)
        const isVirtual = scheduling?.schedulingMode?.name === 'Virtual' ? true : false;
        const examData = await courseSchedulingNotificationsService.verifyCourseSchedulingExercise(scheduling.moodle_id);

        if (examData?.hasExam) {
          const eventsByCourse: any = await calendarEventsService.fetchOnlyEvents({
            courseID: scheduling.moodle_id
          })

          if (eventsByCourse?.events) {
            const events: {open: number, close: number} = eventsByCourse.events.reduce((accum, element) => {
              if (element?.instance && element?.timestart && element?.instance === examData.instanceid) {
                if (['open', 'close'].includes(element?.eventtype)) {
                  accum[element.eventtype] = element.timestart
                }
              }
              return accum;
            }, {})

            if (events?.open && events?.close) {
              let examEndDate = undefined;
              const startDate = moment.unix(events.open)
              const endDate = moment.unix(events.close)
              let examEnabled = false;

              if (today.isSameOrAfter(startDate) && today.isSameOrBefore(endDate)) {
                examEnabled = true;
              }

              if (examEnabled) {
                // console.log('events', events)
                // console.log('today', today)
                // console.log('startDate', startDate)
                // console.log('endDate', endDate)
                console.log(`Examen habilitado desde ${startDate.format('YYYY-MM-DD')} hasta ${endDate.format('YYYY-MM-DD')}`)
                const response: any = await courseSchedulingNotificationsService.sendNotificationExamToAssistance(scheduling._id);
                console.log("response sendNotification to Aux");
                console.log(response);
                examEndDate = moment(endDate).format('YYYY-MM-DD 23:59:59');

                // @INFO: Lista de participantes del servicio
                const responseEnrollment: any = await enrollmentService.list({ courseID: scheduling.moodle_id });
                if (responseEnrollment.status == 'error') {
                  continue;
                }

                // let counter = 1;
                const academicDataResponse: any = await certificateService.completion({
                  courseID: scheduling?.moodle_id,
                  course_scheduling: scheduling._id,
                  // without_certification: true
                })
                const academicDataByUser = academicDataResponse?.enrollment.reduce((accum, element) => {
                  if (element?.user?._id) {
                    if (!accum[element?.user?._id]) {
                      accum[element?.user?._id] = element;
                    }
                  }
                  return accum;
                }, {})

                for await (let student of responseEnrollment.enrollment) {
                  let sendNotificationToStudent = false;
                  console.log(`++++++++++++++++++++++++++++++++`);
                  console.log(`Student ${student.user.fullname}: ${student.user.email}`)
                  if (isVirtual) {
                    sendNotificationToStudent = true;
                  } else {
                    if (academicDataByUser[student.user._id]) {
                      console.log('Presencial/En linea - Check attendance')
                      // @INFO: Para presencial / enlinea se debe validar la asistencia
                      const progress = academicDataByUser[student.user._id].progress || undefined
                      const percentage = progress && progress?.assistanceDetails?.percentage || 0
                      if (percentage >= 100) {
                        sendNotificationToStudent = true;
                      }
                    }
                  }
                  console.log(`Status to notificate: ${sendNotificationToStudent}`)

                  if (sendNotificationToStudent) {

                    const emailParams: IStudentExamNotification = {
                      courseSchedulingId: scheduling._id,
                      studentId: student.user._id,
                      studentName: student.user.fullname,
                      email: student.user.email,
                      serviceId: scheduling.metadata.service_id,
                      endDate: examEndDate,
                      moduleName: examData.moduleName,
                      numberOfQuestions: examData.numberOfQuestions
                    }
                    console.log(`→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→`);
                    console.log(`Send notification to ${student.user.fullname} : ${student.user.email}`);
                    console.log(emailParams)
                    const response: any = await courseSchedulingNotificationsService.sendNotificationExamToParticipant(emailParams);
                    console.log(response);
                  }
                  console.log(`++++++++++++++END++++++++++++++++++`);
                  // counter++;
                }
              }
            }
          }
        }
        console.groupEnd()
      }
    }
  }

  private sendSchedulingCertificateNotification = async () => {
    // Obtener todos los servicios confirmados y finalizados con fecha de finalización inferior a 3 meses
    // TODO: Revisar si es necesario el status de finalizado
    const status = await CourseSchedulingStatus.find({ name: { $in: ['Confirmado', 'Ejecutado'] } });
    const date = new Date();
    // TODO: Revisar si solo se deben escoger hasta los servicios que hayan finalizado los últimos 3 meses
    date.setMonth(date.getMonth() - 3);
    const schedulings = await CourseScheduling.find({ schedulingStatus: { $in: status.map(s => s._id) }, endDate: { $gt: date } }).select('id moodle_id').lean();
    // Enviar notificación de activación de examen
    if (schedulings && schedulings.length) {
      for await (let scheduling of schedulings) {
        // Buscar si se envió un email de activación de examen del servicio
        const log = await MailMessageLog.findOne({ notification_source: `scheduling_notification_exam_assistant_${scheduling._id}` }).select('id created_at');
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
            const certificates = await CertificateQueue.find({ courseId: scheduling._id, downloadDate: { $exists: false } });
            if (certificates && certificates.length) {
              await courseSchedulingNotificationsService.sendNotificationReminderCertificate(scheduling._id);
            }
          }
        } else {
          let details = await CourseSchedulingDetails.find({ course_scheduling: scheduling._id });
          if (details && details.length) {
            details = details.sort((a, b) => (new Date(b.endDate).getTime()) - (new Date(a.endDate).getTime()));
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
              const certificates = await CertificateQueue.find({ courseId: scheduling._id, downloadDate: { $exists: false } });
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
    const status = await CourseSchedulingStatus.find({ name: { $in: ['Confirmado', 'Ejecutado'] } });
    const date = new Date();
    // TODO: Revisar si solo se deben escoger hasta los servicios que hayan finalizado los últimos 3 meses
    date.setMonth(date.getMonth() - 3);
    const schedulings = await CourseScheduling.find({ schedulingStatus: { $in: status.map(s => s._id) }, endDate: { $gt: date } }).select('id moodle_id').lean();
    if (schedulings && schedulings.length) {
      for await (let scheduling of schedulings) {
        let details = await CourseSchedulingDetails.find({ course_scheduling: scheduling._id });
        if (details && details.length) {
          details = details.sort((a, b) => (new Date(b.endDate).getTime()) - (new Date(a.endDate).getTime()));
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
    const logs = await SurveyLog.find({ answer_users: { $size: 0 } });
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
