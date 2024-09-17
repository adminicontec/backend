// @import_dependencies_node Import libraries
// @end

// @import_controller Import controller
import { DefaultAdminCertificateQueueCertificateQueueController as Controller } from "@scnode_app/controllers/default/admin/certificateQueue/certificateQueueController";
// @end

// @import_utilities Import utilities
import { routerUtility } from "@scnode_core/utilities/routerUtility";
// @end

class CertificateQueueRoute {

  private router_prefix: string = '/admin/certificatequeue'; //Ej: /user

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
    routerUtility.get(app, _route, '/', this.instanceController.list, [], ['auth'])
    routerUtility.post(app, _route, '/create', this.instanceController.create, [{ middleware: 'certificateQueue', method: 'create', dir: 'admin/certificateQueue' }], ['auth'])
		routerUtility.post(app, _route, '/update/:id', this.instanceController.update, [], ['auth'])
		routerUtility.post(app, _route, '/fetchByStatus', this.instanceController.fetchByStatus, [], ['auth'])
		routerUtility.post(app, _route, '/fetch-certificate-generated-by-month', this.instanceController.certificateGeneratedByMonth, [], ['auth'])
    routerUtility.delete(app, _route, '/delete/:id', this.instanceController.delete, [], ['auth'])
    routerUtility.post(app, _route, '/process-certificate', this.instanceController.processCertificate, [], ['auth'])
    routerUtility.post(app, _route, '/check-pending-certifications-with-payment', this.instanceController.checkPendingCertificationsWithPayment, [], ['auth'])
    routerUtility.post(app, _route, '/certificate-payment', this.instanceController.certificatePayment,[],['auth']);

    //
    // @end
  }
}

export const certificateQueueRoute = new CertificateQueueRoute();
export { CertificateQueueRoute as DefaultAdminCertificateQueueCertificateQueueRoute };
