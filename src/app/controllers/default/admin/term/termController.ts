// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import_models Import models
// @end

// @import_services Import services
import { termService } from '@scnode_app/services/default/admin/term/termService'
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
import { QueryValues } from '@scnode_app/types/default/global/queryTypes';
// @end

// @import_types Import types
// @end

class TermController {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = (req: Request, res: Response) => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

	public create = async (req: Request, res: Response) => {
    const response = await termService.insertOrUpdate(req.getParameters.all())
    return responseUtility.sendResponseFromObject(res, response)
  }

	public update = async (req: Request, res: Response) => {
		const response = await termService.insertOrUpdate(req.getParameters.all())
		return responseUtility.sendResponseFromObject(res, response)
  }

	public delete = async (req: Request, res: Response) => {
		const response = await termService.delete(req.getParameters.all())
		return responseUtility.sendResponseFromObject(res, response)
  }

	public list = async (req: Request, res: Response) => {
		const response = await termService.list(req.getParameters.all())
		return responseUtility.sendResponseFromObject(res, response)
  }

  public get = async (req: Request, res: Response) => {
    const {id} = req.getParameters.all()
		const response = await termService.findBy({query: QueryValues.ONE, where: [{field: '_id', value: id}]})
		return responseUtility.sendResponseFromObject(res, response)
	}

}

export const termController = new TermController();
export { TermController as DefaultAdminTermTermController };
