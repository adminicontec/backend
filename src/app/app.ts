// @import_dependencies_node Import libraries
import express from "express";
import cors from "cors";
import * as bodyParser from "body-parser";
import fileUpload from "express-fileupload";
import expressLayouts from "express-ejs-layouts";
import logger from "morgan";
// @end

// @import_routes Import routes
import { Routes } from "@scnode_core/routes";
// @end

// @import_middlewares Import middleware
import { LocaleMiddleware } from "@scnode_core/middlewares/localeMiddleware";
import { RequestParamsMiddleware } from "@scnode_core/middlewares/requestParamsMiddleware";
// @end

// @import services
import { ormService } from "@scnode_core/services/default/orm/ormService";
// @end

// @import_utilities Import utilities
import { i18nUtility } from "@scnode_core/utilities/i18nUtility";
// @end

// @import_config_files Import config files
import { environment } from "@scnode_core/config/globals";
// @end

class App {

  // @initialize_vars
  public app: express.Application = express();
  public routePrv: Routes         = new Routes();
  // @end

  // @initialize_middleware Initialize middlewares: Example: public classMiddleware: ClassMiddleware = new ClassMiddleware();
  public localeMiddleware: LocaleMiddleware               = new LocaleMiddleware();
  public requestParamsMiddleware: RequestParamsMiddleware = new RequestParamsMiddleware();
  // @end

  constructor() {
    // @launch_constructor Inicia el constructor del APP
    this.config();
    this.routePrv.routes(this.app);
    ormService.initConfigDb();
    // @end
  }

  /**
   * Metodo que inicializa el servidor y su configuracion
   */
  private config = async () => {

    // @set_proxy
    this.app.set('trust proxy', true);
    // @end

    // @set_cors_config
    this.app.use(cors());
    // @end

    // @init_i18n Iniciando internacionalizacion
    i18nUtility.initConfigI18n();
    // @end

    // @set_engine_views Set engine views
    this.app.set('view engine', 'ejs');
    this.app.use(expressLayouts);
    // @end

    // @set_logger
    if (environment === 'dev') {
        this.app.use(logger('dev'));
    }
    // @end

    // @support_application
    this.app.use(bodyParser.json()); // support application/json type post data
    this.app.use(bodyParser.urlencoded({ extended: false })); // support application/x-www-form-urlencoded post data
    // @end

    // @serving_static_files serving static files
    this.app.use(express.static('public'));
    // @end

    // @init_middlewares
    this.app.use(fileUpload()); //Middleware para carga de adjuntos
    this.app.use(this.localeMiddleware.setLocaleApp); // Middleware de internacionalización
    this.app.use(this.requestParamsMiddleware.addMethodToRequest); // Middleware para formatear parametros de una peticion
    // @end
  }
}

export default new App().app;
