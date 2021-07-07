// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import_models Import models
// @end

// @import_services Import services
import { masterCourseService } from '@scnode_app/services/default/moodle/course/masterCourseService';
import { moodleCourseService } from '@scnode_app/services/default/moodle/course/moodleCourseService';
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

// @import_types Import types
import {QueryValues} from '@scnode_app/types/default/global/queryTypes'
// @end

class MasterCourseController {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = (req: Request, res: Response) => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

	public list = async (req: Request, res: Response) => {
		const response = await masterCourseService.list(req.getParameters.all())
		return responseUtility.sendResponseFromObject(res, response)
  }


	public duplicate = async (req: Request, res: Response) => {
		const response = await moodleCourseService.createFromMaster(req.getParameters.all())
		return responseUtility.sendResponseFromObject(res, response)
  }


}

export const masterCourseController = new MasterCourseController();
export { MasterCourseController as DefaultAdminCourseMasterCourseController };
