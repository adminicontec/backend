// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import_models Import models
// @end

// @import_services Import services
import {landingDataService} from '@scnode_app/services/default/data/landing/landingDataService'
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

// @import_types Import types
// @end

class LandingDataController {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = (req: Request, res: Response) => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
	 * Metodo que permite consultar información de un landing
	 * @param req Objeto de clase Express
	 * @param res Objeto de clase Express
	 * @returns
	 */
	public fetchLandingData = async (req: Request, res: Response) => {
    let params = req.getParameters.all()
		const response = await landingDataService.fetchLandingData(params)
		return responseUtility.sendResponseFromObject(res, response)
  }

}

export const landingDataController = new LandingDataController();
export { LandingDataController as DefaultDataLandingLandingDataController };
