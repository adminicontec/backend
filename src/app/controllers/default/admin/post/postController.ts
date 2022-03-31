// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import_models Import models
// @end

// @import_services Import services
import {postService} from '@scnode_app/services/default/admin/post/postService'
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

// @import_types Import types
import {QueryValues} from '@scnode_app/types/default/global/queryTypes'
// @end

class PostController {

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
    let params = req.getParameters.all()
    let files = req.files

    if (files && Object.prototype.hasOwnProperty.call(files, 'cover')) {
      params['coverFile'] = files['cover']
    }
    if (files && Object.prototype.hasOwnProperty.call(files, 'brochure')) {
      params['brochureFile'] = files['brochure']
    }
    if (files && Object.prototype.hasOwnProperty.call(files, 'researchFile')) {
      params['researchFile'] = files['researchFile']
    }

    const response = await postService.insertOrUpdate(params)
    return responseUtility.sendResponseFromObject(res, response)
  }

	/**
	 * Metodo que permite editar un registro
	 * @param req Objeto de clase Express
	 * @param res Objeto de clase Express
	 * @returns
	 */
	public update = async (req: Request, res: Response) => {
    let params = req.getParameters.all()
    let files = req.files

    if (files && Object.prototype.hasOwnProperty.call(files, 'cover')) {
      params['coverFile'] = files['cover']
    }
    if (files && Object.prototype.hasOwnProperty.call(files, 'brochure')) {
      params['brochureFile'] = files['brochure']
    }
    if (files && Object.prototype.hasOwnProperty.call(files, 'researchFile')) {
      params['researchFile'] = files['researchFile']
    }

		const response = await postService.insertOrUpdate(params)
		return responseUtility.sendResponseFromObject(res, response)
  }

	/**
	 * Metodo que permite eliminar un registro
	 * @param req Objeto de clase Express
	 * @param res Objeto de clase Express
	 * @returns
	 */
	public delete = async (req: Request, res: Response) => {
		const response = await postService.delete(req.getParameters.all())
		return responseUtility.sendResponseFromObject(res, response)
  }

	/**
	 * Metodo que permite listar los registros
	 * @param req Objeto de clase Express
	 * @param res Objeto de clase Express
	 * @returns
	 */
	public list = async (req: Request, res: Response) => {
		const response = await postService.list(req.getParameters.all())
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
		const response = await postService.findBy({query: QueryValues.ONE, where: [{field: '_id', value: id}]})
		return responseUtility.sendResponseFromObject(res, response)
	}

}

export const postController = new PostController();
export { PostController as DefaultAdminPostPostController };
