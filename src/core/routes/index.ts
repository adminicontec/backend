// @import_dependencies_node Import libraries
import {Request, Response} from "express";
// @end

// @import_utilities Import Utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { securityUtility } from "@scnode_core/utilities/securityUtility";
// @end

// @import_config_files Import config files
import { environment, router_prefix } from "@scnode_core/config/globals";
// @end

export class Routes {

  private router_prefix = `/${router_prefix}`;

  /**
   * Metodo que se encarga de generar las rutas del servidor
   * @param app Instancia de servidor Express
   */
  public async routes(app) {

    // @pre_build_routes
    await securityUtility.buildJsonPermissions(); // Reconstruye el archivo de configuración de permisos por ruta
    // @end

    // @add_general_routes General Routes
    app.route('/')
    .get((req: Request, res: Response) => {
      return responseUtility.buildResponseSuccess('http',res,{success_key: "framework_default_success"});
    });
    // @end

    // @init_routes_by_clasess
    const _routes = require('../../app/routes').routes;
    for (const key in _routes) {
      if (_routes.hasOwnProperty(key)) {
        const element = _routes[key];
        element.routes(app,this.router_prefix);
      }
    }
    // @end

    // @404_error - Route not found
    app.use(function(req, res, next) {
      return responseUtility.buildResponseFailed('http',res,{error_key: "http.404"});
    });
    // @end

    // @500_error - Any server error
    app.use(function(err, req, res, next) {
      if (environment === 'dev') console.log(err);
      return responseUtility.buildResponseFailed('http',res,{error_key: "http.505"});
    });
    // @end

    // @post_build_routes
    // @end
  }
}
