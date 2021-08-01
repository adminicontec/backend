// @import_dependencies_node Import libraries
import { Request, Response, NextFunction } from 'express';
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

class AcademicResourceAttemptMiddleware {

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

  public attempt = async (req: Request, res: Response, next: NextFunction) => {
		const fields_config = [
      { key: 'user', label: 'Identificador de usuario'},
      { key: 'academic_resource_config', label: 'Identificador de la configuración del recurso'},
		];

		await requestUtility.middlewareValidator(fields_config, req, res, next)
  };
}

export const academicResourceAttemptMiddleware = new AcademicResourceAttemptMiddleware();
export { AcademicResourceAttemptMiddleware as EventsActivityAcademicResourceAcademicResourceAttemptMiddleware }
