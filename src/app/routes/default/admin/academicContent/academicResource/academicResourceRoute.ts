// @import_dependencies_node Import libraries
// @end

// @import_controller Import controller
import { DefaultAdminAcademicContentAcademicResourceAcademicResourceController as Controller } from "@scnode_app/controllers/default/admin/academicContent/academicResource/academicResourceController";
// @end

// @import_utilities Import utilities
import { routerUtility } from "@scnode_core/utilities/routerUtility";
// @end

class AcademicResourceRoute {

  private router_prefix: string = '/admin/academic-resource'; //Ej: /user

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
    routerUtility.post(app, _route, '/create', this.instanceController.create, [{ middleware: 'academic-resource', method: 'create', dir: 'admin/academicContent/academicResource' }, {middleware: 'academic-resource', method: 'validate-category', dir: 'admin/academicContent/academicResource'}], ['auth'])
		routerUtility.post(app, _route, '/update/:id', this.instanceController.update, [{middleware: 'academic-resource', method: 'validate-category', dir: 'admin/academicContent/academicResource'}], ['auth'])
		routerUtility.delete(app, _route, '/delete/:id', this.instanceController.delete, [{middleware: 'academic-resource', method: 'validate-category', dir: 'admin/academicContent/academicResource'}], ['auth'])
    routerUtility.get(app, _route, '/', this.instanceController.list, [{middleware: 'academic-resource', method: 'validate-category', dir: 'admin/academicContent/academicResource'}], ['auth'])
    routerUtility.get(app, _route, '/:id', this.instanceController.get, [{middleware: 'academic-resource', method: 'validate-category', dir: 'admin/academicContent/academicResource'}], ['auth'])
    // @end
  }
}

export const academicResourceRoute = new AcademicResourceRoute();
export { AcademicResourceRoute as DefaultAdminAcademicContentAcademicResourceAcademicResourceRoute };
