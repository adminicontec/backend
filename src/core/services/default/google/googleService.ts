// @import_dependencies_node Import libraries
// @end

// @import_utilities Import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

class GoogleService {

  /**
   * Construye la estructura de configuración Google
   * @param google_config Objeto de configuraciones Google
   * @returns
   */
   public buildGoogleConfig = (google_config: any) => {

    let google_config_aux = [];

    for (const key in google_config) {
      if (google_config.hasOwnProperty(key)) {
        const element = google_config[key];
        google_config_aux.push(element);
      }
    }
    return google_config_aux;
  }

  /**
   * Metodo que permite encontrar una configuración valida de Google a partir de una clave
   * @param google_config Objeto de configuraciones Google
   * @param fields_in_config Variables que deben estar presentes en la configuración
   * @param config_key Clave de configuración
   * @returns
   */
   public findGoogleConfig = async (google_config: Array<any>, fields_in_config: any, config_key: string | null) => {

    let config: any = {};

    if (config_key && config_key !== "") {
      google_config.map((values) => {
        if (values.key === config_key) {
          config = values;
        }
      })
    } else {
      if (google_config.length > 0) {
        config = google_config[0];
      }
    }

    const validation: any = await this.checkFieldsRequired(config, fields_in_config);
    if (validation.status === "error") return validation;

    return responseUtility.buildResponseSuccess('json',null,{additional_parameters: {config: config}});
  }

  /**
   * Metodo que verifica si los campos requeridos estan presentes en la configuración Amazon
   * @param fields_request Configuración
   * @param fields_config Variables que deben estar presentes en la configuración
   * @returns
   */
  private checkFieldsRequired = async (fields_request: any, fields_config: any) => {
    const validation = await requestUtility.validator(fields_request,{},fields_config);
    if (validation.hasError === true) return responseUtility.buildResponseFailed('json',null,{error_key: "google.config_invalid"});
    return responseUtility.buildResponseSuccess('json',null);
  }
}

export const googleService = new GoogleService();
export { GoogleService as DefaultGoogleGoogleService };
