// @import_dependencies_node Import libraries
// @end

// @import_controller Import controller
import { DefaultAdminDocumentQueueDocumentQueueController as Controller } from "@scnode_app/controllers/default/admin/documentQueue/documentQueueController";
// @end

// @import_utilities Import utilities
import { routerUtility } from "@scnode_core/utilities/routerUtility";
// @end

class DocumentQueueRoute {

  private router_prefix: string = '/admin/documentqueue'; //Ej: /user

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
    routerUtility.post(app, _route, '/create', this.instanceController.create, [], ['auth'])
		routerUtility.post(app, _route, '/update/:id', this.instanceController.update, [], ['auth'])
    routerUtility.post(app, _route, '/fetchByStatus', this.instanceController.fetchByStatus, [], ['auth'])
    routerUtility.delete(app, _route, '/delete/:id', this.instanceController.delete, [], ['auth'])


    // @end
  }
}

export const documentQueueRoute = new DocumentQueueRoute();
export { DocumentQueueRoute as DefaultAdminDocumentQueueDocumentQueueRoute };
