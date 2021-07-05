// @import_dependencies_node Import libraries
import { Request, Response, NextFunction } from 'express';
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility, ValidatorRequest } from "@scnode_core/utilities/requestUtility";
// @end

class CourseSchedulingDetailsMiddleware {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = (req: Request, res: Response, next: NextFunction) => {
      const fields_config: ValidatorRequest[] = [
        { key: 'one_field', label: 'This is a short description'},
      ]
      await requestUtility.middlewareValidator(fields_config, req, res, next)
    }
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  public create = async (req: Request, res: Response, next: NextFunction) => {

		const fields_config: ValidatorRequest[] = [
      { key: 'course', label: 'Curso del programa'},
      { key: 'startDate', label: 'Fecha de inicio'},
      { key: 'endDate', label: 'Fecha de finalización'},
      // { key: 'teacher', label: 'Docente'},
      // { key: 'regional', label: 'Regional'},
		];

		await requestUtility.middlewareValidator(fields_config, req, res, next)
  }

}

export const courseSchedulingDetailsMiddleware = new CourseSchedulingDetailsMiddleware();
export { CourseSchedulingDetailsMiddleware as AdminCourseCourseSchedulingDetailsMiddleware }
