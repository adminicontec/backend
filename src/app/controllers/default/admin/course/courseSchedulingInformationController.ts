// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import_models Import models
// @end

// @import_services Import services
import {courseSchedulingInformationService} from '@scnode_app/services/default/admin/course/courseSchedulingInformationService'
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

// @import_types Import types
// @end

class CourseSchedulingInformationController {

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
	public processInformation = async (req: Request, res: Response) => {
    const user_id = req.user.sub
    let params = req.getParameters.all()
    params['user'] = user_id

		const response = await courseSchedulingInformationService.processInformation(params)
		return responseUtility.sendResponseFromObject(res, response)
	}

}

export const courseSchedulingInformationController = new CourseSchedulingInformationController();
export { CourseSchedulingInformationController as DefaultAdminCourseCourseSchedulingInformationController };
