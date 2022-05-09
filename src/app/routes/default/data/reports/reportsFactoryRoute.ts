// @import_dependencies_node Import libraries
// @end

// @import_controller Import controller
import { DefaultDataReportsReportsFactoryController as Controller } from "@scnode_app/controllers/default/data/reports/reportsFactoryController";
// @end

// @import_utilities Import utilities
import { routerUtility } from "@scnode_core/utilities/routerUtility";
// @end

class ReportsFactoryRoute {

  private router_prefix: string = '/data/reports'; //Ej: /user

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
    routerUtility.post(app, _route, '/factory/generate-report', this.instanceController.factoryGenerateReport, [], ['auth'])
    // @end
  }
}

export const reportsFactoryRoute = new ReportsFactoryRoute();
export { ReportsFactoryRoute as DefaultDataReportsReportsFactoryRoute };
