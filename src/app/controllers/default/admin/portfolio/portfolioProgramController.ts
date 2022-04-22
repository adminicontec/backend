import { QueryValues } from '@scnode_app/types/default/global/queryTypes';
// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import_models Import models
// @end

// @import_services Import services
import { portfolioProgramService } from '@scnode_app/services/default/admin/portfolio/portfolioProgramService';
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

// @import_types Import types
// @end

class PortfolioProgramController {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = (req: Request, res: Response) => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
	 * Metodo que permite crear un registro
	 * @param req Objeto de clase Express
	 * @param res Objeto de clase Express
	 * @returns
	 */
	public create = async (req: Request, res: Response) => {
    const response = await portfolioProgramService.insertOrUpdate(req.getParameters.all())
    return responseUtility.sendResponseFromObject(res, response)
  }

	/**
	 * Metodo que permite editar un registro
	 * @param req Objeto de clase Express
	 * @param res Objeto de clase Express
	 * @returns
	 */
	public update = async (req: Request, res: Response) => {
		const response = await portfolioProgramService.insertOrUpdate(req.getParameters.all())
		return responseUtility.sendResponseFromObject(res, response)
  }

  /**
	 * Metodo que permite subir un archivo de excel con el portafolio
	 * @param req Objeto de clase Express
	 * @param res Objeto de clase Express
	 * @returns
	 */
	public uploadFile = async (req: Request, res: Response) => {
    let files = req.files;
    const user_id = req.user.sub;
		const response = await portfolioProgramService.uploadFile({...req.getParameters.all(), user: user_id}, files)
		return responseUtility.sendResponseFromObject(res, response)
  }

	/**
	 * Metodo que permite eliminar un registro
	 * @param req Objeto de clase Express
	 * @param res Objeto de clase Express
	 * @returns
	 */
	public delete = async (req: Request, res: Response) => {
		const response = await portfolioProgramService.delete(req.getParameters.all())
		return responseUtility.sendResponseFromObject(res, response)
  }

	/**
	 * Metodo que permite listar los registros
	 * @param req Objeto de clase Express
	 * @param res Objeto de clase Express
	 * @returns
	 */
	public list = async (req: Request, res: Response) => {
		const response = await portfolioProgramService.list(req.getParameters.all())
		return responseUtility.sendResponseFromObject(res, response)
  }

    /**
	 * Metodo que permite obtener un unico registro
	 * @param req Objeto de clase Express
	 * @param res Objeto de clase Express
	 * @returns
	 */
	public get = async (req: Request, res: Response) => {
    const {id} = req.getParameters.all()
		const response = await portfolioProgramService.findBy({query: QueryValues.ONE, where: [{field: '_id', value: id}]})
		return responseUtility.sendResponseFromObject(res, response)
	}

}

export const portfolioProgramController = new PortfolioProgramController();
export { PortfolioProgramController as DefaultAdminPortfolioPortfolioProgramController };
