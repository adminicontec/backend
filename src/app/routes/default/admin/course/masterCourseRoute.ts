// @import_dependencies_node Import libraries
// @end

// @import_controller Import controller
import { DefaultAdminCourseMasterCourseController as Controller } from "@scnode_app/controllers/default/admin/course/masterCourseController";
// @end

// @import_utilities Import utilities
import { routerUtility } from "@scnode_core/utilities/routerUtility";
// @end

class MasterCourseRoute {

  private router_prefix: string = '/admin/mastercourse'; //Ej: /user

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
    routerUtility.post(app, _route, '/create', this.instanceController.duplicate, [], ['auth'])
    routerUtility.post(app, _route, '/course-has-auditor-exam', this.instanceController.checkCourseHasAuditorExam, [{middleware: 'master-course', method: 'check-course-has-auditor-exam', dir: 'admin/course'}], ['auth'])
    // @end
  }
}

export const masterCourseRoute = new MasterCourseRoute();
export { MasterCourseRoute as DefaultAdminCourseMasterCourseRoute };
