// @import_dependencies_node Import libraries
import path from "path";
// @end

// @import_utilities Import utilities
import { fileUtility } from "@scnode_core/utilities/fileUtility";
import { i18nUtility } from '@scnode_core/utilities/i18nUtility';
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from '@scnode_core/utilities/requestUtility';
import { ftpUtility } from '@scnode_core/utilities/ftpUtility'
// @end

// @import_config_files Import config files
import { public_dir } from "@scnode_core/config/globals";
// @end

// @import types
import {UploadConfig, AttachedFtpConfig} from "@scnode_core/types/default/attached/attachedTypes"
import {FtpStructureConfig} from '@scnode_core/types/default/ftp/ftpTypes';
// @end

// @import_config_files Import config files
// import { uploads_dir_absolute } from "@scnode_core/config/globals";
// @end

class AttachedFtpUtility {

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
    const config: AttachedFtpConfig = {};
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

    // @INFO: Cargando el archivo localmente
    const upload_config_base_path = 'uploads/ftp_temp'
    const base_path = path.resolve(`./${public_dir}/${upload_config_base_path}`)
    const path_upload = (upload_config.path_upload && upload_config.path_upload !== "") ? upload_config.path_upload + "/" : "";

    const full_local_path = `${base_path}/${file_name}`;

    // Creando la estructura de carpetas necesaria para cargar el archivo
    await fileUtility.createDirRecursive(full_local_path);

    // Moviendo archivo a destino
    await file.mv(full_local_path);

    // Validar si el archivo fue creado localmente
    const movedFile = fileUtility.fileExists(full_local_path);
    if (movedFile === false) {
      return responseUtility.buildResponseFailed('json',null,{additional_parameters: {
        reason: i18nUtility.i18nMessage("error_messages.upload_files.upload_file_failed")
      }})
    }

    // @INFO: Mover archivo local a servidor FTP

    let ftp_upload_config: FtpStructureConfig = {
      file_information: {
        local_path: full_local_path,
        remote_file_name: file_name
      }
    }

    if (upload_config.base_path && upload_config.base_path !== "") {
      ftp_upload_config.base_path = upload_config.base_path;
    }

    if (path_upload !== "") {
      ftp_upload_config.file_dir_path = path_upload;
    }

    const response_ftp = await ftpUtility.uploadFrom(
      ftp_upload_config,
      upload_config.credentials
    );

    fileUtility.removeFileSync(full_local_path);

    if (response_ftp.status === 'error') {
      return responseUtility.buildResponseFailed('json', null, {
        additional_parameters: {
          reason: i18nUtility.i18nMessage("error_messages.upload_files.upload_file_failed")
        }
      })
    }
    return response_ftp;
  }
}

export const attachedFtpUtility = new AttachedFtpUtility();
export { AttachedFtpUtility }
