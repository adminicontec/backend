// @import_dependencies_node Import libraries
// @end

// @import_controller Import controller
import { DefaultAdminAcademicContentQuestionsQuestionController as Controller } from "@scnode_app/controllers/default/admin/academicContent/questions/questionController";
// @end

// @import_utilities Import utilities
import { routerUtility } from "@scnode_core/utilities/routerUtility";
// @end

class QuestionRoute {

  private router_prefix: string = '/admin/question'; //Ej: /user

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
    routerUtility.post(app, _route, '/create', this.instanceController.create, [{ middleware: 'question', method: 'create', dir: 'admin/academicContent/questions' }, {middleware: 'question', method: 'validate-category', dir: 'admin/academicContent/questions'}], ['auth'])
		routerUtility.post(app, _route, '/update/:id', this.instanceController.update, [{middleware: 'question', method: 'validate-category', dir: 'admin/academicContent/questions'}], ['auth'])
		routerUtility.delete(app, _route, '/delete/:id', this.instanceController.delete, [{middleware: 'question', method: 'validate-category', dir: 'admin/academicContent/questions'}], ['auth'])
    routerUtility.get(app, _route, '/', this.instanceController.list, [], ['auth'])
    routerUtility.get(app, _route, '/:id', this.instanceController.get, [], ['auth'])
    // @end
  }
}

export const questionRoute = new QuestionRoute();
export { QuestionRoute as DefaultAdminAcademicContentQuestionsQuestionRoute };
