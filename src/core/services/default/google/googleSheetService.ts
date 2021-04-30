// @import_dependencies_node Import libraries
import {GoogleSpreadsheet} from 'google-spreadsheet'
// @end

// @import_utilities Import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import_services Import services
import { DefaultGoogleGoogleService } from "@scnode_core/services/default/google/googleService";
// @end

// @import_config_files
import { google_config } from "@scnode_core/config/globals";
// @end

// @import types
import {IGoogleSheet} from '@scnode_core/types/default/google/googleSheetTypes'
// @end

class GoogleSheetService extends DefaultGoogleGoogleService {
  constructor () {
    super();
  }

  /**
   * Metodo que permite generar una instancia de GoogleSheet segun la configuración
   * @param params Parametros necesarios para la instancia
   * @returns
   */
   public instance = async (params: IGoogleSheet) => {

    if (!google_config.hasOwnProperty('SHEET')) return responseUtility.buildResponseFailed('json',null,{error_key: "google.sheet.config_invalid"});

    const google_config_sheet = google_config['SHEET'];

    const fields_in_config = [
      {key: "project_id"},
      {key: "private_key_id"},
      {key: "private_key"},
      {key: "client_email"},
      {key: "client_id"},
    ];

    const google_config_arr = this.buildGoogleConfig(google_config_sheet);

    const validation = await this.findGoogleConfig(google_config_arr,fields_in_config,params.credentials);
    if (validation.status === "error") return validation;

    const config = validation['config'];

    try {
      const document: GoogleSpreadsheet = new GoogleSpreadsheet(params.google_sheet_id)
      await document.useServiceAccountAuth(config)
      await document.loadInfo()

      return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
        document
      }})

    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }
}

export const googleSheetService = new GoogleSheetService();
export { GoogleSheetService as DefaultGoogleGoogleSheetService };
