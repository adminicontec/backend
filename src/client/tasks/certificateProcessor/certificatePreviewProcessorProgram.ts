// @import_services Import Services
import { DefaultPluginsTaskTaskService } from "@scnode_core/services/default/plugins/tasks/taskService";
import { certificateQueueService } from "@scnode_app/services/default/admin/certificateQueue/certificateQueueService";
import { certificateService } from "@scnode_app/services/default/huellaDeConfianza/certificate/certificateService"
import { notificationEventService } from "@scnode_app/services/default/events/notifications/notificationEventService";
// @end

// @import_models Import models
import { CourseScheduling } from "@scnode_app/models";
// @end

// @import_utilitites Import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import types
import { TaskParams } from '@scnode_core/types/default/task/taskTypes'
import { QueryValues } from '@scnode_app/types/default/global/queryTypes'
import { ICertificatePreview } from '@scnode_app/types/default/admin/certificate/certificateTypes'
import { IParticipantData } from '@scnode_app/types/default/events/notifications/notificationTypes'
// @end

class CertificatePreviewProcessorProgram extends DefaultPluginsTaskTaskService {

  /**
   * Metodo que contiene la logica de la tarea
   * @return Booleano que identifica si se pudo o no ejecutar la tarea
   */
  public run = async (taskParams: TaskParams) => {
    // @task_logic Add task logic
    let responseProcessedDocument = [];
    let listOfParticipants: IParticipantData[] = [];

    console.log("Init Task: Certificate Preview Processor ");
    console.log("Get all generated certificate to process a preview")

    const select = ["Requested"];

    let respQueueToPreview: any = await certificateQueueService.
      findBy({
        query: QueryValues.ALL, where: [{ field: 'status', value: { $in: select } }]
      });

    if (respQueueToPreview.certificateQueue.length != 0) {
      console.log("[" + respQueueToPreview.certificateQueue.length + "] Certificate(s) to preview. ");

      // First loop: get certificate preview
      for await (const docPreview of respQueueToPreview.certificateQueue) {
        let queuePreview: ICertificatePreview;
        queuePreview = {
          certificate_queue: docPreview._id.toString(),
          hash: docPreview.certificate.hash,
          format: 2,
          template: 1,
          updateCertificate: true,
        };

        //Get preview of recent certificate
        //responseProcessedDocument.push(docPreview);

        let responsePreviewCertificate: any = await certificateService.previewCertificate(queuePreview);
        console.log("---------------------- -----------");
        console.log("\n\rResponse preview: ");
        console.log(responsePreviewCertificate);
        console.log("---------------------- -----------");

        if (responsePreviewCertificate.status == 'success') {
          responseProcessedDocument.push(docPreview);
        }

      }

      if (responseProcessedDocument) {
        //#region Student Notifications
        // Second Loop: send email notifications to students whose certificate is OK
        for await (const docProcessed of responseProcessedDocument) {
          console.log("---------------------- -----------");
          console.log('Envío de notificación a Estudiante:');
          console.log("---------------------- -----------");

          const notificationResponse = await notificationEventService.sendNotificationParticipantCertificated({
            participantId: docProcessed.userId._id,
            courseSchedulingId: docProcessed.courseId
          });
          console.log(notificationResponse);
        }
        //#endregion Student Notifications

        //#region Assistant Notifications

        // Third Loop: send notifications by e-mail to the operational assistants responsible for the emission.
        let groupByAssistant = responseProcessedDocument.reduce(function (r, a) {
          r[a.auxiliar._id] = r[a.auxiliar._id] || [];
          r[a.auxiliar._id].push(a);
          return r;
        }, {});

        for (const key of Object.keys(groupByAssistant)) {

          for (const value of Object.values(groupByAssistant[key])) {
            let certificateData: any = value;
            // Object.values(groupByAssistant[key]).forEach((value: any) => {
            const courseScheduling: any = await CourseScheduling.findOne({ _id: certificateData.courseId }).select('id program')
              .populate({ path: 'program', select: 'id name code' })

            if (!courseScheduling) {
              console.log(`Error trying to find course: ${certificateData.courseId}`)
              continue;
            };

            listOfParticipants.push({
              participantId: certificateData.userId._id,
              participantFullName: `${certificateData.userId.profile.first_name} ${certificateData.userId.profile.last_name}`,
              courseSchedulingId: certificateData.courseId,
              courseSchedulingName: courseScheduling.program.name,
              certificateType: certificateData.certificateType
            });
          }
          console.log('::::::::::::::::::::::::::::::::::::::::::::::');
          console.log(`Sending notification to Operative Assistant: ${key}`);
          console.log('::::::::::::::::::::::::::::::::::::::::::::::');
          const notificationResponseAuxiliar = await notificationEventService.sendNotificationCertificateCompleteToAuxiliar({
            auxiliarId: key,
            participants: listOfParticipants
          });
          console.log(notificationResponseAuxiliar.status);
        }
        //#endregion Assistant Notifications

      }
    }
    else {
      console.log("There're no certificates to preview.");
    }

    // @end
    return true; // Always return true | false
  }


  // @add_more_methods
  // @end
}

export const certificatePreviewProcessorProgram = new CertificatePreviewProcessorProgram();
export { CertificatePreviewProcessorProgram };
