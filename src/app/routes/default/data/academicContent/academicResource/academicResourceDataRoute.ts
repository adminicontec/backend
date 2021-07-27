// @import_dependencies_node Import libraries
// @end

// @import_controller Import controller
import { DefaultDataAcademicContentAcademicResourceAcademicResourceDataController as Controller } from "@scnode_app/controllers/default/data/academicContent/academicResource/academicResourceDataController";
// @end

// @import_utilities Import utilities
import { routerUtility } from "@scnode_core/utilities/routerUtility";
// @end

class AcademicResourceDataRoute {

  private router_prefix: string = '/data/academic-resource'; //Ej: /user

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
    routerUtility.post(app,_route,'/fetch-resource',this.instanceController.fetchAcademicResourceData,[
      {middleware: 'academic-resource-data', method: 'validate-category', dir: 'data/academicContent/academicResource'}, {middleware: 'academic-resource-data', method: 'fetch-academic-resource-data', dir: 'data/academicContent/academicResource'}],['auth']);
    // @end
  }
}

export const academicResourceDataRoute = new AcademicResourceDataRoute();
export { AcademicResourceDataRoute as DefaultDataAcademicContentAcademicResourceAcademicResourceDataRoute };
