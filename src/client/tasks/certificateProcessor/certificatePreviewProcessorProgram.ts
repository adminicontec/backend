// @import_services Import Services
import { DefaultPluginsTaskTaskService } from "@scnode_core/services/default/plugins/tasks/taskService";
import { certificateQueueService } from "@scnode_app/services/default/admin/certificateQueue/certificateQueueService";
import { certificateService } from "@scnode_app/services/default/huellaDeConfianza/certificate/certificateService"
import { notificationEventService } from "@scnode_app/services/default/events/notifications/notificationEventService";
// @end

// @import_models Import models
import { CourseScheduling, MailMessageLog } from "@scnode_app/models";
// @end

// @import_utilitites Import utilities
// @end

// @import types
import { TaskParams } from '@scnode_core/types/default/task/taskTypes'
import { QueryValues } from '@scnode_app/types/default/global/queryTypes'
import { ICertificatePreview } from '@scnode_app/types/default/admin/certificate/certificateTypes'
import { IParticipantData, ISendNotificationAssistantCertificateGeneration } from '@scnode_app/types/default/events/notifications/notificationTypes'
// @end

class CertificatePreviewProcessorProgram extends DefaultPluginsTaskTaskService {

  /**
   * Metodo que contiene la logica de la tarea
   * @return Booleano que identifica si se pudo o no ejecutar la tarea
   */
  public run = async (taskParams: TaskParams) => {
    // @task_logic Add task logic

    console.log("Init Task: Certificate Preview Processor ");
    await this.processRequested()
    await this.processCompleted()

    // @end
    return true; // Always return true | false
  }

  private processRequested = async () => {

    console.log("Get all requested certificates to process a PDF File")
    const responseProcessedDocument = [];
    const select = ["Requested"];

    const respQueueToPreview: any = await certificateQueueService.
      findBy({
        query: QueryValues.ALL, where: [
          { field: 'status', value: { $in: select } },
          // { field: 'courseId', value: '61aa88da325be3c95039b159'},
          // { field: '_id', value: '64ff499113902c48e72264b1'}
        ]
      });

    if (respQueueToPreview?.certificateQueue.length !== 0) {
      for await (const docPreview of respQueueToPreview.certificateQueue) {
        const queuePreview: ICertificatePreview = {
          certificate_queue: docPreview._id.toString(),
          hash: docPreview.certificate.hash,
          format: 2,
          template: 1,
          updateCertificate: true,
        }
        const responsePreviewCertificate: any = await certificateService.previewCertificate(queuePreview);

        if (responsePreviewCertificate.status == 'success') {
          responseProcessedDocument.push(docPreview);
        }
      }

      for await (const docProcessed of responseProcessedDocument) {
        await this.sendStudentNotification(docProcessed.courseId, docProcessed)
      }

      const groupByAssistant = responseProcessedDocument.reduce((accum, element) => {
        if (!accum[element.auxiliar._id]) {
          accum[element.auxiliar._id] = {}
        }
        if (!accum[element.auxiliar._id][element.courseId]) {
          accum[element.auxiliar._id][element.courseId] = []
        }
        accum[element.auxiliar._id][element.courseId].push(element)
        return accum;
      }, {});

      for (const auxiliarKey in groupByAssistant) {
        if (Object.prototype.hasOwnProperty.call(groupByAssistant, auxiliarKey)) {

          const courses = groupByAssistant[auxiliarKey];
          for (const courseSchedulingId in courses) {
            if (Object.prototype.hasOwnProperty.call(courses, courseSchedulingId)) {

              const courseScheduling = await CourseScheduling.findOne({ _id: courseSchedulingId })
                .select('id program metadata certificate auditor_certificate')
                .populate({ path: 'program', select: 'id name code' })

              if (!courseScheduling) {
                console.log(`Error trying to find course: ${courseSchedulingId}`)
                continue;
              };

              const serviceId = courseScheduling?.metadata?.service_id || '-';
              const certificates = courses[courseSchedulingId];

              const notificationData: ISendNotificationAssistantCertificateGeneration = {
                auxiliarId: auxiliarKey,
                serviceId,
                certifications: [],
                programName: courseScheduling.program.name,
              }

              for (const certificateData of certificates) {
                let certificateName = '';
                if (certificateData?.certificateSetting) {
                  certificateName = certificateData?.certificate?.title || '-'
                } else {
                  certificateName = (certificateData.certificateType == 'academic') ? courseScheduling.certificate : courseScheduling.auditor_certificate;
                }
                const participant: IParticipantData = {
                  serviceId: serviceId,
                  participantId: certificateData.userId._id,
                  participantFullName: `${certificateData.userId.profile.first_name} ${certificateData.userId.profile.last_name}`,
                  certificationName: certificateName,
                  certificateType: certificateData.certificateType,
                  document: certificateData.userId.profile.doc_number,
                  regional: certificateData.userId.profile.regional
                }
                notificationData.certifications.push(participant)
              }

              if (notificationData?.certifications.length > 0) {
                console.log('::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::');
                console.log(`Sending notification to Operative Assistant: ${auxiliarKey}`);
                console.log('Data', notificationData)
                console.log('::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::');
                const notificationResponseAuxiliar = await notificationEventService.sendNotificationCertificateCompleteToAuxiliar(notificationData);
                console.log(notificationResponseAuxiliar);
              }
            }
          }
        }
      }

    }
    else {
      console.log("There're no certificates to process as PDF.");
    }
  }

  private processCompleted = async () => {
    console.log("Get all completed certificates to notificate")

    const selectAsComplete = ["Complete"];

    const respNotificationsOnHold: any = await certificateQueueService.
      findBy({
        query: QueryValues.ALL, where: [
          { field: 'status', value: { $in: selectAsComplete } },
          { field: 'notificationSent', value: { $in: [null, false] } },
          // { field: 'courseId', value: '61aa88da325be3c95039b159'},
        ]
      });

    if (respNotificationsOnHold?.certificateQueue.length !== 0) {
      for (let notificationToSend of respNotificationsOnHold.certificateQueue) {
        await this.sendStudentNotification(notificationToSend.courseId, notificationToSend)
      }
    }
  }

  private sendStudentNotification = async (courseSchedulingId: string, docProcessed: any) => {
    const courseScheduling = await CourseScheduling.findOne({ _id: courseSchedulingId })
    .select('id program metadata certificate auditor_certificate certificate_students certificate_clients multipleCertificate')
    .populate({ path: 'program', select: 'id name code' })

    if (courseScheduling.certificate_students && courseScheduling.certificate_students == true) {
      console.log("---------------------- -----------");
      console.log(`Envío de notificación a Estudiante ${docProcessed?.userId?.profile?.first_name} ${docProcessed?.userId?.profile?.last_name} - ${docProcessed.filename} después de generar PDF :`);
      console.log("---------------------- -----------");
      let forceNotificationSended = false;
      if (courseScheduling?.multipleCertificate?.status === true) {
        const notifications = await MailMessageLog.find({
          notification_source: {$regex: `participant_certificated_${docProcessed.userId._id}_${courseScheduling._id}`}
        })
        .select('id')
        if (notifications.length > 0) {
          forceNotificationSended = true
        }
      }
      const notificationResponse = await notificationEventService.sendNotificationParticipantCertificated({
        certificateQueueId: docProcessed._id,
        participantId: docProcessed.userId._id,
        courseSchedulingId: docProcessed.courseId,
        consecutive: docProcessed.certificateConsecutive,
        forceNotificationSended
      });

      console.log(notificationResponse);

    }
  }
}

export const certificatePreviewProcessorProgram = new CertificatePreviewProcessorProgram();
export { CertificatePreviewProcessorProgram };
