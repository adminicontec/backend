// @import_dependencies_node Import libraries
// @end

// @import_controller Import controller
import { DefaultAdminCourseCourseSchedulingController as Controller } from "@scnode_app/controllers/default/admin/course/courseSchedulingController";
// @end

// @import_utilities Import utilities
import { routerUtility } from "@scnode_core/utilities/routerUtility";
// @end

class CourseSchedulingRoute {

  private router_prefix: string = '/admin/course-scheduling'; //Ej: /user

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
    routerUtility.get(app, _route, '/download-calendar', this.instanceController.downloadCalendar, [], ['auth'])
    routerUtility.get(app, _route, '/generate-report', this.instanceController.generateReport, [], ['auth'])

    routerUtility.post(app, _route, '/:id/reactivate-service', this.instanceController.reactivateService, [], ['auth'])
    routerUtility.post(app, _route, '/:id/force-status-service', this.instanceController.forceStatusService, [], ['auth'])
    routerUtility.post(app, _route, '/:id/duplicate-service', this.instanceController.duplicateService, [], ['auth'])

    routerUtility.post(app, _route, '/create', this.instanceController.create, [{ middleware: 'course-scheduling', method: 'create', dir: 'admin/course' }], ['auth'])
		routerUtility.post(app, _route, '/update/:id', this.instanceController.update, [], ['auth'])
    routerUtility.post(app, _route, '/update-clean/:id', this.instanceController.updateClean, [], ['auth'])
		routerUtility.delete(app, _route, '/delete/:id', this.instanceController.delete, [], ['auth'])
    routerUtility.get(app, _route, '/', this.instanceController.list, [], ['auth'])
    routerUtility.get(app, _route, '/:id', this.instanceController.get, [], ['auth'])

    routerUtility.post(app, _route, '/change-scheduling-modular', this.instanceController.changeSchedulingModular, [], ['auth'])
    routerUtility.post(app, _route, '/change-scheduling-element', this.instanceController.changeSchedulingElement, [], ['auth'])

    routerUtility.post(app, _route, '/sincronice-service-moodle', this.instanceController.sincroniceServiceMoodle, [], ['auth'])
    // @end
  }
}

export const courseSchedulingRoute = new CourseSchedulingRoute();
export { CourseSchedulingRoute as DefaultAdminCourseCourseSchedulingRoute };
