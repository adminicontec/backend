// @import_dependencies_node Import libraries
// @end

// @import_controller Import controller
import { DefaultAdminCourseCourseController as Controller } from "@scnode_app/controllers/default/admin/course/courseController";
// @end

// @import_utilities Import utilities
import { routerUtility } from "@scnode_core/utilities/routerUtility";
// @end

class CourseRoute {

  private router_prefix: string = '/admin/course'; //Ej: /user

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
    const _routeGeneric = `${prefix}/course`;

    // @add_routes Add routes: Ej: routerUtility.get(app,_route,'/url-for-request',this.instanceController.method,[{middleware: 'middleware-name', method: 'method-name'}...],[...]);
    routerUtility.get(app, _routeGeneric,'/', this.instanceController.list,[], ['auth']);
    routerUtility.get(app, _route, '/:id', this.instanceController.get, [], ['auth'])
    routerUtility.post(app, _route, '/create', this.instanceController.create, [], ['auth'])
    routerUtility.post(app, _route, '/update', this.instanceController.update, [], ['auth'])
    // @end
  }
}

export const courseRoute = new CourseRoute();
export { CourseRoute as DefaultAdminCourseCourseRoute };
