// @import_dependencies_node Import libraries
// @end

// @import_controller Import controller
import { DefaultAdminTeacherTeacherController as Controller } from "@scnode_app/controllers/default/admin/teacher/teacherController";
// @end

// @import_utilities Import utilities
import { routerUtility } from "@scnode_core/utilities/routerUtility";
// @end

class TeacherRoute {

  private router_prefix: string = '/admin/teacher'; //Ej: /user

  // @instance_controller
  public instanceController: Controller = new Controller();
  // @end

  constructor () { }

  /**
  * Metodo que permite agregar rutas especificas por controlador
  * @param app Objeto de clase Express Aplication
  * @param [prefix] Prefijo para el enrutamiento
  */
  public routes(app, prefix: string = '/'): void {

    const _route = `${prefix}${this.router_prefix}`;

    // @add_routes Add routes: Ej: routerUtility.get(app,_route,'/url-for-request',this.instanceController.method,[{middleware: 'middleware-name', method: 'method-name'}...],[...]);
    routerUtility.get(app, _route, '/', this.instanceController.list, [], ['auth'])
    routerUtility.get(app, _route, '/merge', this.instanceController.merge, [], ['auth'])
    routerUtility.post(app, _route, '/processFile', this.instanceController.processFile, [], ['auth'])
    routerUtility.post(app, _route, '/upload', this.instanceController.upload, [], ['auth'])

    // @end
  }
}

export const teacherRoute = new TeacherRoute();
export { TeacherRoute as DefaultAdminTeacherTeacherRoute };
