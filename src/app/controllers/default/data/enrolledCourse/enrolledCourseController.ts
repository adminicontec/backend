// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import_models Import models
// @end

// @import_services Import services
import {enrolledCourseService} from '@scnode_app/services/default/data/enrolledCourse/enrolledCourseService'
import {moodleEnrollmentService} from '@scnode_app/services/default/moodle/enrollment/moodleEnrollmentService'
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

// @import_types Import types
// @end

class EnrolledCourseController {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = (req: Request, res: Response) => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite consultar los cursos que tiene inscrito un estudiante
   * @param req Objeto de clase Express
   * @param res Objeto de clase Express
   * @returns
   */
   public enrolledCourses = async (req: Request, res: Response) => {
    const user_id = req.user.sub
    let params = req.getParameters.all()
    params['user'] = user_id
    // const response = await moodleEnrollmentService.fetchEnrolledCoursesByUser(params)
    const response = await enrolledCourseService.fetchEnrollmentByUser(params)
    return responseUtility.sendResponseFromObject(res,response);
  }

  /**
   * Metodo que permite consultar los cursos que tiene inscrito un estudiante
   * @param req Objeto de clase Express
   * @param res Objeto de clase Express
   * @returns
   */
   public fetchCertifications = async (req: Request, res: Response) => {
    const user_id = req.user.sub
    let params = req.getParameters.all()
    params['user'] = user_id
    // const response = await moodleEnrollmentService.fetchEnrolledCoursesByUser(params)
    const response = await enrolledCourseService.fetchCertifications(params)
    return responseUtility.sendResponseFromObject(res,response);
  }

  /**
   * Metodo que permite consultar los cursos que tiene inscrito un estudiante
   * @param req Objeto de clase Express
   * @param res Objeto de clase Express
   * @returns
   */
   public downloadMasiveCertifications = async (req: Request, res: Response) => {
    const user_id = req.user.sub
    let params = req.getParameters.all()
    params['user'] = user_id
    // const response = await moodleEnrollmentService.fetchEnrolledCoursesByUser(params)
    const response = await enrolledCourseService.downloadMasiveCertifications(params)
    return responseUtility.sendResponseFromObject(res,response);
  }

}

export const enrolledCourseController = new EnrolledCourseController();
export { EnrolledCourseController as DefaultDataEnrolledCourseEnrolledCourseController };
