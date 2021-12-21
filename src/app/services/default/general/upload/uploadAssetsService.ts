// @import_dependencies_node Import libraries
// @end

// @import services
import { uploadService } from '@scnode_core/services/default/global/uploadService'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
// @end

// @import types
import {IAddAssets} from '@scnode_app/types/default/general/upload/uploadAssetsTypes'
// @end

class UploadAssetsService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite agregar un asset
   * @param params Elementos a registrar
   * @returns
   */
  public addAssets = async (params: IAddAssets) => {

    try {
      // @INFO: Almacenando en servidor la imagen adjunta
      if (!params.asset) return responseUtility.buildResponseFailed('json')

      const defaulPath = (params.path) ? params.path : ''
      let config = {
        rename: true
      }

      if (params.rename === '-1') config.rename = false

      const response_upload: any = await uploadService.uploadFile(
        params.asset,
        defaulPath,
        {...config}
      )

      if (response_upload.status === 'error') return response_upload

      return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
        path: defaulPath,

        ...response_upload
      }})
    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

}

export const uploadAssetsService = new UploadAssetsService();
export { UploadAssetsService as DefaultGeneralUploadUploadAssetsService };
