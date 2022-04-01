// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import_models Import models
// @end

// @import_services Import services
import {uploadAssetsService} from '@scnode_app/services/default/general/upload/uploadAssetsService'
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

// @import_types Import types
// @end

class UploadAssetsController {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = (req: Request, res: Response) => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  public addAssets = async (req: Request, res: Response) => {
    let params = req.getParameters.all()
    let files = req.files

    if (files && Object.prototype.hasOwnProperty.call(files, 'assetFile')) {
      params['asset'] = files['assetFile']
    } else {
      params['asset'] = null
    }

    const response = await uploadAssetsService.addAssets(params)
    return responseUtility.sendResponseFromObject(res, response)
  }
}

export const uploadAssetsController = new UploadAssetsController();
export { UploadAssetsController as DefaultGeneralUploadUploadAssetsController };
