// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import_models Import models
// @end

// @import_services Import services
import {reportsFactoryService} from '@scnode_app/services/default/data/reports/reportsFactoryService'
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

// @import_types Import types
// @end

class ReportsFactoryController {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = (req: Request, res: Response) => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
	 * Metodo que permite generar reporte
	 * @param req Objeto de clase Express
	 * @param res Objeto de clase Express
	 * @returns
	 */
	public factoryGenerateReport = async (req: Request, res: Response) => {
		const response = await reportsFactoryService.factoryGenerateReport(req.getParameters.all())
		return responseUtility.sendResponseFromObject(res, response)
	}
}

export const reportsFactoryController = new ReportsFactoryController();
export { ReportsFactoryController as DefaultDataReportsReportsFactoryController };
