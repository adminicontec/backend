// @import_dependencies_node Import libraries
// @end

// @import_controller Import controller
import { DefaultEventsActivityAcademicResourceAcademicResourceAttemptController as Controller } from "@scnode_app/controllers/default/events/activity/academicResource/academicResourceAttemptController";
// @end

// @import_utilities Import utilities
import { routerUtility } from "@scnode_core/utilities/routerUtility";
// @end

class AcademicResourceAttemptRoute {

  private router_prefix: string = '/event/academic-resource-attempt'; //Ej: /user

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
    routerUtility.post(app, _route, '/attempt', this.instanceController.attempt, [{ middleware: 'academic-resource-attempt', method: 'attempt', dir: 'events/activity/academicResource' }], ['auth'])
    routerUtility.post(app, _route, '/enable/:id', this.instanceController.enableAttempt, [], ['auth'])
    // @end
  }
}

export const academicResourceAttemptRoute = new AcademicResourceAttemptRoute();
export { AcademicResourceAttemptRoute as DefaultEventsActivityAcademicResourceAcademicResourceAttemptRoute };
