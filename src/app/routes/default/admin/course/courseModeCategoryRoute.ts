// @import_dependencies_node Import libraries
// @end

// @import_controller Import controller
import { DefaultAdminCourseCourseModeCategoryController as Controller } from "@scnode_app/controllers/default/admin/course/courseModeCategoryController";
// @end

// @import_utilities Import utilities
import { routerUtility } from "@scnode_core/utilities/routerUtility";
// @end

class CourseModeCategoryRoute {

  private router_prefix: string = '/admin/course-mode/category'; //Ej: /user

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
    routerUtility.get(app, _route, '/external/', this.instanceController.list, [], [])


    routerUtility.post(app, _route, '/create', this.instanceController.create, [{ middleware: 'course-mode-category', method: 'create', dir: 'admin/course' }], ['auth'])
		routerUtility.post(app, _route, '/update/:id', this.instanceController.update, [], ['auth'])
		routerUtility.delete(app, _route, '/delete/:id', this.instanceController.delete, [], ['auth'])
    routerUtility.get(app, _route, '/', this.instanceController.list, [], ['auth'])
    routerUtility.get(app, _route, '/:id', this.instanceController.get, [], ['auth'])
    // @end
  }
}

export const courseModeCategoryRoute = new CourseModeCategoryRoute();
export { CourseModeCategoryRoute as DefaultAdminCourseCourseModeCategoryRoute };
