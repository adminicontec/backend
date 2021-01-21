// @import_dependencies_node Import libraries
import { Request, Response, NextFunction } from 'express';
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

// @import_config_files
import { server_access_control } from '@scnode_core/config/globals';
// @end

class SecurityMiddleware {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = (req: Request, res: Response, next: NextFunction) => {
        next();
    }
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite verificar si un usuario tiene acceso a un metodo en particular
   * @param req Objeto de clase Express
   * @param res Objeto de clase Express
   * @param next Objeto de clase Express
   * @returns
   */
  public accessRestriction = (req: Request, res: Response, next: NextFunction) => {

    const json_permissions = require('@scnode_resources/security/permissions.json'); // Leyendo archivo que relaciona permisos y rutas

    let access     = true;
    const route_path = req.route.path;  // Ruta original de la peticion

    if (json_permissions && typeof json_permissions === 'object' && Object.keys(json_permissions).length > 0) {
      if (json_permissions.hasOwnProperty(route_path) && Object.keys(json_permissions[route_path]).length > 0) { // Si la ruta tiene permisos
        access = false;
        const user = req.user;
        if (user['is_super_admin'] === true) {
          access = true;
        } else {
          if (user.hasOwnProperty('permissions') && user['permissions'].length > 0) {
            for (const key in json_permissions[route_path]) {
              if (json_permissions[route_path].hasOwnProperty(key)) {
                const element = json_permissions[route_path][key];
                if (user['permissions'].indexOf(element) !== -1) {
                  access = true;
                }
              }
            }
          }
        }
      }
    }

    if (access === true) {
      next();
    } else {
      return responseUtility.buildResponseFailed('http',res,{error_key: "auth.access_denied"});
    }
  }

  /**
   * Metodo que permite verificar si un usuario tiene acceso al servidor
   * @param req Objeto de clase Express
   * @param res Objeto de clase Express
   * @param next Objeto de clase Express
   * @returns
   */
  public serverAccessControl = (req: Request, res: Response, next: NextFunction) => {

    let access = true;

    if (server_access_control.hasOwnProperty('valid_ips') && Array.isArray(server_access_control['valid_ips']) && server_access_control['valid_ips'].length > 0) {

      access = false;

      const client_ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

      server_access_control['valid_ips'].map((value, index) => {
        if (value.hasOwnProperty('ip')) {
          if (client_ip.indexOf(value['ip']) !== -1) {
            access = true;
          }
        }
      })
    }

    if (access === true) {
      next();
    } else {
      return responseUtility.buildResponseFailed('http',res,{error_key: "auth.access_denied"});
    }
  }

}

export const securityMiddleware = new SecurityMiddleware();
export { SecurityMiddleware }
