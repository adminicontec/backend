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
import { ICertificatePreview } from '@scnode_app/types/default/admin/certificate/certificateTypes'
// @end

class CertificatePreviewProcessorProgram extends DefaultPluginsTaskTaskService {

  /**
   * Metodo que contiene la logica de la tarea
   * @return Booleano que identifica si se pudo o no ejecutar la tarea
   */
  public run = async (taskParams: TaskParams) => {
    // @task_logic Add task logic
    console.log("Init Task: Certificate Preview Processor ");
    console.log("Get all generated certificate to process a preview")

    const select = ["Requested"];
    // QueueStatus.Requested.toString()
    let respQueueToPreview: any = await certificateQueueService.
      findBy({
        query: QueryValues.ALL, where: [{ field: 'status', value: { $in: select } }]
      });

    if (respQueueToPreview.certificateQueue.length != 0) {
      console.log("[" + respQueueToPreview.certificateQueue.length + "] Certificate(s) to preview. " );

      for await (const docPreview of respQueueToPreview.certificateQueue) {
        let queuePreview: ICertificatePreview;
        queuePreview = {
          certificate_queue: docPreview._id.toString(),
          hash: docPreview.certificate.hash,
          format: 2,
          template: 1,
          updateCertificate: true,
        };

        // Get preview of recent certificate
        let restPreviewCertificate: any = await certificateService.previewCertificate(queuePreview);
        console.log("\n\rResponse preview: ");
        console.log(restPreviewCertificate);
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
