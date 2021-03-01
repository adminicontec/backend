// @import_dependencies_node Import libraries
// @end

// @import_utilities Import utilities
import { queryUtility } from "@scnode_core/utilities/queryUtility";
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from '@scnode_core/utilities/requestUtility';
// @end

// @import types
import {SmsOptions, SmsLabsConfig} from '@scnode_core/types/default/sms/smsTypes'
import {HttpCustomStructure} from '@scnode_core/types/default/query/httpTypes'
// @end

// @import_services
// @end

class SmsLabsmobileUtility {

	private api_url    = 'https://api.labsmobile.com'
	private url_method = '/json/send'

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  public getApiUrl() {
    return this.api_url;
  }

  private getUrlMethod() {
    return this.url_method;
  }


  /**
   * Metodo que genera las opciones por defecto del sms
   * @returns
   */
  public buildConfigSms = () => {
    const config: SmsLabsConfig = {
      default_conection: 'default',
      conections: [{
        key: 'default',
        username: '',
        password: ''
      }],
    };
    return config;
  }

  /**
   * Metodo que verifica si los campos requeridos estan presentes en la configuración
   * @param config Configuración
   * @returns
   */
  public checkFieldsRequired = async (config: SmsLabsConfig) => {
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
  public sendSms = async (config: SmsLabsConfig, sms_options_default: SmsOptions) => {

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

    const auth_key = Buffer.from(default_conection_data.username+":"+default_conection_data.password).toString('base64')

    const query: HttpCustomStructure = {
      method   : 'post',
      url      :  this.getUrlMethod(),
      api_link :  this.getApiUrl(),
      headers  : {
        "Authorization": "Basic "+ auth_key,
        "Cache-Control": "no-cache",
        "Content-Type" : "application/json"
      },
      params  : JSON.stringify({
        message: sms_options_default.message.toString(),
        tpoa: 'Sender',
        recipient: [{
          msisdn: sms_options_default.country_code+sms_options_default.number
        }]
      })
    }

		const response_sms = await queryUtility.query(query)

		if (response_sms.code.toString() === '0'){
			return responseUtility.buildResponseSuccess('json',null,{additional_parameters: {response_sms: response_sms}});
		} else {
			return responseUtility.buildResponseFailed('json',null,{error_key: "sms.fail_request", additional_parameters: {response_sms: response_sms}});
		}
  }

}

export const smsLabsmobileUtility = new SmsLabsmobileUtility();
export { SmsLabsmobileUtility }

