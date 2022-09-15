// @import_services Import Services
import { DefaultPluginsTaskTaskService } from "@scnode_core/services/default/plugins/tasks/taskService";
import { courseSchedulingInformationService } from "@scnode_app/services/default/admin/course/courseSchedulingInformationService";
// @end

// @import_models Import models
// @end

// @import_utilitites Import utilities
// @end

// @import types
import {TaskParams} from '@scnode_core/types/default/task/taskTypes'
// @end

interface ITaskCustom {
  courseSchedulings?: string
}

class SchedulingInformationProgram extends DefaultPluginsTaskTaskService {

  /**
   * Metodo que contiene la logica de la tarea
   * @return Booleano que identifica si se pudo o no ejecutar la tarea
   */
  public run = async (taskParams: TaskParams & ITaskCustom) => {
    // @task_logic Add task logic
    await courseSchedulingInformationService.processInformation({
      courseSchedulings: taskParams.courseSchedulings
    });
    // @end

    return true; // Always return true | false
  }

  // @add_more_methods
  // @end
}

export const schedulingInformationProgram = new SchedulingInformationProgram();
export { SchedulingInformationProgram };
