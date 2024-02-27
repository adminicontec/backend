// @import_services Import Services
import { DefaultPluginsTaskTaskService } from "@scnode_core/services/default/plugins/tasks/taskService";
import { certificateService } from "@scnode_app/services/default/huellaDeConfianza/certificate/certificateService";
// @end

// @import_models Import models
// @end

// @import_utilitites Import utilities
// @end

// @import types
import { TaskParams } from '@scnode_core/types/default/task/taskTypes'
// @end

class CertificateReleaseProgram extends DefaultPluginsTaskTaskService {

  /**
   * Metodo que contiene la logica de la tarea
   * @return Booleano que identifica si se pudo o no ejecutar la tarea
   */
  public run = async (taskParams: TaskParams) => {
    // @task_logic Add task logic

    // console.log("Init Task: Automatic Certificate Release Processor ");

    // let respQueueToProcess: any = await certificateService.automaticRelease(
    //   {
    //     without_certification: true
    //   });

    // console.log(respQueueToProcess);

    // @end

    return true; // Always return true | false
  }

  // @add_more_methods
  // @end
}

export const certificateReleaseProgram = new CertificateReleaseProgram();
export { CertificateReleaseProgram };
