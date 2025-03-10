// @import_services Import Services
import { DefaultPluginsTaskTaskService } from "@scnode_core/services/default/plugins/tasks/taskService";
// @end

// @import_models Import models
// @end

// @import_utilitites Import utilities
// @end

// @import types
import {TaskParams} from '@scnode_core/types/default/task/taskTypes'
import { enrollmentValidityService } from "@scnode_app/services/default/admin/enrollment/enrollmentValidityService";
// @end

class FreeCoursesProgram extends DefaultPluginsTaskTaskService {

  /**
   * Metodo que contiene la logica de la tarea
   * @return Booleano que identifica si se pudo o no ejecutar la tarea
   */
  public run = async (taskParams: TaskParams) => {
    // @task_logic Add task logic
    await enrollmentValidityService.verifyStudentsValidity()
    // @end
    return true; // Always return true | false
  }
}

export const freeCoursesProgram = new FreeCoursesProgram();
export { FreeCoursesProgram };
