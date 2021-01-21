// @import_dependencies_node Import libraries
import { Request, Response, NextFunction } from 'express';
// @end

// @import utilities
import {i18nUtility} from '@scnode_core/utilities/i18nUtility'
// @end

// @import_config_files Import config files
import { default_language } from "@scnode_core/config/globals";
// @end

class LocaleMiddleware {

  constructor() {
  }
  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    //La estructura de un metodo debe ser la siguiente:
    public methodName = (req: Request, res: Response, next: NextFunction) => {
        next();
    }
  /*======  End of Estructura de un metodo  =====*/

  /**
   * Metodo que permite leer el header Accept-language y fijar su valor como idioma del sistema para la Internacionalizacion (i18n)
   * @param req Objeto de clase Request de express
   * @param res Objeto de clase Response de express
   * @param next Objeto de clase NextFunction de express
   */
  public setLocaleApp = async (req: Request, res: Response, next: NextFunction) => {
    if (req.headers["accept-language"]) {
      i18nUtility.setLocale(req.headers["accept-language"])
    } else {
      i18nUtility.setLocale(default_language)
    }

    next();
  }
}

export { LocaleMiddleware }
