// @import_dependencies_node Import libraries
import rp from "request-promise";
// @end

// @import_utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

// @import types
import {HttpStructure, OptionsRequestPromise} from "@scnode_core/types/default/query/httpTypes"
const https = require('https');
// @end

class HttpClientUtility {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  private httpsAgent = undefined;
  constructor() {
    this.httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });
  }

  /**
   * Metodo que envia peticiones HTTP por el metodo GET
   * @param http_structure Configuracion del punto destino hacia el cual se va a generar la peticion
   * @returns [json] Objeto en formato JSON
   */
  public get = async (http_structure: HttpStructure) => {

    const options: OptionsRequestPromise = {
      qs: (http_structure.hasOwnProperty("params") && typeof http_structure["params"] === "object") ? http_structure["params"]: {},   // Parametros que se envian al metodo destino
    };

    return this.sendHttpRequest(http_structure, options);
  }

  /**
   * Metodo que envia peticiones HTTP por el metodo POST
   * @param http_structure Configuracion del punto destino hacia el cual se va a generar la peticion
   * @returns [json] Objeto en formato JSON
   */
  public post = async (http_structure: HttpStructure) => {
    const params = (http_structure.hasOwnProperty("params") && (typeof http_structure["params"] === "object" || typeof http_structure["params"] === "string")) ? http_structure["params"]: {};   // Parametros que se envian al metodo destino
    let options: OptionsRequestPromise
    if (http_structure.hasOwnProperty("sendBy") && http_structure.sendBy === 'body'){
      options = {
        method: 'POST',
        body  : params
      };
    }else{
      options = {
          method: 'POST',
          form  : params
      };
    }
    return this.sendHttpRequest(http_structure, options);
  }

  /**
   * Metodo que envia una peticion HTTP
   * @param http_structure Configuracion del punto destino hacia el cual se va a generar la peticion
   * @param options_method Opciones de configuracion de la peticion provistas desde el metodo HTTP
   * @returns  [json] Objeto en formato JSON
   */
  private sendHttpRequest = async (http_structure: HttpStructure, options_method: OptionsRequestPromise) => {

    let http_structure_default: HttpStructure = {
      api    : "",
      url    : "",
      params : {},
      headers: {}
    };

    Object.assign(http_structure_default,http_structure);

    const validation: any = await this.validateHttpFields(http_structure_default);
    if (validation.status === "error") return validation;

    const uri = `${http_structure_default.api}${http_structure_default.url}`;

    let options = {
      uri    : uri,
      json   : true,
      headers: {},
      httpsAgent: this.httpsAgent,
      strictSSL: false
    };

    Object.assign(options,options_method);

    if (http_structure.hasOwnProperty('headers') && typeof http_structure['headers'] === 'object') {
      Object.assign(options.headers,http_structure['headers']);
    }

    if (http_structure.hasOwnProperty('req') && typeof http_structure['req'] === 'object') {
      if (http_structure["req"].hasOwnProperty("token")) {
        options.headers["Authorization"] = http_structure["req"]["token"];
      }

      if (typeof http_structure['req']['getLocale'] === "function") {
        options.headers["Accept-Language"] = http_structure['req']['getLocale']();
      }
    }

    return rp(options)
    .then((response) => {
      return response;
    })
    .catch((err) => {
      return this.processErrorResponse(err);
    });
  }

  /**
   * Metodo que valida los parametros de configuracion de la peticion
   * @param http_structure Configuracion del punto destino hacia el cual se va a generar la peticion
   * @returns [json] Objeto en formato JSON
   */
  private validateHttpFields = async (http_structure: HttpStructure) => {

    const fields_config = [
      {key: "api"}
    ];

    const validation = await requestUtility.validator(http_structure,{},fields_config);
    if (validation.hasError === true) return responseUtility.buildResponseFailed('json',null,{error_key: "fields_in_request.invalid_request_fields",additional_parameters: {fields_status: validation.fields_status}});

    return responseUtility.buildResponseSuccess('json',null);
  }

  /**
   * Metodo que procesa y convierte los errores de una peticion HTTP
   * @param err Objeto error generado por la libreria RequestPromise
   * @returns  [json] Objeto en formato JSON
   */
  private processErrorResponse = (err) => {
    console.log('HTTP:ERROR', err)
    if (err.error) {
      if (typeof err.error === 'object') {
        const error = err.error;
        if (error.hasOwnProperty('status') && error.hasOwnProperty('status_code') && error.hasOwnProperty('code')) { // KET Response
            return error;
        } else { // RequestPromise response
            return responseUtility.buildResponseFailed('json',null);
        }
      }
    }

    return responseUtility.buildResponseFailed('json',null);
  }
}

export const httpClientUtility = new HttpClientUtility();
export { HttpClientUtility, OptionsRequestPromise, HttpStructure }

