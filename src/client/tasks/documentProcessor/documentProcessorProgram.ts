// @import config
import { customs } from '@scnode_core/config/globals'
// @end

// @import_dependencies_node Import libraries
import path from "path";
import { host, public_dir, attached } from "@scnode_core/config/globals";
// @end

// @import_services Import Services
import { DefaultPluginsTaskTaskService } from "@scnode_core/services/default/plugins/tasks/taskService";
import { teacherService } from '@scnode_app/services/default/admin/teacher/teacherService'
import { documentQueueService } from '@scnode_app/services/default/admin/documentQueue/documentQueueService';

// @end

// @import_models Import models
// @end

// @import_utilitites Import utilities
import { fileUtility } from "@scnode_core/utilities/fileUtility";
// @end

// @import types
import { TaskParams } from '@scnode_core/types/default/task/taskTypes'
import { QueryValues } from '@scnode_app/types/default/global/queryTypes'
import { FileType } from 'basic-ftp';
// @end

class DocumentProcessorProgram extends DefaultPluginsTaskTaskService {

  private default_document_path = 'documents/qualified';

  /**
   * Metodo que contiene la logica de la tarea
   * @return Booleano que identifica si se pudo o no ejecutar la tarea
   */
  public run = async (taskParams: TaskParams) => {
    // @task_logic Add task logic
    const select = ["New"];

    console.log("------------ Init Task: Document Processor ------------ ");

    const respDocumentQueue: any = await documentQueueService
      .findBy({
        query: QueryValues.ALL, where: [{ field: 'status', value: { $in: select } }]
      });

    if (respDocumentQueue.documentQueue[0]) {
      console.log(respDocumentQueue.documentQueue);

      console.log("Type of Document: " + respDocumentQueue.documentQueue[0].type);

      //#region *** Path to open the file ***
      let driver = attached['driver'];
      let attached_config = attached[driver];
      const upload_config_base_path = (attached_config.base_path) ? attached_config.base_path : 'uploads'

      let base_path = path.resolve(`./${public_dir}/${upload_config_base_path}`)
      if (attached_config.base_path_type === "absolute") {
        base_path = upload_config_base_path
      }
      //#endregion

      //console.log(base_path);
      let docPath = respDocumentQueue.documentQueue[0].docPath;
      let filePath = `${base_path}/${docPath}`

      if (filePath && fileUtility.fileExists(filePath) === true) {
        console.log('File Exists!');
        const contentFile = fileUtility.readFileSyncBuffer(filePath);

        if (contentFile && contentFile.length > 0) {
          let params: any = {
            recordToProcess: respDocumentQueue.documentQueue[0],
            contentFile: { name: 'excel', data: contentFile }
          };

          const response = await teacherService.processFile(params);
          console.log(response);
        }
        else {
          console.log("There's no content to process");
        }
      }
      else {
        console.log("File not found");
      }


      // @add_more_methods
      // @end
    }
    else {
      console.log("There's no records to process");
    }

    // @end
    return true; // Always return true | false
  }

}
export const documentProcessorProgram = new DocumentProcessorProgram();
export { DocumentProcessorProgram };
