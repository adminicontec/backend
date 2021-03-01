// @import_dependencies_node Import libraries
// @end

// @import_models Import models
// @end

// @import_utilities Import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import types
import {TaskParams} from '@scnode_core/types/default/task/taskTypes'
// @end

class TaskService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  // TODO: Completar funcionalidad de tareas: Debe almacenar un registro de consumo de tarea

  /**
   * Metodo que permite iniciar la ejecución de una tarea
   * @param task_class Nombre de la tarea a ejecutar (Ex: demoProgram)
   * @param [config] Configuraciones de la tarea a ejecutar
   * @returns
   */
  public main = async (task_class:string, taskParams: TaskParams = {}) => {
    const task = await this.run(taskParams);
    if (task === true) {
      await this.afterRunning(task_class);
      return responseUtility.buildResponseSuccess('json',null,{success_key: "task.executed_successfully"});
    } else {
      return responseUtility.buildResponseSuccess('json',null,{success_key: "task.executed_warning"});
    }
  }

  /**
   * Metodo principal de ejecución. Se sobreescribe por cada tarea que lo ejecuta
   * @returns
   */
  public run = async (taskParams: TaskParams = {}) => {
    return true;
  }

  /**
   * Metodo que contiene las acciones que se ejecutan despues de lanzar una tarea
   * @param task_class Nombre de la tarea ejecutada
   */
  private afterRunning = async (task_class: string) => {
  }
}

export const taskService = new TaskService();
export { TaskService as DefaultPluginsTaskTaskService };
