// @import_dependencies_node Import libraries
// @end

// @import_controller Import controller
import { DefaultAdminUserUserController as Controller } from "@scnode_app/controllers/default/admin/user/userController.ts";
// @end

// @import_utilities Import utilities
import { routerUtility } from "@scnode_core/utilities/routerUtility";
// @end

class UserRoute {

  private router_prefix: string = '/admin/user'; //Ej: /user

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
    routerUtility.post(app, _route, '/create', this.instanceController.create, [{ middleware: 'user', method: 'create', dir: 'admin/user' }], [])
		routerUtility.post(app, _route, '/update/:id', this.instanceController.update, [], [])
		routerUtility.delete(app, _route, '/delete/:id', this.instanceController.delete, [], [])
    routerUtility.get(app, _route, '/', this.instanceController.list, [], [])
    routerUtility.get(app, _route, '/:id', this.instanceController.get, [], [])
    // @end
  }
}

export const userRoute = new UserRoute();
export { UserRoute as DefaultAdminUserUserRoute };
