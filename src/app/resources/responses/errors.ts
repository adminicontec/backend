// @import_config_files Import config files
import { i18nUtility } from "@scnode_core/utilities/i18nUtility";
// @end
class ErrorResponse {

  constructor() {}

  /**
   * Metodo que permite construir un objeto en formato JSON que contiene la estructura de mensajes
   * @returns [json] Objeto en formato JSON
   */
  buildJson() {
    const json = {
      // Add errors
    };

    return json;
  }
}

export default new ErrorResponse().buildJson;
