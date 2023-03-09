// @import_dependencies_node Import libraries
// @end

// @import_controller Import controller
import { DefaultEventsAcademicContentSurveySurveyEventController as Controller } from "@scnode_app/controllers/default/events/academicContent/survey/surveyEventController";
// @end

// @import_utilities Import utilities
import { routerUtility } from "@scnode_core/utilities/routerUtility";
// @end

class SurveyEventRoute {

  private router_prefix: string = '/event/survey'; //Ej: /user

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
    routerUtility.get(app, _route, '/check-survey-available/:moodle_id', this.instanceController.checkSurveyAvailable, [], ['auth'])
    routerUtility.get(app, _route, '/get-available-user-surveys', this.instanceController.getAvailableUserSurveys, [], ['auth'])
    // @end
  }
}

export const surveyEventRoute = new SurveyEventRoute();
export { SurveyEventRoute as DefaultEventsAcademicContentSurveySurveyEventRoute };
