// @import_dependencies_node Import libraries
// @end

// @import_utilities Import utilities
import { queryUtility } from "@scnode_core/utilities/queryUtility";
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from '@scnode_core/utilities/requestUtility';
// @end

// @import types
import {SmsOptions, SmsSmsmasivosConfig, SmsSmsmasivosConectionsConfig} from '@scnode_core/types/default/sms/smsTypes'
import {HttpCustomStructure} from '@scnode_core/types/default/query/httpTypes'
// @end

// @import_services
// @end

class SmsSmsmasivosUtility {

  private api_url_v1     = 'https://app.smsmasivos.com.mx'
  private auth_method_v1 = null
  private url_method_v1  = '/components/api/api.envio.sms.php'

  private api_url_v2     = 'https://api.smsmasivos.com.mx'
  private auth_method_v2 = '/auth'
  private url_method_v2  = '/sms/send'

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () { }

  public getApiUrl( version: String  = "1") {
    if (version === "1"){
      return this.api_url_v1;
    } else {
      return this.api_url_v2;
    }
  }

  private getUrlMethod( version: String  = "1" ) {
    if (version === "1") {
      return this.url_method_v1;
    } else {
      return this.url_method_v2;
    }
  }

  private getAuthMethod( version: String  = "1" ) {
    if (version === "1"){
      return this.auth_method_v1;
    } else {
      return this.auth_method_v2;
    }
  }


  /**
   * Metodo que genera las opciones por defecto del sms
   * @returns
   */
  public buildConfigSms = () => {
    const config: SmsSmsmasivosConfig = {
      default_conection: 'default',
      conections: [{
        key: 'default',
        api_key: '',
        version: 1
      }],
    };
    return config;
  }


  /**
   * Metodo que verifica si los campos requeridos estan presentes en la configuración
   * @param config Configuración
   * @returns
   */
  public checkFieldsRequired = async (config: SmsSmsmasivosConfig) => {
    const fields_config = [
      {key: "conections"},
      {key: "default_conection"}
    ];

    const validation = await requestUtility.validator(config,{},fields_config);
    if (validation.hasError === true) return responseUtility.buildResponseFailed('json',null,{error_key: "sms.configuration_invalid"});

    return responseUtility.buildResponseSuccess('json',null);
  }

  /**
   * Metodo que permite enviar un SMS
   * @param config Configuración
   * @param sms_options_default Objeto con los parámetros para envio de SMS
   * @returns  [response] Respuesta del envio de sms
   */
  public sendSms = async (config: SmsSmsmasivosConfig, sms_options_default: SmsOptions) => {

    let default_conection_data = (config.conections && Array.isArray(config.conections) ) ? config.conections[0] : null

    if (config.default_conection && config.conections && Array.isArray(config.conections) ){
      for (var i = config.conections.length - 1; i >= 0; i--) {
        if (config.conections[i].hasOwnProperty("key")){
          if (config.conections[i].key === config.default_conection ){
            default_conection_data = config.conections[i]
          }
        }
      }
    }

    if (default_conection_data === null) return responseUtility.buildResponseFailed('json',null,{error_key: "sms.configuration_invalid"});

    let version_api = "1";
    if (default_conection_data.hasOwnProperty('version')){
      version_api = default_conection_data.version.toString();
    }

    if (typeof  this["sendSmsV"+version_api] === "undefined") {
      return responseUtility.buildResponseFailed('json',null,{error_key: "sms.configuration_invalid"});
    }

    const version_intance = this["sendSmsV"+version_api](default_conection_data, sms_options_default)

    return version_intance
  }

  /**
   * Metodo que permite enviar un SMS por la versión 1 del API
   * @param default_conection_data Configuración
   * @param sms_options_default Objeto con los parámetros para envio de SMS
   * @returns  [response] Respuesta del envio de sms
   */
  private sendSmsV1 = async (default_conection_data: SmsSmsmasivosConectionsConfig, sms_options_default: SmsOptions) => {
    const api_key = default_conection_data.api_key;

    const params_send = {
      apikey : api_key,
      numcelular : sms_options_default.number,
      numregion  : sms_options_default.country_code,
      mensaje : sms_options_default.message.toString()
    }

    const query: HttpCustomStructure = {
      method   : 'post',
      url      :  this.getUrlMethod(),
      api_link :  this.getApiUrl(),
      params   : params_send
    }

    const response_sms = await queryUtility.query(query)

    if (response_sms.hasOwnProperty('success') || (response_sms.hasOwnProperty('estatus') && response_sms.status === "ok") ){
      return responseUtility.buildResponseSuccess('json',null,{additional_parameters: {response_sms: response_sms}});
    } else {
      return responseUtility.buildResponseFailed('json',null,{error_key: "sms.fail_request", additional_parameters: {response_sms: response_sms}});
    }
  }

  /**
   * Metodo que permite enviar un SMS por la versión 2 del API
   * @param default_conection_data Configuración
   * @param sms_options_default Objeto con los parámetros para envio de SMS
   * @returns  [response] Respuesta del envio de sms
   */
  private sendSmsV2 = async (default_conection_data: SmsSmsmasivosConectionsConfig, sms_options_default: SmsOptions) => {

    const api_key  = default_conection_data.api_key;
    let auth_token = null;

    /*============================================================
    =            Obteniendo el token de autenticación            =
    ============================================================*/

    const query_auth: HttpCustomStructure = {
      method   : 'post',
      url      :  this.getAuthMethod("2"),
      api_link :  this.getApiUrl("2"),
      params  : {
        apikey: api_key
      }
    }

    const response_auth_token_sms = await queryUtility.query(query_auth)

    if (!response_auth_token_sms.hasOwnProperty('success') ){
      return responseUtility.buildResponseFailed('json',null,{error_key: "sms.fail_request", additional_parameters: {response_sms: response_auth_token_sms}})
    }

    if (response_auth_token_sms.hasOwnProperty('token')){
      auth_token = response_auth_token_sms.token
    }


    if (auth_token === null || auth_token === ""){
      return responseUtility.buildResponseFailed('json',null,{error_key: "sms.fail_request", additional_parameters: {response_sms: response_auth_token_sms}});
    }

    /*=====  End of Obteniendo el token de autenticación  ======*/

    /*===========================================
    =            Enviando el mensaje            =
    ===========================================*/

    const params_send = {
      numbers : sms_options_default.number,
      country_code : sms_options_default.country_code,
      message: sms_options_default.message.toString()
    }

    const query: HttpCustomStructure = {
      method   : 'post',
      url      :  this.getUrlMethod("2"),
      api_link :  this.getApiUrl("2"),
      headers  : {
        token : auth_token
      },
      params   : params_send
    }

    const response_sms = await queryUtility.query(query)

    if (response_sms.hasOwnProperty('success') ){
      return responseUtility.buildResponseSuccess('json',null,{additional_parameters: {response_sms: response_sms}});
    } else {
      return responseUtility.buildResponseFailed('json',null,{error_key: "sms.fail_request", additional_parameters: {response_sms: response_sms}});
    }

    /*=====  End of Enviando el mensaje  ======*/
  }
}

export const smsSmsmasivosUtility = new SmsSmsmasivosUtility();
export { SmsSmsmasivosUtility }

