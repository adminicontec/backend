// @import_dependencies_node Import libraries
import * as path from "path";
// @end

// @import_utilities Import utilities
import { generalUtility } from "@scnode_core/utilities/generalUtility";
import { i18nUtility } from '@scnode_core/utilities/i18nUtility';
import { requestUtility } from '@scnode_core/utilities/requestUtility';
import { responseUtility } from "@scnode_core/utilities/responseUtility";
// @end

// @import_config_files Import config files
import { attached } from "@scnode_core/config/globals";
// @end

// @import types Import types
import {FileFormat, UploadConfig, AttachedDriver} from "@scnode_core/types/default/attached/attachedTypes"
// @end

// Dirección URL del plugin utilizado - https://github.com/richardgirges/express-fileupload
class AttachedUtility {

  private config;  // Variable donde se almacena la configuración de la herramienta
  private _driver; // Metodo de ejecución de la herramienta

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {
    // Inicializar la variable de configuración con valores por defecto
    this.config  = {
      rename        : true,
      file_size     : null,
      file_mime_type: null,
    };

    this._driver = null;
  }

  public setDriver(driver: AttachedDriver) {
    this._driver = driver;
  }

  public getDriver() {
    return this._driver;
  }

  /**
   * Metodo que permite cargar archivos al servidor
   * @param files Objetos de clase ExpressFileupload que contiene los archivos a cargar
   * @param upload_config Objeto de clase UploadConfig que posee todas las opciones y configuraciones de los archivos a cargar
   * @returns [array] Array con el estado de carga de los archivos procesados
   */

  public uploadFiles = async (files, upload_config: UploadConfig) => {

    if (upload_config.hasOwnProperty('driver') && upload_config['driver'] !== null) {
      this._driver = upload_config['driver'];
    } else {
      if (!attached.hasOwnProperty('driver')) {
        return responseUtility.buildResponseFailed('json',null,{error_key: "attached.driver_required"});
      }
      this._driver = attached['driver'];
    }
    if (!attached.hasOwnProperty(this.getDriver())) {
      return responseUtility.buildResponseFailed('json',null,{error_key: "attached.configuration_invalid"});
    }

    const utility_response = requestUtility.utilityInstance(`attached-${this.getDriver()}`,'attached/');

    if (utility_response.status === 'error') return responseUtility.buildResponseFailed('json',null,{error_key: "attached.driver_invalid"});
    const attached_utility = utility_response['utility'];

    this.config = attached_utility['buildUploadConfig']();
    let user_config = attached[this.getDriver()];
    Object.assign(this.config,user_config);
    Object.assign(this.config,upload_config);

    const validation: any = await attached_utility['checkFieldsRequired'](this.config);
    if (validation.status === "error") return validation;

    let files_to_upload = [];
    let files_status_upload = [];

    if (Array.isArray(files) == false) { // One file to upload
      files_to_upload.push(files);
    } else { // Multiple files to upload
      files_to_upload = files;
    }

    console.log('files_to_upload', files_to_upload)

    for (let i = 0 ; i < files_to_upload.length; i++) {
      const file = files_to_upload[i];
      let file_name = file.name;

      files_status_upload[i] = {
        status       : 'error',
        original_name: file_name,
        new_name     : null,
        path         : null,
        reason       : i18nUtility.i18nMessage("error_messages.fail_request_message"),
      };

      // @INFO: Renombrar el archivo a cargar
      if (this.config.rename === true) {
        file_name = this.rename(file);
      }

      // @INFO: Validar el tamaño del archivo que se esta cargando
      if (this.config.file_size && Number.isInteger(this.config.file_size)) {
        if (this.validateSizeAttached(file,this.config.file_size) === false) {
          const file_size_formated = generalUtility.byteCalculator(this.config.file_size);
          files_status_upload[i].reason = i18nUtility.i18nMessage("error_messages.upload_files.file_size_invalid",{file_size: file_size_formated});
          continue;
        }
      }

      // @INFO: Validar el tipo de archivo que se esta cargando
      if (this.config.file_mime_type && this.config.file_mime_type.length > 0) {
        if (this.validateMimeTypeAttached(file,this.config.file_mime_type) === false) {
          files_status_upload[i].reason = i18nUtility.i18nMessage("error_messages.upload_files.file_mime_type_invalid",{file_mime_type: this.config.file_mime_type});
          continue;
        }
      }

      const upload = await attached_utility['upload'](file,file_name,this.config);
      console.log('upload', upload)
      if (upload.status === 'error') {
        files_status_upload[i].reason = upload['reason'];
        continue;
      }

      files_status_upload[i].status   = 'success';
      files_status_upload[i].path     = upload['path'];
      files_status_upload[i].new_name = upload['file_name'];
      files_status_upload[i].reason   = null;
    }

    return files_status_upload;
  }

  /**
   * Metodo que permite validar si el tamaño de un adjunto es valido
   * @param file Objetos de clase ExpressFileupload que contiene los archivos a cargar
   * @param size_required Tamaño maximo que puede tener un archivo. Su valor se representa en byte(B)
   * @returns [booleano] Boleano (true | false)
   */
  private validateSizeAttached = (file: FileFormat, size_required: number) => {
    if (file && file.size) {
      if (file.size > size_required) {
        return false;
      }
    }

    return true;
  }

  /**
   * Metodo que permite validar si el tamaño de un adjunto es valido
   * @param file Objetos de clase ExpressFileupload que contiene los archivos a cargar
   * @param mime_type_required Formato (MIME) del archivo a cargar
   * @returns [booleano] Boleano (true | false)
   */
  private validateMimeTypeAttached = (file: FileFormat, mime_type_required: Array<string>) => {
    if (file && file.mimetype) {
      if (mime_type_required.indexOf(file.mimetype) === -1) {
        return false;
      }
    }
    return true;
  }

  /**
   * Metodo que permite renombrar el archivo a cargar
   * @param file Objetos de clase ExpressFileupload que contiene los archivos a cargar
   * @returns
   */
  private rename = (file: FileFormat) => {
    const new_name = generalUtility.buildRandomChain();
    const ext = path.extname(file.name);
    return new_name + ext;
  }
}

export const attachedUtility = new AttachedUtility();
export { AttachedUtility }
