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
    const _routeCards = `${prefix}/courseCards`;

    // @add_routes Add routes: Ej: routerUtility.get(app,_route,'/url-for-request',this.instanceController.method,[{middleware: 'middleware-name', method: 'method-name'}...],[...]);
    // !Important: Esta ruta es usada unicamente por hipertexto(tienda virtual) y solo debe ser modificada por solicitud externa
    routerUtility.get(app, _routeGeneric,'/', this.instanceController.list,[], ['auth']);
    routerUtility.get(app, _routeGeneric, '/:id', this.instanceController.get, [], ['auth'])

    routerUtility.get(app, _routeCards,'/', this.instanceController.listOfCourseCards,[], ['auth']);
    routerUtility.get(app, _routeCards,'/:id', this.instanceController.listOfCourseCards,[], ['auth']);

    routerUtility.post(app, _route, '/create', this.instanceController.create, [], ['auth'])
    routerUtility.post(app, _route, '/update/:id', this.instanceController.update, [], ['auth'])
    routerUtility.post(app, _route, '/validate-slug', this.instanceController.validateSlug, [], ['auth'])
    routerUtility.delete(app, _route, '/delete/:id', this.instanceController.delete, [], ['auth'])
    // @end
  }
}

export const courseRoute = new CourseRoute();
export { CourseRoute as DefaultAdminCourseCourseRoute };
