// @import_dependencies_node Import libraries
// @end

// @import_controller Import controller
import { DefaultAdminUserUserController as Controller } from "@scnode_app/controllers/default/admin/user/userController";
// @end

// @import_utilities Import utilities
import { routerUtility } from "@scnode_core/utilities/routerUtility";
// @end

class UserRoute {

  private router_prefix: string = '/admin/user'; //Ej: /user

  // @instance_controller
  public instanceController: Controller = new Controller();
  // @end

  constructor() { }

  /**
  * Metodo que permite agregar rutas especificas por controlador
  * @param app Objeto de clase Express Aplication
  * @param [prefix] Prefijo para el enrutamiento
  */
  public routes(app, prefix: string = '/'): void {

    const _route = `${prefix}${this.router_prefix}`;

    // @add_routes Add routes: Ej: routerUtility.get(app,_route,'/url-for-request',this.instanceController.method,[{middleware: 'middleware-name', method: 'method-name'}...],[...]);
    routerUtility.get(app, _route, '/list-teachers', this.instanceController.listTeachers, [], ['auth'])

    routerUtility.post(app, _route, '/create', this.instanceController.create, [{ middleware: 'user', method: 'create', dir: 'admin/user' }], ['auth'])
    routerUtility.post(app, _route, '/update/:id', this.instanceController.update, [], ['auth'])
    routerUtility.delete(app, _route, '/delete/:id', this.instanceController.delete, [], ['auth'])
    routerUtility.post(app, _route, '/delete-many', this.instanceController.deleteMany, [], ['auth'])
    routerUtility.get(app, _route, '/', this.instanceController.list, [], ['auth'])
    routerUtility.get(app, _route, '/:id', this.instanceController.get, [], ['auth'])
    routerUtility.post(app, _route, '/create-multiple', this.instanceController.createMultiple, [], ['auth']);
    routerUtility.post(app, _route, '/sync-moodle', this.instanceController.syncMoodle, [], ['auth'])

    routerUtility.post(app, _route, '/self-registration', this.instanceController.selfRegistration, [{ middleware: 'user', method: 'self-registration', dir: 'admin/user' }], [])
    routerUtility.post(app, _route, '/send-email-confirmation', this.instanceController.sendEmailConfirmationToUser, [], [])
    routerUtility.get(app, _route, '/confirm-email/:token', this.instanceController.confirmEmail, [], [])
    // @end
  }
}

export const userRoute = new UserRoute();
export { UserRoute as DefaultAdminUserUserRoute };
