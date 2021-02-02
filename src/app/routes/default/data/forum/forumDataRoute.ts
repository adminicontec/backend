// @import_dependencies_node Import libraries
// @end

// @import_controller Import controller
import { DefaultDataForumForumDataController as Controller } from "@scnode_app/controllers/default/data/forum/forumDataController.ts";
// @end

// @import_utilities Import utilities
import { routerUtility } from "@scnode_core/utilities/routerUtility";
// @end

class ForumDataRoute {

  private router_prefix: string = '/data/forum'; //Ej: /user

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
    routerUtility.get(app,_route,'/fetch-forums',this.instanceController.fetchForums,[],['auth']);
    routerUtility.post(app,_route,'/:forum/fetch-messages',this.instanceController.fetchMessagesByForum,[],['auth']);
    // @end
  }
}

export const forumDataRoute = new ForumDataRoute();
export { ForumDataRoute as DefaultDataForumForumDataRoute };
