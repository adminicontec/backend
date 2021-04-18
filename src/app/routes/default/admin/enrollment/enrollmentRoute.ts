// @import_dependencies_node Import libraries
// @end

// @import_controller Import controller
import { DefaultAdminEnrollmentEnrollmentController as Controller } from "@scnode_app/controllers/default/admin/enrollment/enrollmentController";
// @end

// @import_utilities Import utilities
import { routerUtility } from "@scnode_core/utilities/routerUtility";
// @end

class EnrollmentRoute {

  private router_prefix: string = '/enrollment'; //Ej: /user

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
    routerUtility.get(app, _route, '/', this.instanceController.list, [], ['auth'])
    routerUtility.get(app, _route, '/:id', this.instanceController.get, [], ['auth'])
    routerUtility.post(app, _route, '/create', this.instanceController.create, [{ middleware: 'enrollment', method: 'create'}], ['auth'])

    // @end
  }
}

export const enrollmentRoute = new EnrollmentRoute();
export { EnrollmentRoute as DefaultAdminEnrollmentEnrollmentRoute };
