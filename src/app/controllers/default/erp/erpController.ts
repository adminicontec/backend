// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import_models Import models
// @end

// @import_services Import services
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
import { erpService } from '@scnode_app/services/default/erp/erpService';
// @end

// @import_types Import types
// @end

class ErpController {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = (req: Request, res: Response) => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  public getCertificatePriceFromCertificateQueue = async (req: Request, res: Response) => {
		const response = await erpService.getCertificatePriceFromCertificateQueue(req.getParameters.all())
		return responseUtility.sendResponseFromObject(res, response)
	}

}

export const erpController = new ErpController();
export { ErpController as DefaultErpErpController };
