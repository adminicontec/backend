// @import_services Import Services
import { DefaultPluginsTaskTaskService } from "@scnode_core/services/default/plugins/tasks/taskService";
// @end

// @import_models Import models
// @end

// @import_utilitites Import utilities
// @end

// @import types
import { TaskParams } from '@scnode_core/types/default/task/taskTypes'
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
    return true; // Always return true | false
  }

  // @add_more_methods
  // @end
}

export const certificateProcessorProgram = new CertificateProcessorProgram();
export { CertificateProcessorProgram };
