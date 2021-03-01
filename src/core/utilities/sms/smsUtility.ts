// @import_dependencies_node Import libraries
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from '@scnode_core/utilities/requestUtility';
// @end

// @import_config_files Import config files
import { sms_config } from "@scnode_core/config/globals";
// @end

// @import types
import {SmsDriver, SmsOptions} from '@scnode_core/types/default/sms/smsTypes'
// @end

class SmsUtility {

  private config  // Variable donde se almacena la configuración de la herramienta
  private _driver // Metodo de ejecución de la herramienta

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {
    this.config = {}
    this._driver = null
  }

  public setDriver(driver: SmsDriver) {
    this._driver = driver
  }

  public getDriver() {
    return this._driver
  }

  /**
   * Metodo que permite enviar un sms
   * @param sms_options_default Configuracion del sms a enviar
   * @returns [json] Objeto en formato JSON con el estado de envio del sms
   */
  public sendSms = async(sms_options_default: SmsOptions) => {

    if (sms_options_default.hasOwnProperty('driver') && sms_options_default['driver'] !== null) {
      this._driver = sms_options_default['driver']
    } else {
      if (!sms_config.hasOwnProperty('driver')) {
        return responseUtility.buildResponseFailed('json',null,{error_key: "sms.driver_required"})
      }
      this._driver = sms_config['driver']
    }

    if (!sms_config.hasOwnProperty(this.getDriver())) {
      return responseUtility.buildResponseFailed('json',null,{error_key: "sms.configuration_invalid"})
    }
    const utility_response = requestUtility.utilityInstance(`sms-${this.getDriver()}`,'sms/');

    if (utility_response.status === 'error') return responseUtility.buildResponseFailed('json',null,{error_key: "sms.driver_invalid"});
    const sms_utility = utility_response['utility']

    let sms_options: SmsOptions = {
      number         : "",
      country_code    : "",
      message        : ""
    }

    let validation = null

    // Validacion del numero de teléfono al que se enviará el mensaje
    validation = this.validateSmsNumber(sms_options,sms_options_default)
    if (validation.status == 'error') return validation

    // Validacion del numero de teléfono al que se enviará el mensaje
    validation = this.validateSmsCountryCode(sms_options,sms_options_default)
    if (validation.status == 'error') return validation

    // Validacion del cuerpo del mensaje
    validation = this.validateSmsMessage(sms_options,sms_options_default)
    if (validation.status == 'error') return validation

    this.config = sms_utility['buildConfigSms']()
    const user_config = sms_config[this.getDriver()]
    Object.assign(this.config,user_config)

    const validation_driver: any = await sms_utility['checkFieldsRequired'](this.config)
    if (validation_driver.status === "error") return validation_driver

    return await sms_utility['sendSms'](this.config, sms_options);
  }


  /**
   * Metodo que valida  codigo del país
   * @param sms_options Configuracion del mensaje
   * @param sms_options_default Configuracion del mensaje proporcionada desde la peticion
   * @returns  [json] Objeto en formato JSON
   */
  private validateSmsCountryCode = (sms_options,sms_options_default) => {
    // Validar si se proporciono el numero
    if (!sms_options_default.hasOwnProperty('country_code')) {
      return responseUtility.buildResponseFailed('json',null,{error_key: "sms.sms_country_code_required"})
    }

    if (typeof sms_options_default["country_code"] !== "string" || sms_options_default["message"] === "" || sms_options_default["message"] == "0") {
      return responseUtility.buildResponseFailed('json',null,{error_key: "sms.sms_country_code_invalid"})
    }

    const country_code_str = sms_options_default.country_code.replace(/ /g, "")

    if (!country_code_str.match(/^\d+$/g)) {
      return responseUtility.buildResponseFailed('json',null,{error_key: "sms.sms_country_code_invalid"})
    }

    sms_options["country_code"] = country_code_str
    return responseUtility.buildResponseSuccess('json',null)
  }

  /**
   * Metodo que valida  numero de teléfono al que se enviará el mensaje
   * @param sms_options Configuracion del mensaje
   * @param sms_options_default Configuracion del mensaje proporcionada desde la peticion
   * @returns  [json] Objeto en formato JSON
   */
  private validateSmsNumber = (sms_options,sms_options_default) => {
    // Validar si se proporciono el numero
    if (!sms_options_default.hasOwnProperty('number')) {
      return responseUtility.buildResponseFailed('json',null,{error_key: "sms.sms_number_required"})
    }

    if (typeof sms_options_default["number"] !== "string" || sms_options_default["message"] === "" || sms_options_default["message"] == "0") {
      return responseUtility.buildResponseFailed('json',null,{error_key: "sms.sms_number_invalid"})
    }

    const number_str = sms_options_default.number.replace(/ /g, "")

    if (!number_str.match(/^\d+$/g)) {
      return responseUtility.buildResponseFailed('json',null,{error_key: "sms.sms_number_invalid"})
    }

    sms_options["number"] = number_str
    return responseUtility.buildResponseSuccess('json',null)
  }

  /**
   * Metodo que valida del mensaje
   * @param sms_options Configuracion del mensaje
   * @param sms_options_default Configuracion del mensaje proporcionada desde la peticion
   * @returns  [json] Objeto en formato JSON
   */
  private validateSmsMessage = (sms_options,sms_options_default) => {

    // Validar si se proporciono el mensaje
    if (!sms_options_default.hasOwnProperty('message')) {
      return responseUtility.buildResponseFailed('json',null,{error_key: "sms.sms_message_required"})
    }

    if (typeof sms_options_default["message"] !== "string" || sms_options_default["message"] === "" || sms_options_default["message"] == "0") {
      return responseUtility.buildResponseFailed('json',null,{error_key: "sms.sms_message_required"})
    }

    if (sms_options_default["message"].toString().length > 255) {
      return responseUtility.buildResponseFailed('json',null,{error_key: "sms.sms_message_invalid_length"})
    }

    sms_options["message"] = sms_options_default["message"]
    return responseUtility.buildResponseSuccess('json',null)
  }
}

export const smsUtility = new SmsUtility()
export { SmsUtility }

