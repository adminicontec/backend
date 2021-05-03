// @import_dependencies_node Import libraries
import { Request, Response, NextFunction } from 'express';
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility, ValidatorRequest } from "@scnode_core/utilities/requestUtility";
// @end

class EnrollmentMiddleware {

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

  constructor() { }

  public create = async (req: Request, res: Response, next: NextFunction) => {

    const fields_config: ValidatorRequest[] = [
      { key: 'email', label: 'Email de estudiante' },
      { key: 'firstname', label: 'Nombre de estudiante' },
      { key: 'lastname', label: 'Apellido de estudiante' },
      { key: 'documentType', label: 'Tipo de documento' },
      { key: 'documentID', label: 'Documento de identidad' },
      //{ key: 'courseID', label: 'ID de curso' }
    ];

    await requestUtility.middlewareValidator(fields_config, req, res, next)
  }

}

export const enrollmentMiddleware = new EnrollmentMiddleware();
export { EnrollmentMiddleware as AdminEnrollmentEnrollmentMiddleware }
