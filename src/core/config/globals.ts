// @import_dependencies_node Import libraries
// import path from "path";
// import * as ejs from "ejs";
// import { promisify } from "util";
import mongoose from "mongoose";
// @end

// @import_config_files Import config files
import * as env from "@scnode_config/env.json";
// @end

// @import services
import {ormService} from '@scnode_core/services/default/orm/ormService'
// @end

// @import_utilities
import { sequelizeUtility } from "@scnode_core/utilities/sequelizeUtility";
// import { i18nUtility } from "@scnode_core/utilities/i18nUtility";
// @end

// @export_globals_env
export const environment      = (env.hasOwnProperty('environment')) ? env['environment'] : 'prod';
export const host             = (env.hasOwnProperty('host')) ? env['host'] : null;
export const public_dir       = (env.hasOwnProperty('public_dir')) ? env['public_dir'] : 'public';
export const use_ssl          = (env.hasOwnProperty('ssl')) ? env['ssl'] : false;
export const default_language = (env.hasOwnProperty('default_language')) ? env['default_language'] : "es";
// export const public_dir: string             = (env.hasOwnProperty('public_dir')) ? env['public_dir'] : '/';
// export const uploads_dir: string            = (env.hasOwnProperty('uploads_dir')) ? env['uploads_dir'] : '/uploads';
export const server_port                    = (env.hasOwnProperty('server_port')) ? env['server_port'] : 3000;
export const jwt_secret                     = (env.hasOwnProperty('jwt_secret') && env["jwt_secret"].hasOwnProperty("local")) ? env['jwt_secret']["local"] : 'E4nH1weh5Tqp9WoVjLk8';
export const jwt_exp                        = {
    amount: (env.hasOwnProperty('jwt_exp') && env["jwt_exp"].hasOwnProperty('amount')) ? env['jwt_exp']["amount"]: 30,
    unity : (env.hasOwnProperty('jwt_exp') && env["jwt_exp"].hasOwnProperty('unity')) ? env['jwt_exp']["unity"]  : "days",
}
export const driver                = (env.hasOwnProperty('database') && env['database'].hasOwnProperty('driver')) ? env['database']['driver'] : null;
export const connection_data       = (driver && env['database'].hasOwnProperty(driver)) ? env['database'][driver] : {};
export const aws_config            = (env.hasOwnProperty('aws')) ? env['aws'] : {};
export const google_config         = (env.hasOwnProperty('google')) ? env['google'] : {};
export const ftp_config            = (env.hasOwnProperty('ftp')) ? env['ftp'] : {};
export const mailer                = (env.hasOwnProperty('mailer')) ? env['mailer'] : {};
export const attached              = (env.hasOwnProperty('attached')) ? env['attached'] : {};
export const external_api          = (env.hasOwnProperty('external_api')) ? env['external_api'] : {};
export const main_external_api     = (env.hasOwnProperty('main_external_api')) ? env['main_external_api'] : null;
export const server_access_control = (env.hasOwnProperty('server_access_control')) ? env['server_access_control'] : {};
export const sms_config            = (env.hasOwnProperty('sms')) ? env['sms'] : {};
export const customs               = (env.hasOwnProperty('customs')) ? env['customs'] : {};
export const socket                = (env.hasOwnProperty('socket') && env['socket'] === true) ? {io: null, instance: null} : null;
export const i18n_config           = (env.hasOwnProperty('i18n_config')) ? env['i18n_config'] : null;
// export const i18n_global           = i18nUtility
export const pdf_config    = (env.hasOwnProperty('pdf')) ? env['pdf'] : null;
export const xlsx_config           = (env.hasOwnProperty('xlsx')) ? env['xlsx'] : null
export const router_prefix = (env.hasOwnProperty('router_prefix')) ? env['router_prefix'] : 'api';
export const moodle_setup:any         = (env.hasOwnProperty('moodle_setup')) ? env['moodle_setup'] : {};
export const campus_setup:any         = (env.hasOwnProperty('campus_setup')) ? env['campus_setup'] : {};
export const google_services = (env.hasOwnProperty('google_services')) ? env['google_services'] : {};
export const certificate_setup:any         = (env.hasOwnProperty('certificate_setup')) ? env['certificate_setup'] : {};

// @end

// @export_globals
export const dist_dir             = 'dist';
export const orm                  = ormService;
export const mongoose_global: any = mongoose;
export const Sequelize            = require('sequelize');
// export const public_dir_absolute: string    = path.resolve("./public");
// export const uploads_dir_absolute: string   = path.resolve("./public/uploads");
export const global_extension_files: string = (environment === 'prod') ? 'js' : 'ts';
// export const ejsRenderFile                = promisify(ejs.renderFile).bind(ejs);
// export const template_extension             = 'hbs';
export const sequelize                      = (driver) ? sequelizeUtility.sequelizeSetup(connection_data,driver) : null;
export const SequelizeModels                = sequelizeUtility.models();
// export var ecosystem_pm2_config = () => {
//     var is_config = false;
//     if (env.hasOwnProperty('ecosystem_pm2')) {
//         if (Array.isArray(env['ecosystem_pm2'])) {
//             if (env['ecosystem_pm2'].length > 0) {
//                 is_config = true;
//             }
//         }
//     }
//     return is_config;
// }
// @end
