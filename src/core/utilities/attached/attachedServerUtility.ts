// @import_dependencies_node Import libraries
import path from "path";
// @end

// @import_utilities Import utilities
import { fileUtility } from "@scnode_core/utilities/fileUtility";
import { i18nUtility } from '@scnode_core/utilities/i18nUtility';
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from '@scnode_core/utilities/requestUtility';
// @end

// @import_config_files Import config files
import { host, public_dir } from "@scnode_core/config/globals";
// @end

// @import types
import {UploadConfig, AttachedServerConfig} from "@scnode_core/types/default/attached/attachedTypes"
// @end
class AttachedServerUtility {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () { }

  /**
   * Metodo que permite inicializar la variable de configuración
   * @returns
   */
  public buildUploadConfig = () => {
    const config: AttachedServerConfig = {};
    return config;
  }

  /**
   * Metodo que verifica si los campos requeridos estan presentes en la configuración
   * @param config Configuración
   * @returns
   */
  public checkFieldsRequired = async (config) => {
    let fields_config = [];

    const validation = await requestUtility.validator(config,{},fields_config);
    if (validation.hasError === true) return responseUtility.buildResponseFailed('json',null,{error_key: "attached.configuration_invalid"});

    return responseUtility.buildResponseSuccess('json',null);
  }

  /**
   * Metodo que permite cargar un archivo
   * @param file Archivo a cargar
   * @param file_name Nombre que se asignara al archivo
   * @param upload_config Objeto de clase UploadConfig que posee todas las opciones y configuraciones de los archivos a cargar
   * @returns
   */
  public upload = async (file, file_name, upload_config: UploadConfig) => {

    console.log('inUpload', file, file_name, upload_config)
    const upload_config_base_path = (upload_config.base_path) ? upload_config.base_path : 'uploads'
    let base_path = path.resolve(`./${public_dir}/${upload_config_base_path}`)
    if (upload_config.base_path_type === "absolute") {
      base_path = upload_config_base_path
    }
    // const base_path = path.resolve(`./${public_dir}/${upload_config_base_path}`)
    const path_upload = (upload_config.path_upload && upload_config.path_upload !== "") ? upload_config.path_upload + "/" : "";

    const full_path_file = `${base_path}/${path_upload}${file_name}`;
    const public_path_file = `${host}/${upload_config_base_path}/${path_upload}${file_name}`;

    // @INFO: Validar si el archivo ya existe
    const fileExists = fileUtility.fileExists(full_path_file);
    console.log('full_path_file', full_path_file)
    console.log('fileExists', fileExists)
    
    if (fileExists === true) {
      console.log('infileExists')
      return responseUtility.buildResponseFailed('json',null,{additional_parameters: {
        reason: i18nUtility.i18nMessage("error_messages.upload_files.file_upload_already_exist")
      }})
    }

    console.log('createDirRecursive',full_path_file)
    // Creando la estructura de carpetas necesaria para cargar el archivo
    await fileUtility.createDirRecursive(full_path_file);
    console.log('end createDirRecursive')
    console.log('Start Move file', full_path_file)
    // Moviendo archivo a destino
    await file.mv(full_path_file);
    console.log('End move')

    return responseUtility.buildResponseSuccess('json',null,{additional_parameters: {
      path     : encodeURI(public_path_file),
      file_name: file_name,
    }});
  }
}

export const attachedServerUtility = new AttachedServerUtility();
export { AttachedServerUtility }
