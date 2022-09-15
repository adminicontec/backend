// @import_dependencies_node Import libraries
// @end

// @import_controller Import controller
import { DefaultAdminCourseCourseSchedulingInformationController as Controller } from "@scnode_app/controllers/default/admin/course/courseSchedulingInformationController";
// @end

// @import_utilities Import utilities
import { routerUtility } from "@scnode_core/utilities/routerUtility";
// @end

class CourseSchedulingInformationRoute {

  private router_prefix: string = '/admin/course-scheduling-information'; //Ej: /user

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
    routerUtility.post(app,_route,'/process',this.instanceController.processInformation,[],['auth']);
    // @end
  }
}

export const courseSchedulingInformationRoute = new CourseSchedulingInformationRoute();
export { CourseSchedulingInformationRoute as DefaultAdminCourseCourseSchedulingInformationRoute };
