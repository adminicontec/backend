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

  public getPricesByProgram = async (req: Request, res: Response) => {
		const response = await erpService.getPricesByProgram(req.getParameters.all())
		return responseUtility.sendResponseFromObject(res, response)
	}

  public updateErpPrices = async (req: Request, res: Response) => {
    try {
      const params = req.getParameters.all();
      const result = await erpService.updateErpPrices(params);
      return responseUtility.sendResponseFromObject(res, 
        responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: result
        })
      );
    } catch (error) {
      return responseUtility.sendResponseFromObject(res,
        responseUtility.buildResponseFailed('json', null, {
          code: 500,
          message: 'Error actualizando precios ERP',
          additional_parameters: { error: error.message }
        })
      );
    }
  };

}

export const erpController = new ErpController();
export { ErpController as DefaultErpErpController };
