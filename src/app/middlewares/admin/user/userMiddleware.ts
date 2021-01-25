// @import_dependencies_node Import libraries
import { Request, Response, NextFunction } from 'express';
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility, ValidatorRequest } from "@scnode_core/utilities/requestUtility";
// @end

class UserMiddleware {

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

    const {profile} = req.getParameters.all();
    if (profile && typeof profile === 'object') {
      const response = await requestUtility.validator(profile,req.files,[
        {key: "name", label: "Nombre"},
        {key: "lastName", label: "Apellidos"},
      ]);
      if (response.hasError === true) {
        return responseUtility.buildResponseFailed('http',res,{
          error_key: "fields_in_request.invalid_request_fields",
          additional_parameters: {fields_status: response.fields_status}
        });
      }
    }

		const fields_config: ValidatorRequest[] = [
      { key: 'userName', label: 'Nombre de usuario'},
      { key: 'password', label: 'Contraseña'},
      { key: 'email', label: 'Correo electronico'},
		];

		await requestUtility.middlewareValidator(fields_config, req, res, next)
  }

}

export const userMiddleware = new UserMiddleware();
export { UserMiddleware as AdminUserUserMiddleware }
