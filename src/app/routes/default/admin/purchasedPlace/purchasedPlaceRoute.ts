
// @import_dependencies_node Import libraries
// @end

// @import_controller Import controller
import { DefaultAdminPurchasedPlacePurchasedPlaceController as Controller } from "@scnode_app/controllers/default/admin/purchasePlace/purchasePlaceController";
// @end

// @import_utilities Import utilities
import { routerUtility } from "@scnode_core/utilities/routerUtility";
// @end

class PurchasedPlaceRoute {
  private router_prefix: string = '/purchase-place'; //Ej: /user

  // @instance_controller
  public instanceController: Controller = new Controller();
  // @end

  /**
  * Metodo que permite agregar rutas especificas por controlador
  * @param app Objeto de clase Express Aplication
  * @param [prefix] Prefijo para el enrutamiento
  */
  public routes(app,prefix: string = '/'): void {

    const _route = `${prefix}${this.router_prefix}`;

    // @add_routes Add routes: Ej: routerUtility.get(app,_route,'/url-for-request',this.instanceController.method,[{middleware: 'middleware-name', method: 'method-name'}...],[...]);
    routerUtility.get(app, _route, '/places', this.instanceController.getPlaces, [], ['auth'])
    routerUtility.post(app, _route, '/assign', this.instanceController.assignPlace, [], ['auth'])
    // @end
  }
}

export const purchasedPlaceRoute = new PurchasedPlaceRoute();
export { PurchasedPlaceRoute as DefaultAdminPurchasedPlaceRoute };