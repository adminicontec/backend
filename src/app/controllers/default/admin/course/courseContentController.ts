// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import_models Import models
import { courseContentService } from '@scnode_app/services/default/moodle/course/courseContentService';
// @end

// @import_services Import services
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

// @import_types Import types
// @end

class CourseContentController {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = (req: Request, res: Response) => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  public list = async (req: Request, res: Response) => {
		const response = await courseContentService.list(req.getParameters.all())
		return responseUtility.sendResponseFromObject(res, response)
  }

  public moduleList = async (req: Request, res: Response) => {
		const response = await courseContentService.moduleList(req.getParameters.all())
		return responseUtility.sendResponseFromObject(res, response)
  }
}

export const courseContentController = new CourseContentController();
export { CourseContentController as DefaultAdminCourseCourseContentController };
