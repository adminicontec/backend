// @import_dependencies_node Import libraries
// @end


// @import_utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { httpClientUtility, HttpStructure } from "@scnode_core/utilities/httpClientUtility";
// @end

// @import_services
// @end

// @import_config_files
import { main_external_api, external_api } from "@scnode_core/config/globals";
// @end

// @import_types
import {HttpCustomStructure} from '@scnode_core/types/default/query/httpTypes'
// @end


class QueryUtility {

  private _main_external_api: any = null;

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite enviar peticiones a un servidor externo
   * @param config Configuración personalizada de la petición
   * @returns
   */
  public query = async (config: HttpCustomStructure) => {

    if (!config) {
      return responseUtility.buildResponseFailed('json', null, {error_key: "query.invalid_connection_settings"});
    }

    if (config.api) {
      this._main_external_api = this.getApi(config.api);
    } else if(config.api_link){
      this._main_external_api = config.api_link
    }else if (main_external_api) {
      this._main_external_api = this.getApi(main_external_api);
    } else {
      this._main_external_api = null;
    }

    if (this._main_external_api) {
      let options: HttpStructure = {
        api    : this._main_external_api,
        url    : config.url,
        params : (config.params) ? config.params  : {},
        querystringParams: (config.querystringParams) ? config.querystringParams  : {},
        headers: (config.headers) ? config.headers: {},
        req    : (config.req) ? config.req        : {},
        sendBy : (config.sendBy) ? config.sendBy  : null,
        responseBuffer: (config.responseBuffer) ? config.responseBuffer : null
      }

      return await httpClientUtility[config.method](options);
    } else {
        return responseUtility.buildResponseFailed('json', null, {error_key: "query.connection_to_server_not_found"});
    }
  }

  /**
   * Metodo que obtiene la dirección de una conexion externa
   * @param api Clave del api a conectar
   * @returns
   */
  private getApi(api: string) {

    let _api: any = null;
    if (external_api.hasOwnProperty(api) && external_api[api].hasOwnProperty('url') && external_api[api]['url'] !== "") _api = external_api[api]['url'];

    return _api;
  }
}

export const queryUtility = new QueryUtility();
export { QueryUtility }
