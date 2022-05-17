// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import_models Import models
// @end

// @import_services Import services
import {courseSchedulingService} from '@scnode_app/services/default/admin/course/courseSchedulingService'
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

// @import_types Import types
import {QueryValues} from '@scnode_app/types/default/global/queryTypes'
// @end

class CourseSchedulingController {

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

    if (params && params.program && typeof params.program === 'string') {
      params.program = JSON.parse(params.program)
    }

    if (params && params.schedulingMode && typeof params.schedulingMode === 'string') {
      params.schedulingMode = JSON.parse(params.schedulingMode)
    }

    const response = await courseSchedulingService.insertOrUpdate(params, req.files)
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

    if (params && params.program && typeof params.program === 'string') {
      params.program = JSON.parse(params.program)
    }

    if (params && params.schedulingMode && typeof params.schedulingMode === 'string') {
      params.schedulingMode = JSON.parse(params.schedulingMode)
    }

		const response = await courseSchedulingService.insertOrUpdate(params, req.files)
		return responseUtility.sendResponseFromObject(res, response)
  }

	/**
	 * Metodo que permite eliminar un registro
	 * @param req Objeto de clase Express
	 * @param res Objeto de clase Express
	 * @returns
	 */
	public delete = async (req: Request, res: Response) => {
		const response = await courseSchedulingService.delete(req.getParameters.all())
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

		const response = await courseSchedulingService.list(params)
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
		const response = await courseSchedulingService.findBy({query: QueryValues.ONE, where: [{field: '_id', value: id}]})
		return responseUtility.sendResponseFromObject(res, response)
	}

  /**
	 * Metodo que permite generar reporte
	 * @param req Objeto de clase Express
	 * @param res Objeto de clase Express
	 * @returns
	 */
	public generateReport = async (req: Request, res: Response) => {
		const response = await courseSchedulingService.generateReport(req.getParameters.all())
		return responseUtility.sendResponseFromObject(res, response)
	}

  /**
	 * Metodo que permite crear un registro
	 * @param req Objeto de clase Express
	 * @param res Objeto de clase Express
	 * @returns
	 */
	public reactivateService = async (req: Request, res: Response) => {
    const user_id = req.user.sub
    let params = req.getParameters.all()
    params['user'] = user_id

    const response = await courseSchedulingService.reactivateService(params)
    return responseUtility.sendResponseFromObject(res, response)
  }

  /**
	 * Metodo que permite crear un registro
	 * @param req Objeto de clase Express
	 * @param res Objeto de clase Express
	 * @returns
	 */
	public duplicateService = async (req: Request, res: Response) => {
    const user_id = req.user.sub
    let params = req.getParameters.all()
    params['user'] = user_id

    const response = await courseSchedulingService.duplicateService(params)
    return responseUtility.sendResponseFromObject(res, response)
  }
}

export const courseSchedulingController = new CourseSchedulingController();
export { CourseSchedulingController as DefaultAdminCourseCourseSchedulingController };
