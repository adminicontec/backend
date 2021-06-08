// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import_models Import models
// @end

// @import_services Import services
import {courseDataService} from '@scnode_app/services/default/data/course/courseDataService'
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

// @import_types Import types
// @end

class CourseDataController {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = (req: Request, res: Response) => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}


  /**
   * Metodo que permite consultar los cursos
   * @param req Objeto de clase Express
   * @param res Objeto de clase Express
   * @returns
   */
   public fetchCourses = async (req: Request, res: Response) => {
    let params = req.getParameters.all()
    const response = await courseDataService.fetchCourses(params)
    return responseUtility.sendResponseFromObject(res,response);
  }

  /**
   * Metodo que permite consultar un curso
   * @param req Objeto de clase Express
   * @param res Objeto de clase Express
   * @returns
   */
   public fetchCourse = async (req: Request, res: Response) => {
    let params = req.getParameters.all()
    const response = await courseDataService.fetchCourse(params)
    return responseUtility.sendResponseFromObject(res,response);
  }
}

export const courseDataController = new CourseDataController();
export { CourseDataController as DefaultDataCourseCourseDataController };
