// @import_dependencies_node Import libraries
// @end

// @import_controller Import controller
import { DefaultAdminCustomLogCustomLogController as Controller } from "@scnode_app/controllers/default/admin/customLog/customLogController";
// @end

// @import_utilities Import utilities
import { routerUtility } from "@scnode_core/utilities/routerUtility";
// @end

class CustomLogRoute {

  private router_prefix: string = '/admin/custom-logs'; //Ej: /user

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
    routerUtility.post(app, _route, '/', this.instanceController.list, [], ['auth'])
    // @end
  }
}

export const customLogRoute = new CustomLogRoute();
export { CustomLogRoute as DefaultAdminCustomLogCustomLogRoute };
