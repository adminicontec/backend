// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import_models Import models
// @end

// @import_services Import services
import {authService} from '@scnode_app/services/default/data/secure/auth/authService'
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

// @import_types Import types
// @end

class AuthController {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = (req: Request, res: Response) => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
	 * Metodo que permite a un usuario loguearse
	 * @param req Objeto de clase Express
	 * @param res Objeto de clase Express
	 * @returns
	 */
	public login = async (req: Request, res: Response) => {
		const response = await authService.login(req, req.getParameters.all())
		return responseUtility.sendResponseFromObject(res, response)
	}

   /**
	 * Metodo que permite generar token de autenticación para recuperar contraseña
	 * @param req Objeto de la clase Express
	 * @param res Objeto de la clase Express
	 * @returns
	 */
  public passwordRecovery = async (req: Request, res: Response) => {
    let params = req.getParameters.all()
    params.subject = 'passwordRecover.subject'
    const response = await authService.generateTokenFromDestination(params)
    return responseUtility.sendResponseFromObject(res, response)
  }

  /**
	 * Metodo que permite validar el token y procesar cambio de contraseña
	 * @param req Objeto de la clase Express
	 * @param res Objeto de la clase Express
	 * @returns
	 */
   public changeRecoveredPassword = async (req: Request, res: Response) => {
    let params = req.getParameters.all()
    const response = await authService.changeRecoveredPassword(req, params)
    return responseUtility.sendResponseFromObject(res, response)
  }

  /**
	 * Metodo que permite a un usuario loguearse
	 * @param req Objeto de clase Express
	 * @param res Objeto de clase Express
	 * @returns
	 */
	public confirm2FA = async (req: Request, res: Response) => {
		const response = await authService.confirm2FA(req, req.getParameters.all())
		return responseUtility.sendResponseFromObject(res, response)
	}
}

export const authController = new AuthController();
export { AuthController as DefaultDataSecureAuthAuthController };
