// @import_dependencies_node Import libraries
// @end

// @import_controller Import controller
import { DefaultDataSecureAuthAuthController as Controller } from "@scnode_app/controllers/default/data/secure/auth/authController";
// @end

// @import_utilities Import utilities
import { routerUtility } from "@scnode_core/utilities/routerUtility";
// @end

class AuthRoute {

  private router_prefix: string = '/auth'; //Ej: /user

  // @instance_controller
  public instanceController: Controller = new Controller();
  // @end

  constructor () {}

  /**
  * Metodo que permite agregar rutas especificas por controlador
  * @param app Objeto de clase Express Aplication
  * @param [prefix] Prefijo para el enrutamiento
  */
  public routes(app,prefix: string = '/'): void {

    const _route = `${prefix}${this.router_prefix}`;

    // @add_routes Add routes: Ej: routerUtility.get(app,_route,'/url-for-request',this.instanceController.method,[{middleware: 'middleware-name', method: 'method-name'}...],[...]);
    routerUtility.post(app,_route,'/login',this.instanceController.login,[{middleware: 'auth', method: 'login', dir: 'data/secure/auth'}],[]);
    routerUtility.get(app, _route, '/password-recovery', this.instanceController.passwordRecovery, [], [])
    routerUtility.post(app, _route, '/change-recovered-password', this.instanceController.changeRecoveredPassword, [{middleware: 'auth', method: 'change-recovered-password', dir: 'data/secure/auth'}], [])

    routerUtility.get(app, _route, '/confirm-2fa/:token', this.instanceController.confirm2FA, [], [])
    // @end
  }
}

export const authRoute = new AuthRoute();
export { AuthRoute as DefaultDataSecureAuthAuthRoute };
