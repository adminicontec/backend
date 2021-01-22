// @import_dependencies_node Import libraries
// @end

// @import_controller Import controller
import { DefaultAdminPostPostLocationController as Controller } from "@scnode_app/controllers/default/admin/post/postLocationController.ts";
// @end

// @import_utilities Import utilities
import { routerUtility } from "@scnode_core/utilities/routerUtility";
// @end

class PostLocationRoute {

  private router_prefix: string = '/admin/post/location'; //Ej: /user

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
    routerUtility.post(app, _route, '/create', this.instanceController.create, [{ middleware: 'post-location', method: 'create', dir: 'admin/post' }], [])
		routerUtility.post(app, _route, '/update/:id', this.instanceController.update, [], [])
		routerUtility.delete(app, _route, '/delete/:id', this.instanceController.delete, [], [])
    routerUtility.get(app, _route, '/', this.instanceController.list, [], [])
    routerUtility.get(app, _route, '/:id', this.instanceController.get, [], [])
    // @end
  }
}

export const postLocationRoute = new PostLocationRoute();
export { PostLocationRoute as DefaultAdminPostPostLocationRoute };
