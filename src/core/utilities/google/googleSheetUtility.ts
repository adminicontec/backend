// @import_dependencies_node Import libraries
// @end

// @import_utilities Import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @imprt services Import services
import {googleSheetService} from "@scnode_core/services/default/google/googleSheetService"
// @end

// @import_config_files Import config files
import { google_services } from "@scnode_core/config/globals";
// @end

// @import types
import {IGoogleSheet, IGoogleSheetLoad} from '@scnode_core/types/default/google/googleSheetTypes'
// @end

// @INFO: Plugin utilizado: https://www.npmjs.com/package/google-spreadsheet

class GoogleSheetUtility {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite generar una instancia de GoogleSheet
   * @param params Parametros necesarios para generar la instancia de GoogleSheet
   * @returns
   */
  private generateInstance = async (params: IGoogleSheet) => {

    // @INFO: Validando que exista una configuración para hojas de calculo en el env.json
    if (!google_services.hasOwnProperty('sheet')) return responseUtility.buildResponseFailed('json', null, {error_key: 'google.sheet.config_invalid'})

    // @INFO: Construyendo la configuración por defecto
    let config: IGoogleSheet = {
      google_sheet_id: params.google_sheet_id
    }

    let user_config = google_services['sheet'];
    Object.assign(config,user_config);
    Object.assign(config,params);

    // @INFO: Validando parametros requeridos para continuar
    if (!config.credentials) return responseUtility.buildResponseFailed('json', null, {error_key: 'google.sheet.config_invalid'})
    if (!config.google_sheet_id) return responseUtility.buildResponseFailed('json', null, {error_key: 'google.sheet.config_invalid'})

    return await googleSheetService.instance(config)
  }

  /**
   * Metodo que permite abrir un documento de GoogleSheet y habilitar su uso
   * @param params Parametros necesarios para abrir el documento
   * @returns
   */
  public loadGoogleSheet = async (params: IGoogleSheetLoad) => {

    // @INFO: Generación de instancia de GoogleSheet
    return await this.generateInstance(params)
  }
}

export const googleSheetUtility = new GoogleSheetUtility();
export { GoogleSheetUtility }
