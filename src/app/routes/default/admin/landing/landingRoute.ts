// @import_dependencies_node Import libraries
// @end

// @import_controller Import controller
import { DefaultAdminLandingLandingController as Controller } from "@scnode_app/controllers/default/admin/landing//landingController";
// @end

// @import_utilities Import utilities
import { routerUtility } from "@scnode_core/utilities/routerUtility";
// @end

class LandingRoute {

  private router_prefix: string = '/admin/landing'; //Ej: /user

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
    routerUtility.post(app, _route, '/create', this.instanceController.create, [{ middleware: 'landing', method: 'create', dir: 'admin/landing' }], ['auth'])
		routerUtility.post(app, _route, '/update/:id', this.instanceController.update, [], ['auth'])
		routerUtility.delete(app, _route, '/delete/:id', this.instanceController.delete, [], ['auth'])
    routerUtility.get(app, _route, '/', this.instanceController.list, [], ['auth'])
    routerUtility.get(app, _route, '/:id', this.instanceController.get, [], ['auth'])

    routerUtility.post(app, _route, '/insert-or-update-article', this.instanceController.insertOrUpdateArticle, [{ middleware: 'landing', method: 'create', dir: 'admin/landing' }], ['auth'])
    routerUtility.post(app, _route, '/insert-or-update-training', this.instanceController.insertOrUpdateTraining, [{ middleware: 'landing', method: 'create', dir: 'admin/landing' }], ['auth'])
    routerUtility.delete(app, _route, '/delete-training/:slug/:unique', this.instanceController.deleteTraining, [], ['auth'])

    routerUtility.post(app, _route, '/insert-or-update-scheduling', this.instanceController.insertOrUpdateScheduling, [{ middleware: 'landing', method: 'create', dir: 'admin/landing' }], ['auth'])
    routerUtility.delete(app, _route, '/delete-scheduling/:slug/:unique', this.instanceController.deleteScheduling, [], ['auth'])

    routerUtility.post(app, _route, '/insert-or-update-descriptive-training', this.instanceController.insertOrUpdateDescriptiveTraining, [{ middleware: 'landing', method: 'create', dir: 'admin/landing' }], ['auth'])

    routerUtility.post(app, _route, '/insert-or-update-our-clients', this.instanceController.insertOrUpdateOurClient, [{ middleware: 'landing', method: 'create', dir: 'admin/landing' }], ['auth'])
    routerUtility.delete(app, _route, '/delete-our-client/:slug/:unique', this.instanceController.deleteOurClient, [], ['auth'])

    routerUtility.post(app, _route, '/insert-or-update-reference', this.instanceController.insertOrUpdateReference, [{ middleware: 'landing', method: 'create', dir: 'admin/landing' }], ['auth'])
    routerUtility.delete(app, _route, '/delete-reference/:slug/:unique', this.instanceController.deleteReference, [], ['auth'])

    routerUtility.post(app, _route, '/insert-or-update-forums', this.instanceController.insertOrUpdateForums, [{ middleware: 'landing', method: 'create', dir: 'admin/landing' }], ['auth'])
    // @end
  }
}

export const landingRoute = new LandingRoute();
export { LandingRoute as DefaultAdminLandingLandingRoute };
