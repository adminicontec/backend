// @import_services Import Services
import { DefaultPluginsTaskTaskService } from "@scnode_core/services/default/plugins/tasks/taskService";
import { certificateQueueService } from "@scnode_app/services/default/admin/certificateQueue/certificateQueueService";
import { certificateService } from "@scnode_app/services/default/huellaDeConfianza/certificate/certificateService";
import { notificationEventService } from "@scnode_app/services/default/events/notifications/notificationEventService";
// @end

// @import_models Import models
// @end

// @import_utilitites Import utilities
// @end

// @import types
import { TaskParams } from '@scnode_core/types/default/task/taskTypes'
import { QueryValues } from '@scnode_app/types/default/global/queryTypes'

// @end

class CertificateProcessorProgram extends DefaultPluginsTaskTaskService {

  /**
   * Metodo que contiene la logica de la tarea
   * @return Booleano que identifica si se pudo o no ejecutar la tarea
   */
  public run = async (taskParams: TaskParams) => {
    // @task_logic Add task logic
    console.log("Init Task: Certificate Processor ");

    console.log("Get all items on Certificate Queue [new and re-issue status]")
    const select = ["New", "Re-issue"];

    let respQueueToProcess: any = await certificateQueueService.
      findBy({
        query: QueryValues.ALL, where: [{ field: 'status', value: { $in: select } }]
      });

    if (respQueueToProcess.status === "error") return respQueueToProcess;

    if (respQueueToProcess.certificateQueue.length != 0) {
      console.log("Request for " + respQueueToProcess.certificateQueue.length + " certificates.");

      for await (const element of respQueueToProcess.certificateQueue) {
        console.log('.............................');
        console.log(element._id);
        console.log(`Liberado por: ${element.auxiliar.profile.first_name} ${element.auxiliar.profile.last_name}.`)

        // 1. Send request to process Certificate on HdC service.
        let respSetCertificate: any = await certificateService.setCertificate({
          certificateQueueId: element._id,
          courseId: element.courseId,
          userId: element.userId._id,
          auxiliarId: element.auxiliar._id
        });

        if (respSetCertificate.status === "error") {
          console.log("¡Error al generar certificado!");
          console.log(respSetCertificate);
        }
        else {
          console.log("----------- END Process Set Certificate --------------------");
          console.log("Certificate generation successful!");
          respSetCertificate.respProcessSetCertificates.forEach(element => {
            console.log("..................");
            console.log(element.certificateQueue);
          });
          console.log("---------------------- -----------");
          console.log('Envío de notificación a Estudiante:');
          console.log("---------------------- -----------");

          const notificationResponse = await notificationEventService.sendNotificationParticipantCertificated({
            participantId: element.userId._id,
            courseSchedulingId: element.courseId
          });
          console.log(notificationResponse);


          console.log('Envío de notificación a Auxiliar:');
          const notificationResponseAuxiliar = await notificationEventService.sendNotificationParticipantCertificated({
            participantId: element.auxiliar._id,
            courseSchedulingId: element.courseId
          });
          console.log(notificationResponseAuxiliar);
          console.log("---------------------- ----------- ----------- ----------- --------------------");
        }

      }

    }
    else {
      console.log("There're no certificates to request.");
    }

    // @end
    return true; // Always return true | false
  }

  // @add_more_methods
  // @end
}

export const certificateProcessorProgram = new CertificateProcessorProgram();
export { CertificateProcessorProgram };
