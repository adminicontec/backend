// @import_dependencies_node Import libraries
// @end

// @import_controller Import controller
import { DefaultErpErpController as Controller } from "@scnode_app/controllers/default/erp/erpController";
// @end

// @import_utilities Import utilities
import { routerUtility } from "@scnode_core/utilities/routerUtility";
// @end

class ErpRoute {

  private router_prefix: string = '/admin/erp'; //Ej: /user

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
    routerUtility.post(app, _route, '/get-certificate-price-from-certificate-queue', this.instanceController.getCertificatePriceFromCertificateQueue, [], [])
    routerUtility.post(app, _route, '/get-prices-by-program', this.instanceController.getPricesByProgram, [], ['auth'])
    routerUtility.post(app, _route, '/update-erp-prices', this.instanceController.updateErpPrices, [], ['auth'])
    // @end
  }
}

export const erpRoute = new ErpRoute();
export { ErpRoute as DefaultErpErpRoute };
