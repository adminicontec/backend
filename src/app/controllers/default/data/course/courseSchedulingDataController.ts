// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import_models Import models
// @end

// @import_services Import services
import {courseSchedulingDataService} from '@scnode_app/services/default/data/course/courseSchedulingDataService'
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

// @import_types Import types
// @end

class CourseSchedulingDataController {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = (req: Request, res: Response) => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite consultar la programación
   * @param req Objeto de clase Express
   * @param res Objeto de clase Express
   * @returns
   */
  public fetchCourseSchedulingByProgram = async (req: Request, res: Response) => {
    const user_id = req.user.sub
    let params = req.getParameters.all()
    params['user'] = user_id
    const response = await courseSchedulingDataService.fetchCourseSchedulingByProgram(params)
    return responseUtility.sendResponseFromObject(res,response);
  }
}

export const courseSchedulingDataController = new CourseSchedulingDataController();
export { CourseSchedulingDataController as DefaultDataCourseCourseSchedulingDataController };
