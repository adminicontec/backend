// @import_dependencies_node Import libraries
// @end

// @import_controller Import controller
import { DefaultAdminCountryCountryController as Controller } from "@scnode_app/controllers/default/admin/country/countryController";
// @end

// @import_utilities Import utilities
import { routerUtility } from "@scnode_core/utilities/routerUtility";
// @end

class CountryRoute {

  private router_prefix: string = '/admin/country'; //Ej: /user

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
    routerUtility.post(app, _route, '/create', this.instanceController.create, [{ middleware: 'country', method: 'create', dir: 'admin/country' }], ['auth'])
		routerUtility.post(app, _route, '/update/:id', this.instanceController.update, [], ['auth'])
		routerUtility.delete(app, _route, '/delete/:id', this.instanceController.delete, [], ['auth'])
    routerUtility.get(app, _route, '/', this.instanceController.list, [], ['auth'])
    routerUtility.get(app, _route, '/:id', this.instanceController.get, [], ['auth'])
    // @end
  }
}

export const countryRoute = new CountryRoute();
export { CountryRoute as DefaultAdminCountryCountryRoute };
