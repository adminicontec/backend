// @import_dependencies_node Import libraries
// @end

// @import_utilities
import { i18nUtility } from '@scnode_core/utilities/i18nUtility';
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from '@scnode_core/utilities/requestUtility';
// @end

// @import_services
import { s3AwsService } from "@scnode_core/services/default/aws/s3AwsService";
// @end

// @import types
import {UploadConfig, AttachedS3Config} from "@scnode_core/types/default/attached/attachedTypes"
// @end

class AttachedS3Utility {

  private s3; // Instancia de amazon S3

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {
    this.s3 = null;
  }

  /**
   * Metodo que permite inicializar la variable de configuración
   * @returns
   */
  public buildUploadConfig = () => {
    const config: AttachedS3Config = {};
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
   * Metodo que permite generar una instancia de Amazon S3 segun la configuración
   * @param upload_config Objeto de clase UploadConfig que posee todas las opciones y configuraciones de los archivos a cargar
   * @returns
   */
  private instance = async (upload_config: UploadConfig) => {

    if (this.s3) return;

    const instance = await s3AwsService.instance(upload_config.credentials);
    if (instance.status === 'success') this.s3 = instance['s3'];
  }

  /**
   * Metodo que permite cargar un archivo
   * @param file Archivo a cargar
   * @param file_name Nombre que se asignara al archivo
   * @param upload_config Objeto de clase UploadConfig que posee todas las opciones y configuraciones de los archivos a cargar
   * @returns
   */
  public upload = async (file, file_name, upload_config: UploadConfig) => {

    await this.instance(upload_config);

    if (this.s3) {

      const path_upload    = (upload_config.path_upload && upload_config.path_upload !== "") ? upload_config.path_upload + "/" : "";
      const full_path_file = `${path_upload}${file_name}`;

      const s3Client = this.s3.s3Client;
      const params   = this.s3.uploadParams;

      params.Key         = full_path_file;
      params.Body        = file.data;
      params.ContentType = file.mimetype;
      params.ACL         = 'public-read';

      try {
        const s3_upload = await s3Client.upload(params).promise();
        return responseUtility.buildResponseSuccess('json',null,{additional_parameters: {
          path     : s3_upload.Location,
          file_name: file_name,
        }});
      } catch (err) {
        return responseUtility.buildResponseFailed('json',null,{additional_parameters: {
          reason: err,
        }})
      }
    } else {
      return responseUtility.buildResponseFailed('json',null,{additional_parameters: {
        reason: i18nUtility.i18nMessage("error_messages.attached.configuration_invalid"),
      }})
    }
  }
}

export const attachedS3Utility = new AttachedS3Utility();
export { AttachedS3Utility }
