// @import_services Import Services
import { DefaultPluginsTaskTaskService } from "@scnode_core/services/default/plugins/tasks/taskService";
import { certificateQueueService } from "@scnode_app/services/default/admin/certificateQueue/certificateQueueService";
import { certificateService } from "@scnode_app/services/default/huellaDeConfianza/certificate/certificateService"
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
    let queuePreview = [];

    console.log("Init Task: Certificate Processor ");

    console.log("Get all items on Certificate Queue [new and re-issue status]")
    const select = ["New", "Re-issue"];
    // QueueStatus.COMPLETE.toString()
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

        // 1. Send request to process Certificate on HdC service.
        let respSetCertificate: any = await certificateService.setCertificate({
          certificateQueueId: element._id,
          courseId: element.courseId,
          userId: element.userId
        });

        if (respSetCertificate.status === "error") {
          console.log("¡Error al generar certificado!");
          console.log(respSetCertificate);
        }

        console.log("¡Certificado generado con éxito!");
        // console.log(respSetCertificate);
        // console.log(respSetCertificate.responseHC.certificado);

        queuePreview.push({
          certificate_queue: element._id.toString(),
          hash: respSetCertificate.responseHC.certificado,
          format: 2,
          template: 1,
          updateCertificate: true,
        });
      };

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
