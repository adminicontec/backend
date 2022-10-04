// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import_models Import models
// @end

// @import_services Import services
import {landingService} from '@scnode_app/services/default/admin/landing/landingService'
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

// @import_types Import types
import {QueryValues} from '@scnode_app/types/default/global/queryTypes'
// @end

class LandingController {

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
    const user_id = req.user.sub
    let params = req.getParameters.all()
    params['user'] = user_id

    const response = await landingService.insertOrUpdate(params)
    return responseUtility.sendResponseFromObject(res, response)
  }

	/**
	 * Metodo que permite editar un registro
	 * @param req Objeto de clase Express
	 * @param res Objeto de clase Express
	 * @returns
	 */
	public update = async (req: Request, res: Response) => {
    const user_id = req.user.sub
    let params = req.getParameters.all()
    params['user'] = user_id

		const response = await landingService.insertOrUpdate(params)
		return responseUtility.sendResponseFromObject(res, response)
  }

	/**
	 * Metodo que permite eliminar un registro
	 * @param req Objeto de clase Express
	 * @param res Objeto de clase Express
	 * @returns
	 */
	public delete = async (req: Request, res: Response) => {
		const response = await landingService.delete(req.getParameters.all())
		return responseUtility.sendResponseFromObject(res, response)
  }

	/**
	 * Metodo que permite listar los registros
	 * @param req Objeto de clase Express
	 * @param res Objeto de clase Express
	 * @returns
	 */
	public list = async (req: Request, res: Response) => {
    const user_id = (req.user) ? req.user.sub : null
    let params = req.getParameters.all()
    params['user'] = user_id

		const response = await landingService.list(params)
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
		const response = await landingService.findBy({query: QueryValues.ONE, where: [{field: '_id', value: id}]})
		return responseUtility.sendResponseFromObject(res, response)
	}


  /**
	 * Metodo que permite editar un registro
	 * @param req Objeto de clase Express
	 * @param res Objeto de clase Express
	 * @returns
	 */
	public insertOrUpdateArticle = async (req: Request, res: Response) => {
    const user_id = req.user.sub
    let params = req.getParameters.all()
    let files = req.files

    params['user'] = user_id

    if (files && Object.prototype.hasOwnProperty.call(files, 'cover')) {
      params['coverFile'] = files['cover']
    }

		const response = await landingService.insertOrUpdateArticle(params)
		return responseUtility.sendResponseFromObject(res, response)
  }

  /**
	 * Metodo que permite editar un registro
	 * @param req Objeto de clase Express
	 * @param res Objeto de clase Express
	 * @returns
	 */
	public insertOrUpdateAlliance = async (req: Request, res: Response) => {
    const user_id = req.user.sub
    let params = req.getParameters.all()
    let files = req.files

    params['user'] = user_id

    if (files && Object.prototype.hasOwnProperty.call(files, 'logo')) {
      params['logoFile'] = files['logo']
    }

		const response = await landingService.insertOrUpdateAlliance(params)
		return responseUtility.sendResponseFromObject(res, response)
  }

  /**
	 * Metodo que permite editar un registro
	 * @param req Objeto de clase Express
	 * @param res Objeto de clase Express
	 * @returns
	 */
	public deleteAlliance = async (req: Request, res: Response) => {
    const user_id = req.user.sub
    let params = req.getParameters.all()
    params['user'] = user_id

		const response = await landingService.deleteAlliance(params)
		return responseUtility.sendResponseFromObject(res, response)
  }

  /**
	 * Metodo que permite editar un registro
	 * @param req Objeto de clase Express
	 * @param res Objeto de clase Express
	 * @returns
	 */
	public saveAllianceBrochure = async (req: Request, res: Response) => {
    const user_id = req.user.sub
    let params = req.getParameters.all()
    let files = req.files

    params['user'] = user_id

    if (files && Object.prototype.hasOwnProperty.call(files, 'brochure')) {
      params['brochureFile'] = files['brochure']
    }

		const response = await landingService.saveAllianceBrochure(params)
		return responseUtility.sendResponseFromObject(res, response)
  }

  /**
	 * Metodo que permite editar un registro
	 * @param req Objeto de clase Express
	 * @param res Objeto de clase Express
	 * @returns
	 */
	public insertOrUpdateTraining = async (req: Request, res: Response) => {
    const user_id = req.user.sub
    let params = req.getParameters.all()
    let files = req.files

    params['user'] = user_id

    if (files && Object.prototype.hasOwnProperty.call(files, 'attached')) {
      params['attachedFile'] = files['attached']
    }

		const response = await landingService.insertOrUpdateTraining(params)
		return responseUtility.sendResponseFromObject(res, response)
  }

  /**
	 * Metodo que permite editar un registro
	 * @param req Objeto de clase Express
	 * @param res Objeto de clase Express
	 * @returns
	 */
	public deleteTraining = async (req: Request, res: Response) => {
    const user_id = req.user.sub
    let params = req.getParameters.all()
    params['user'] = user_id

		const response = await landingService.deleteTraining(params)
		return responseUtility.sendResponseFromObject(res, response)
  }

  /**
	 * Metodo que permite editar un registro
	 * @param req Objeto de clase Express
	 * @param res Objeto de clase Express
	 * @returns
	 */
	public insertOrUpdateScheduling = async (req: Request, res: Response) => {
    const user_id = req.user.sub
    let params = req.getParameters.all()
    let files = req.files

    params['user'] = user_id

    if (files && Object.prototype.hasOwnProperty.call(files, 'attached')) {
      params['attachedFile'] = files['attached']
    }

		const response = await landingService.insertOrUpdateScheduling(params)
		return responseUtility.sendResponseFromObject(res, response)
  }

  /**
	 * Metodo que permite editar un registro
	 * @param req Objeto de clase Express
	 * @param res Objeto de clase Express
	 * @returns
	 */
	public deleteScheduling = async (req: Request, res: Response) => {
    const user_id = req.user.sub
    let params = req.getParameters.all()
    params['user'] = user_id

		const response = await landingService.deleteScheduling(params)
		return responseUtility.sendResponseFromObject(res, response)
  }

  /**
	 * Metodo que permite editar un registro
	 * @param req Objeto de clase Express
	 * @param res Objeto de clase Express
	 * @returns
	 */
	public insertOrUpdateOurClient = async (req: Request, res: Response) => {
    const user_id = req.user.sub
    let params = req.getParameters.all()
    let files = req.files

    params['user'] = user_id

    if (files && Object.prototype.hasOwnProperty.call(files, 'attached')) {
      params['attachedFile'] = files['attached']
    }

		const response = await landingService.insertOrUpdateOurClient(params)
		return responseUtility.sendResponseFromObject(res, response)
  }

  /**
	 * Metodo que permite editar un registro
	 * @param req Objeto de clase Express
	 * @param res Objeto de clase Express
	 * @returns
	 */
	public deleteOurClient = async (req: Request, res: Response) => {
    const user_id = req.user.sub
    let params = req.getParameters.all()
    params['user'] = user_id

		const response = await landingService.deleteOurClient(params)
		return responseUtility.sendResponseFromObject(res, response)
  }

  /**
	 * Metodo que permite editar un registro
	 * @param req Objeto de clase Express
	 * @param res Objeto de clase Express
	 * @returns
	 */
	public insertOrUpdateDescriptiveTraining = async (req: Request, res: Response) => {
    const user_id = req.user.sub
    let params = req.getParameters.all()
    let files = req.files

    params['user'] = user_id

    if (files && Object.prototype.hasOwnProperty.call(files, 'attachedFile')) {
      params['attachedFile'] = files['attachedFile']
    }

		const response = await landingService.insertOrUpdateDescriptiveTraining(params)
		return responseUtility.sendResponseFromObject(res, response)
  }

  /**
	 * Metodo que permite editar un registro
	 * @param req Objeto de clase Express
	 * @param res Objeto de clase Express
	 * @returns
	 */
	public insertOrUpdateReference = async (req: Request, res: Response) => {
    const user_id = req.user.sub
    let params = req.getParameters.all()
    let files = req.files

    params['user'] = user_id

    if (files && Object.prototype.hasOwnProperty.call(files, 'attached')) {
      params['coverFile'] = files['attached']
    }

		const response = await landingService.insertOrUpdateReference(params)
		return responseUtility.sendResponseFromObject(res, response)
  }

  /**
	 * Metodo que permite editar un registro
	 * @param req Objeto de clase Express
	 * @param res Objeto de clase Express
	 * @returns
	 */
	public deleteReference = async (req: Request, res: Response) => {
    const user_id = req.user.sub
    let params = req.getParameters.all()
    params['user'] = user_id

		const response = await landingService.deleteReference(params)
		return responseUtility.sendResponseFromObject(res, response)
  }

  /**
	 * Metodo que permite editar un registro
	 * @param req Objeto de clase Express
	 * @param res Objeto de clase Express
	 * @returns
	 */
	public insertOrUpdateForums = async (req: Request, res: Response) => {
    const user_id = req.user.sub
    let params = req.getParameters.all()

    params['user'] = user_id

		const response = await landingService.insertOrUpdateForums(params)
		return responseUtility.sendResponseFromObject(res, response)
  }
}

export const landingController = new LandingController();
export { LandingController as DefaultAdminLandingLandingController };
