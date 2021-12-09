// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import_models Import models
// @end

// @import_services Import services
import {certificateQueueService} from '@scnode_app/services/default/admin/certificateQueue/certificateQueueService'
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

// @import_types Import types
// @end

class CertificateQueueController {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = (req: Request, res: Response) => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

	public create = async (req: Request, res: Response) => {
    const response = await certificateQueueService.insertOrUpdate(req.getParameters.all())
    return responseUtility.sendResponseFromObject(res, response)
  }

	/**
	 * Metodo que permite editar un registro
	 * @param req Objeto de clase Express
	 * @param res Objeto de clase Express
	 * @returns
	 */
	public update = async (req: Request, res: Response) => {
		const response = await certificateQueueService.insertOrUpdate(req.getParameters.all())
		return responseUtility.sendResponseFromObject(res, response)
  }

  public list = async (req: Request, res: Response) => {
		const response = await certificateQueueService.list(req.getParameters.all())
		return responseUtility.sendResponseFromObject(res, response)
  }

}

export const certificateQueueController = new CertificateQueueController();
export { CertificateQueueController as DefaultAdminCertificateQueueCertificateQueueController };
