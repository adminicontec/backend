// @import_dependencies_node Import libraries
import { Response } from 'express';
// @end

// @import_messages Import messages
import errors from '@scnode_app/resources/responses/errors';
import success from '@scnode_app/resources/responses/success';
import errors_core from '@scnode_core/resources/responses/errors';
import success_core from '@scnode_core/resources/responses/success';
// @end

// @import_utilities Import utilities
import { i18nUtility } from "@scnode_core/utilities/i18nUtility";
// @end

type ResponseFormat = "json" | "http";

type MessageKeyStructure = {key: string, params?: {}} | string; // Mensaje a enviar como cadena de texto u objeto. Si es un objeto es posible proporcionar los parametros que seran pasados a la internacionalizacion

type StructureEndResponse = {
    status      : string,                // Cadena de texto que establece el estado de la respuesta
    status_code?: string,                // Identificador del codigo de estado
    message?    : MessageKeyStructure,   // Mensaje a enviar como cadena de texto u objeto. Si es un objeto es posible proporcionar los parametros que seran pasados a la internacionalizacion
    code?       : number                 // Codigo numerico HTTP de la peticion
};

type StructureResponse = {
    status?               : string                 // Cadena de texto que establece el estado de la respuesta
    status_code?          : string,                // Identificador del codigo de estado
    message?              : MessageKeyStructure,   // Mensaje a enviar como cadena de texto u objeto. Si es un objeto es posible proporcionar los parametros que seran pasados a la internacionalizacion
    code?                 : number,                // Codigo numerico HTTP de la peticion
    error_key?            : MessageKeyStructure,   // Mensaje de error a enviar como cadena de texto u objeto. Si es un objeto es posible proporcionar los parametros que seran pasados a la internacionalizacion
    success_key?          : MessageKeyStructure,   // Mensaje de satisfacción a enviar como cadena de texto u objeto. Si es un objeto es posible proporcionar los parametros que seran pasados a la internacionalizacion
    additional_parameters?: {}                     // Objeto de parametros adicionales
};

class ResponseUtility {

    /*===============================================
    =            Estructura de un metodo            =
    ================================================
        // La estructura de un metodo debe ser la siguiente:
        public methodName = () => {}
    /*======  End of Estructura de un metodo  =====*/

    /**
     * Metodo que envia una respuesta desde un objeto
     * @param res Objeto de tipo Response de express o null
     * @param [object] Objeto a enviar en la peticion
     * @returns  [response] Respuesta HTTP de clase Response
     */
    public sendResponseFromObject = (res: Response, object: any = {}) => {
        const code = (object.hasOwnProperty('code')) ? object['code'] : 500;
        if (res.token) object.token = res.token
        return res.status(code).send(object);
    }

    /**
     * Metodo que construye una respuesta positiva por parte del sistema
     * @param response Tipo de respuesta que se puede construir: json - En formato JSON, http - respuesta de tipo Response
     * @param [res] Objeto de tipo Response de express o null
     * @param [structure] Estructura de la respuesta a construir
     * @returns  [json | response] Objeto en formato JSON | HTTP de clase Response
     */
    public buildResponseSuccess = (response: ResponseFormat , res: Response | null = null, structure?: StructureResponse) => {
        let response_default: ResponseFormat = "json";
        let structure_default = {
            'status'     : 'success',
            'status_code': 'success',
            'message'    : 'success',
            'code'       : 200
        };

        if (response == 'json' || response == 'http') response_default = response;
        if (typeof structure === 'undefined') structure = structure_default;

        return this.buildResponse(response_default, res, structure_default, structure);
    }

    /**
     * Metodo que construye una respuesta negativa por parte del sistema
     * @param response Tipo de respuesta que se puede construir: json - En formato JSON, http - respuesta de tipo Response
     * @param [res] Objeto de tipo Response de express o null
     * @param [structure] Estructura de la respuesta a construir
     * @returns  [json | response] Objeto en formato JSON | HTTP de clase Response
     */
    public buildResponseFailed = (response: ResponseFormat , res: Response | null = null, structure?: StructureResponse) => {
        let response_default: ResponseFormat = "json";
        let structure_default = {
            'status': 'error'
        };

        const errors_response = errors_core();
        let structure_fail_request = errors_response.fail_request;

        Object.assign(structure_default, structure_fail_request);

        if (response == 'json' || response == 'http') response_default = response;
        if (typeof structure === 'undefined') structure = structure_default;

        return this.buildResponse(response_default, res, structure_default, structure);
    }

    /**
     * Metodo que construye una respuesta estandar del sistema
     * @param response Tipo de respuesta que se puede construir: json - En formato JSON, http - respuesta de tipo Response
     * @param [res] Objeto de tipo Response de express o null
     * @param [structure_default] Estructura por defecto que asigna el sistema segun el tipo de respuesta
     * @param [structure] Estructura de la respuesta a construir
     * @returns  [json | response] Objeto en formato JSON | HTTP de clase Response
     */
    private buildResponse = (response: ResponseFormat, res: Response | null = null, structure_default: StructureEndResponse, structure: StructureResponse) => {

        if (structure.hasOwnProperty('error_key') || structure.hasOwnProperty('success_key')) {

            let messages_response = {};
            let messages_local    = {};
            let structure_option  = null;

            if (structure.hasOwnProperty('error_key')) {
                messages_response = errors_core();
                messages_local    = errors();
                structure_option = structure.error_key;
            } else {
                messages_response = success_core();
                messages_local    = success();
                structure_option  = structure.success_key;
            }

            Object.assign(messages_response, messages_local);

            const key_structure  = this.searchKeyResponse(structure_option);
            const params_message = this.getParamsResponse(structure_option);

            if (key_structure) {
                const search_in_json = this.searchInJsonRecursive(key_structure,messages_response);
                if (typeof search_in_json === "object") {
                    const key = search_in_json;
                    structure_default = this.composeStructureResponse(structure_default,key,false);
                }
            }

            structure_default.message = i18nUtility.parseParamsToMessage(structure_default.message,params_message);

        } else {
            structure_default = this.composeStructureResponse(structure_default,structure,true);
        }

        if (structure.hasOwnProperty('additional_parameters')) {
            Object.assign(structure_default, structure.additional_parameters);
        }

        if (response === 'json') {
            return structure_default;
        } else {
            if (res.token) {
                structure_default['token'] = res.token
            }
            return res.status(structure_default.code).send(structure_default);
        }
    }

    /**
     * Metodo que identifica cual es la clave del mensaje que debe mostrarse al usuario
     * @param key_structure Estructura del mensaje
     * @returns [string] Cadena de texto
     */
    private searchKeyResponse = (key_structure: MessageKeyStructure) => {
        let key = null;
        if (typeof key_structure == 'object') {
            if (key_structure.hasOwnProperty('key')) {
                key = key_structure.key;
            }
        } else {
            key = key_structure;
        }

        return key;
    }

    /**
     * Metodo que extrae los parametros asociados al mensaje
     * @param key_structure Estructura del mensaje
     * @returns [object] Objeto en formato JSON con los parametros | null
     */
    private getParamsResponse = (key_structure: MessageKeyStructure) => {
        let params_message = null;
        if (typeof key_structure == 'object') {
            if (key_structure.hasOwnProperty('params')) {
                params_message = key_structure.params;
            }
        }

        return params_message;
    }

    /**
     * Metodo que busca (objectNotation) dentro de un objeto JSON la estructura proporcionada (EJ: key_one.key_two... | key_one)
     * @param key_message Cadena de texto separada por . que se desea buscar dentro de un objeto JSON
     * @param json Objeto JSON sobre el cual se desea buscar
     * @returns [json] Objeto JSON que contiene el valor encontrado | undefined
     */
    private searchInJsonRecursive(key_message: string, json: any = {}) {
        const key_arr  = key_message.split('.');
        let json_aux = json;
        let found    = true;
        let response = undefined;

        for (const key in key_arr) {
            if (key_arr.hasOwnProperty(key)) {
                const element = key_arr[key];
                if (json_aux.hasOwnProperty(element)) {
                    json_aux = json_aux[element];
                } else {
                    found = false;
                }
            }
        }

        if (found === true) {
            if (json_aux.hasOwnProperty('status') || json_aux.hasOwnProperty('status_code') || json_aux.hasOwnProperty('message') || json_aux.hasOwnProperty('code')) {
                response = json_aux;
            }
        }

        return response;
    }

    /**
     * Metodo que asigna propiedades a un objeto de respuesta del sistema
     * @param structure_default Estructura por defecto que asigna el sistema segun el tipo de respuesta
     * @param structure Estructura de la respuesta a construir
     * @param translate Identifica si el mensaje debe ser internacionalizado o no
     * @returns [json] Objeto en formato JSON
     */
    private composeStructureResponse = (structure_default: StructureEndResponse, structure: StructureResponse, translate: true | false) => {
        if (structure.hasOwnProperty('status_code')) structure_default.status_code = structure.status_code;
        if (structure.hasOwnProperty('message')) {
            if (translate === true) {
                const key_structure = this.searchKeyResponse(structure.message);
                const params_message = this.getParamsResponse(structure.message);
                if (key_structure) {
                    structure_default.message = i18nUtility.parseParamsToMessage(i18nUtility.__(key_structure),params_message);
                }
            } else {
                structure_default.message = structure.message;
            }
        }
        if (structure.hasOwnProperty('code')) structure_default.code = structure.code;
        return structure_default;
    }

}

export const responseUtility = new ResponseUtility();
export { ResponseUtility }
