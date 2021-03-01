// @import_dependencies_node Import libraries
import * as fs from 'fs';
// @end

// @import_models Import models
// @end

// @import_utilities Import utilities
import {fileUtility} from '@scnode_core/utilities/fileUtility'
import {consoleUtility} from '@scnode_core/utilities/consoleUtility'
import {generalUtility} from '@scnode_core/utilities/generalUtility'
// @end

// @import types
import {TaskParams} from '@scnode_core/types/default/task/taskTypes'
// @end

class RunTaskService {
  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite iniciar la ejecución de una tarea
   * @param params Parametros de ejecución de la tarea
   * @returns
   */
  public init = async (params: TaskParams) => {
    try {

      const path_app = '/src/client/tasks'
      const item_directory = `${process.cwd()}${path_app}` // Directorio donde se alojara el elemento

      // @INFO: Validar que venga el nombre de la tarea a ejecutar
      if (!params['task']) {
        console.log('------------------------------------------------------');
        consoleUtility.showErrorConsole(`Se debe proporcionar la tarea a ejecutar`);
        console.log('------------------------------------------------------');
        process.exit(1)
      }

      // @INFO: Buscando tarea solicitada
      const taskNameFormated = generalUtility.upperCaseString(params['task'], true)
      const taskExists = await this.findTaskByName(item_directory, `${taskNameFormated}Program`, null)
      if (!taskExists) {
        console.log('------------------------------------------------------');
        consoleUtility.showErrorConsole(`No existe ninguna tarea que coincida con ${params['task']}`);
        console.log('------------------------------------------------------');
        process.exit(1)
      }

      const response_task = await taskExists.main(taskNameFormated, params);
      if (response_task['status'] === 'success') {
        console.log('------------------------------------------------------');
        consoleUtility.showSuccessConsole(`Tarea ${taskNameFormated}: ${response_task['message']}`);
        console.log('------------------------------------------------------');
      } else {
        console.log('------------------------------------------------------');
        consoleUtility.showErrorConsole(`Tarea ${taskNameFormated}: ${response_task['message']}`);
        console.log('------------------------------------------------------');
      }

      process.exit(0);

    } catch (e) {
      console.log('------------------------------------------------------');
      consoleUtility.showErrorConsole(`Se ha presentado un error al ejecutar el programa`);
      console.log(e.message)
      console.log('------------------------------------------------------');
      process.exit(1)
    }

  }

  /**
   * Metodo que permite encontrar una tarea por su nombre
   * @param task_dir Directorio donde se aloja la tarea
   * @param task_name Nombre de la tarea
   * @param [taskFound] Objeto con la tarea o null si aun no ha sido encontrada
   * @returns
   */
  private findTaskByName = async (task_dir: string, task_name: string, taskFound = null) => {

    if (!taskFound) {
      const filesInDirectory = await fileUtility.readDirSync(task_dir)
      if (filesInDirectory && filesInDirectory.length > 0) {
        for await (const file of filesInDirectory) {
          const origFilePath = `${task_dir}/${file}`;
          const stats = fs.statSync(origFilePath);

          if (stats.isFile()) {
            if (file.search("Program") !== -1) {
              let file_name = file.replace(/\.ts|\.js$/,'');
              if (file_name === task_name) {
                taskFound = require(`${task_dir}/${file}`)[file_name];
              }
            }
          } else if (stats.isDirectory()) {
            taskFound = await this.findTaskByName(`${task_dir}/${file}`, task_name, taskFound)
          }
        }
      }
    }
    return taskFound
  }
}

export const runTaskService = new RunTaskService();
export { RunTaskService as DefaultPluginsTaskRunTaskService };
