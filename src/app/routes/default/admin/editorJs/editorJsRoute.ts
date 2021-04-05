// @import_dependencies_node Import libraries
// @end

// @import_controller Import controller
import { DefaultAdminEditorJsEditorJsController as Controller } from "@scnode_app/controllers/default/admin/editorJs/editorJsController";
// @end

// @import_utilities Import utilities
import { routerUtility } from "@scnode_core/utilities/routerUtility";
// @end

class EditorJsRoute {

  private router_prefix: string = '/admin/editor-js'; //Ej: /user

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
    routerUtility.post(app, _route, '/image/upload-by-file', this.instanceController.uploadImageByFile, [{middleware: 'editor-js', method: 'upload-image-by-file', dir: 'admin/editorJs'}], ['auth'])
    routerUtility.post(app, _route, '/image/upload-by-url', this.instanceController.uploadImageByUrl, [{middleware: 'editor-js', method: 'upload-image-by-url', dir: 'admin/editorJs'}], ['auth'])

    routerUtility.get(app, _route, '/link/fetch-url', this.instanceController.fetchUrlFromLink, [{middleware: 'editor-js', method: 'fetch-url-from-link', dir: 'admin/editorJs'}], [])
    // @end
  }
}

export const editorJsRoute = new EditorJsRoute();
export { EditorJsRoute as DefaultAdminEditorJsEditorJsRoute };
