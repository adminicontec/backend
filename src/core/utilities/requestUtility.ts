// @import_dependencies_node Import libraries
import { Request, Response, NextFunction } from 'express';
// @end

// @import_utilities Import utilities
import { i18nUtility } from "@scnode_core/utilities/i18nUtility";
import { fileUtility } from "@scnode_core/utilities/fileUtility";
import { generalUtility } from "@scnode_core/utilities/generalUtility";
import { responseUtility } from "@scnode_core/utilities/responseUtility";
// @end

// @import_config_files Import config files
import { global_extension_files } from "@scnode_core/config/globals";
// @end

type ValidatorRequest = {
    key                 : string,          // Nombre del campo a validar dentro de la petición
    type?               : 'email' | 'number' | 'array' | 'string' | 'boolean' | 'file' | 'object',   // Tipo campo a validar
    values_not_accepted?: string | null,   // Lista de valores que NO son aceptados para el campo. Deben separarse con el caracter "|". Ex: "empty|0|undefined"
    values_accepted?    : string | null,   // Lista de valores que son aceptados para el campo. Deben separarse con el caracter "|". Ex: "empty|0|undefined"
    required?           : boolean,         // Boleano donde TRUE significa que el campo sera requerido
    label?              : string | null,   // Identificador de internacionalización. Su valor debe encontrarse en los archivos de internacionalización.
};

class RequestUtility {

    /*===============================================
    =            Estructura de un metodo            =
    ================================================
        // La estructura de un metodo debe ser la siguiente:
        public methodName = () => {}
    /*======  End of Estructura de un metodo  =====*/

    constructor () {}

    /**
	 * Metodo que ejecuta el validador de middleware segun la configuración
	 * @param fields_config Configuración de middleware
	 * @param req Objeto de clase express
	 * @param res Objeto de clase express
	 * @param next Objeto de clase express
	 * @returns
	 */
	public middlewareValidator = async (fields_config, req: Request, res: Response, next: NextFunction) => {
		const fields_request = req.getParameters.all()
		const files_request = req.files
		const response = await this.validator(fields_request, files_request, fields_config)
		if (response.hasError === true) {
			return responseUtility.buildResponseFailed('http', res, {
				error_key: 'fields_in_request.invalid_request_fields',
				additional_parameters: { fields_status: response.fields_status },
			})
		}
		next()
	}

    // /**
    //  * Metodo que permite realizar un versionamiento a traves de servicios
    //  * @param req Objeto de clase Request express
    //  * @param res Objeto de clase Response express
    //  * @param method Metodo a ejecutar representado como cadena de texto separado por el caracter (-)
    //  * @param service Servicio a ejecutar representado como cadena de texto separado por el caracter (-)
    //  * @returns [response] Rspuesta HTTP de clase Response
    //  */
    // public versioning = async (req: Request, res: Response, method: string, service: string, dir: string = '') => {

    //     var prefix = this.getVersioningFromRequest(req);

    //     var service_response = requestUtility.serviceInstance(service,prefix,dir); // Generando instancia del servicio
    //     if (service_response.status === 'error') return responseUtility.sendResponseFromObject(res,service_response);

    //     var params = req.getParameters.all();
    //     var service_instance = service_response['service'];
    //     var method_formated  = generalUtility.upperCaseString(method, true);  // Formatear nombre del metodo a ejecutar

    //     if (typeof service_instance[method_formated] === "undefined") {
    //         return responseUtility.buildResponseFailed('http',res,{error_key: "version_in_request_invalid"});
    //     }

    //     var response = await service_instance[method_formated](params);
    //     return responseUtility.sendResponseFromObject(res,response);
    // }

    /**
     * Metodo que permite generar la instancia de un servicio de forma dinamica
     * @param service Servicio a ejecutar representado como cadena de texto separado por el caracter (-)
     * @param [version] Version a lanzar representado como cadena de texto separado por el caracter (-)
     * @returns  [json] Objeto en formato JSON con la instancia del servicio
     */
    public serviceInstance = (service: string, version: string = "default", dir: string = '') => {

        const path_service_app    = 'app/services/';
        const path_service_global = 'core/services/';
        const base_dir            = __dirname.split('core');
        const dir_path            = (dir != '') ? dir + '/' : '';

        // @INFO: Construyendo la ruta del servicio solicitado
        const service_name_formated    = generalUtility.upperCaseString(service,true);                                 // Formatear nombre del servicio
        const version_formated         = generalUtility.upperCaseString(version, true);
        const service_name             = `${service_name_formated}Service`;
        const service_name_file        = `${service_name_formated}Service.${global_extension_files}`;
        const full_path_service        = `${base_dir[0]}${path_service_app}${version_formated}/${dir_path}${service_name_file}`;
        const full_path_global_service = `${base_dir[0]}${path_service_global}${version_formated}/${dir_path}${service_name_file}`;

        let service_path = null;
        if (fileUtility.fileExists(full_path_global_service) === true) {
            service_path = full_path_global_service;
        }
        if (fileUtility.fileExists(full_path_service) === true) {
            service_path = full_path_service;
        }

        if (service_path === null) {
            return responseUtility.buildResponseFailed('json',null,{error_key: "version_in_request_invalid"});
        }

        let name_service = service_name;
        if (version !== "default") {
            name_service = generalUtility.upperCaseString(version, true, '_') + (name_service.charAt(0).toUpperCase() + name_service.slice(1));
        }

        const service_instance = require(service_path);
        return responseUtility.buildResponseSuccess('json',null,{additional_parameters: {service: service_instance[name_service]}});
    }

    /**
     * Metodo que permite generar la instancia de un middleware
     * @param middleware Middleware a ejecutar representado como una cadena de texto separada por el caracter (-)
     * @param dir Directorio interno dentro del path de middlewares donde se aloja
     * @returns  [json] Objeto en formato JSON con la instancia del middleware
     */
    public middlewareInstance = (middleware: string, dir: string = '') => {

        const path_middleware_app    = 'app/middlewares/';
        const path_middleware_global = 'core/middlewares/';
        const base_dir               = __dirname.split('core');

        if (dir !== '') dir = `${dir}/`

        // @INFO: Construyendo la ruta del middleware solicitado
        const middleware_name_formated = generalUtility.upperCaseString(middleware,true);    // Formatear nombre del middleware
        const middleware_name          = middleware_name_formated + 'Middleware';
        const middleware_name_file     = middleware_name_formated + `Middleware.${global_extension_files}`;

        const full_path_middleware        = `${base_dir[0]}${path_middleware_app}${dir}${middleware_name_file}`;
        const full_path_global_middleware = `${base_dir[0]}${path_middleware_global}${dir}${middleware_name_file}`;

        let middleware_path = null;

        if (fileUtility.fileExists(full_path_global_middleware) === true) {
            middleware_path = full_path_global_middleware;
        }

        if (fileUtility.fileExists(full_path_middleware) === true) {
            middleware_path = full_path_middleware;
        }

        if (middleware_path === null) {
            return responseUtility.buildResponseFailed('json',null,{error_key: "middleware_not_found"});
        }

        const middleware_require = require(middleware_path);
        return responseUtility.buildResponseSuccess('json',null,{additional_parameters: {middleware: middleware_require[middleware_name]}});
    }

    /**
     * Metodo que permite generar la instancia de una utilidad
     * @param utility Utilidad a ejecutar representada como una cadena de texto separada por el caracter (-)
     * @param dir Directorio interno dentro del path de utilidades donde se aloja la utilidad requerida
     * @returns  [json] Objeto en formato JSON con la instancia de la utilidad
     */
    public utilityInstance = (utility: string, dir: string = '') => {
        const path_utility_global = 'core/utilities/';
        const base_dir            = __dirname.split('core');

        // @INFO: Construyendo la ruta de la utilidad solicitada
        const utility_name_formated = generalUtility.upperCaseString(utility,true);    // Formatear nombre de la utilidad
        const utility_name          = `${utility_name_formated}Utility`;
        const utility_name_file     = `${utility_name_formated}Utility.${global_extension_files}`;

        const full_path_global_utility = `${base_dir[0]}${path_utility_global}${dir}${utility_name_file}`;

        let utility_path = null;

        if (fileUtility.fileExists(full_path_global_utility) === true) {
            utility_path = full_path_global_utility;
        }

        if (utility_path === null) {
            return responseUtility.buildResponseFailed('json',null,{error_key: "utility_not_found"});
        }

        const utility_require = require(utility_path);
        return responseUtility.buildResponseSuccess('json',null,{additional_parameters: {utility: utility_require[utility_name]}});
    }

    // /**
    //  * Metodo que obtiene la version de la peticion
    //  * @param req Objeto de clase Request express
    //  * @returns  [string] Cadena de texto con el nombre de la version
    //  */
    // public getVersioningFromRequest = (req: Request) => {

    //     var version = "default";

    //     if (req.headers["versioning"]) {
    //         version = 'v_' + req.headers["versioning"].toString();
    //     }

    //     return version;
    // }

    /**
     * Metodo que permite validar los campos proporcionados en una Request
     * @param fields_request Campos proporcionados desde la Request
     * @param files_request Adjuntos proporcionados desde la Request
     * @param fields_config_default Configuracion del validador
     * @return [json] Objeto en formato JSON con la respuesta del validador
     */
    public validator = (fields_request: any, files_request: any = null, fields_config_default: ValidatorRequest[]) => {

        let fields_request_def = {};
        let fields_config = [];

        fields_config_default.map((value, index) => {
            const config_default = {
                type               : null,
                values_not_accepted: "empty|0|undefined",
                values_accepted    : null,
                required           : true,
                label              : null
            };

            Object.assign(config_default,value);
            fields_config.push(config_default);
        });

        let fields_status = [];

        Object.assign(fields_request_def,fields_request);
        Object.assign(fields_request_def,files_request);

        for (const key in fields_config) {
            if (fields_config.hasOwnProperty(key)) {

                const element = fields_config[key];

                fields_status[key] = {
                    status: "error",
                    field: element.key,
                    reason: i18nUtility.i18nMessage("error_messages.fail_request_message")
                };

                let field = null;
                let label = element.key;
                if (element.hasOwnProperty('label') && element["label"] !== null && element["label"] !== "") {
                    label = i18nUtility.i18nMessage(element['label']);
                }

                if (fields_request_def[element.key] !== "undefined") {
                    field = fields_request_def[element.key];
                }

                if (element.hasOwnProperty('type') && element['type'] === 'boolean') {
                    element['required'] = false;
                }

                // @INFO: Validar si el campo es requerido
                if (element.hasOwnProperty('required') && element['required'] === true) {
                    if (!field || field === undefined || field === "undefined") {
                        fields_status[key].reason = i18nUtility.i18nMessage("error_messages.fields_in_request.field_required",{field: label});
                        continue;
                    }
                }

                // @INFO: Si el campo existe realizare las siguientes comprobaciones
                if (field !== undefined) {

                    // @INFO: Validar los valores no aceptados
                    let validation = this.validateValuesNotAccepted(element,field,label);
                    if (validation.status === "error") {
                        fields_status[key].reason = validation.message;
                        continue;
                    }

                    // @INFO: Validar los valores aceptados
                    validation = this.validateValuesAccepted(element,field,label);
                    if (validation.status === "error") {
                        fields_status[key].reason = validation.message;
                        continue;
                    }

                    // @INFO: Validar si el valor del campo cumple con el tipo requerido
                    validation = this.validateFieldType(element,field,label);
                    if (validation.status === "error") {
                        fields_status[key].reason = validation.message;
                        continue;
                    }
                }

                fields_status[key].status = "success";
                fields_status[key].reason = null;
            }
        }

        let hasError = false;
        fields_status.map((value) => {
            if (value.status === "error") {
                hasError = true;
            }
        });

        return {
            fields_status,
            hasError
        };
    }

    /**
     * Metodo que valida de un campo de la peticion si su valor no es aceptado
     * @param config Configuracion del validador
     * @param field Valor del campo a validar
     * @param label Identificador del campo
     * @return [json] Objeto en formato JSON
     */
    private validateValuesNotAccepted = (config, field, label) => {

        let status = "success";
        let message    = null;

        if (config.hasOwnProperty('type') && config['type'] === 'boolean') {
        } else if (config.hasOwnProperty('values_not_accepted') && config["values_not_accepted"] !== null && config["values_not_accepted"] !== "") {
            const values_not_accepted_arr = config["values_not_accepted"].split('|');
            values_not_accepted_arr.forEach((val, index, array) => {
                let value_not_accepted = val;
                let value_not_accepted_message = val;
                if (val == "empty") {
                    value_not_accepted = "";
                    value_not_accepted_message = i18nUtility.i18nMessage("empty");
                }

                if (field == value_not_accepted) {
                    message = i18nUtility.i18nMessage("error_messages.fields_in_request.field_value_invalid",{field: label, value: value_not_accepted_message});
                    status = "error";
                }
            });
        }

        return {
            status: status,
            message: message
        }
    }

    /**
     * Metodo que valida de un campo de la peticion si su valor es aceptado
     * @param config Configuracion del validador
     * @param field Valor del campo a validar
     * @param label Identificador del campo
     * @return [json] Objeto en formato JSON
     */
    private validateValuesAccepted = (config, field, label) => {
        let status  = "success";
        let message = null;

        if (config.hasOwnProperty('values_accepted') && config["values_accepted"] !== null && config["values_accepted"] !== "") {
            const values_accepted_arr = config["values_accepted"].split('|');

            if (values_accepted_arr.indexOf(field) === -1) {
                const values_accepted = values_accepted_arr.join(',');
                message = i18nUtility.i18nMessage("error_messages.fields_in_request.field_value_only_accepted",{field: label, values_accepted: values_accepted});
                status = "error";
            }
        }

        return {
            status: status,
            message: message
        }
    }

    /**
     * Metodo que valida de un campo de la peticion si su valor es del tipo requerido y cumple con el formato correcto
     * @param config Configuracion del validador
     * @param field Valor del campo a validar
     * @param label Identificador del campo
     * @return [json] Objeto en formato JSON
     */
    private validateFieldType = (config, field, label) => {
        let status  = "success";
        let message = null;

        if (config.hasOwnProperty('type') && config["type"] !== null && config["type"] !== "") {
            const field_type = config["type"];
            switch(field_type) {
                case "email": {
                    const reg = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
                    if (reg.test(field) == false) {
                        message = i18nUtility.i18nMessage("error_messages.fields_in_request.field_value_type_invalid.email",{field: label});
                        status = "error";
                    }
                    break;
                }
                case "number": {
                    if (isNaN(field) === true) {
                        message = i18nUtility.i18nMessage("error_messages.fields_in_request.field_value_type_invalid.number",{field: label});
                        status = "error";
                    }
                    break;
                }
                case "array": {
                    if (!Array.isArray(field)) {
                        message = i18nUtility.i18nMessage("error_messages.fields_in_request.field_value_type_invalid.array",{field: label});
                        status = "error";
                    }
                    break;
                }
                case "string": {
                    if (typeof field !== 'string') {
                        message = i18nUtility.i18nMessage("error_messages.fields_in_request.field_value_type_invalid.string",{field: label});
                        status = "error";
                    }
                    break;
                }
                case 'boolean': {
                    if (typeof field !== 'boolean') {
                        message = i18nUtility.i18nMessage("error_messages.fields_in_request.field_value_type_invalid.boolean",{field: label});
                        status = "error";
                    }
                }
                case 'file': {
                    let isFile = true;
                    if (typeof field !== 'object') {
                       isFile = false;
                    } else {
                        if (!field.hasOwnProperty('mv')) {
                            isFile = false;
                        } else if (typeof field['mv'] !== 'function') {
                            isFile = false;
                        }
                    }

                    if (isFile === false) {
                        message = i18nUtility.i18nMessage("error_messages.fields_in_request.field_value_type_invalid.file",{field: label});
                        status = "error";
                    }
                }
                case 'object': {
                    if (typeof field !== 'object') {
                        message = i18nUtility.i18nMessage("error_messages.fields_in_request.field_value_type_invalid.object",{field: label});
                        status = "error";
                    }
                }
            }
        }

        return {
            status : status,
            message: message
        }
    }
}

export const requestUtility = new RequestUtility();
export { RequestUtility, ValidatorRequest }
