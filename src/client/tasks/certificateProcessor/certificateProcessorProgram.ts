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
    // @end
    console.log("Init Task: Certificate Processor ");

    console.log("Get all items on Certificate Queue [new and re-issue status]")
    const select = ["New", "Re-issue"];
    // QueueStatus.COMPLETE.toString()
    let respQueueToProcess: any = await certificateQueueService.
      findBy({
        query: QueryValues.ALL, where: [{ field: 'status', value: { $in: select } }]
      });

    if (respQueueToProcess.status === "error") return respQueueToProcess;

    console.log("Request for " + respQueueToProcess.certificateQueue.count + " certificates.");


    for await (const element of respQueueToProcess.certificateQueue) {
      console.log('.............................');
      console.log(element._id);

      let respSetCertificate: any = await certificateService.setCertificate({
        certificateQueueId: element._id,
        courseId: element.courseId,
        userId: element.userId
      });
      console.log(respSetCertificate);
    };


    return true; // Always return true | false
  }

  // @add_more_methods
  // @end
}

export const certificateProcessorProgram = new CertificateProcessorProgram();
export { CertificateProcessorProgram };
