// @import_dependencies_node Import libraries
// var sendpulse = require("sendpulse-api");
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from '@scnode_core/utilities/requestUtility';
import { queryUtility } from '@scnode_core/utilities/queryUtility';
// @end

// @import_services
import {sendPulseService} from '@scnode_core/services/default/sendPulse/sendPulseService'
// @end

// @import types
import {MailerSendPulseConfig, MailerSendPulseSendMail} from '@scnode_core/types/default/mailer/mailerTypes'
// @end

// @Errors info: https://sendpulse.com/latam/integrations/api

class MailerSendpulseUtility {

  private token; // Token de autenticación

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {
    this.token = null;
  }

  /**
   * Metodo que genera las opciones por defecto del mail
   * @returns
   */
  public buildConfigMail = () => {
    const config: MailerSendPulseConfig = {};
    return config;
  }

  /**
   * Metodo que verifica si los campos requeridos estan presentes en la configuración
   * @param config Configuración
   * @returns
   */
  public checkFieldsRequired = async (config: MailerSendPulseConfig) => {
    const fields_config = [
      {key: "cli_id"},
      {key: "secret_id"}
    ];

    const validation = await requestUtility.validator(config,{},fields_config);
    if (validation.hasError === true) return responseUtility.buildResponseFailed('json',null,{error_key: "mailer.configuration_invalid"});

    return responseUtility.buildResponseSuccess('json',null);
  }

  /**
   * Metodo que permite crear la intancia del transportador utilizada para el envio de emails
   * @returns  [object] Objeto de clase Transport de NodeMailer
   */
  public buildTransporter = async (config: MailerSendPulseConfig) => {

    const tokenResponse = await sendPulseService.getToken(config);
    if (tokenResponse.status === 'error') return tokenResponse

    this.token = tokenResponse.token

    return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
      token: this.token
    }})
  }

  /**
   * Metodo que permite enviar el mensaje
   * @param params
   * @returns
   */
   public sendMail = async (params: MailerSendPulseSendMail) => {
    try {
      let to = params.mail_options.to.reduce((accum, element) => {
        accum.push({
          name: element,
          email: element,
        })
        return accum
      }, [])

      const email = {
        "html" : this.base64((params.mail_options && params.mail_options.html) ? params.mail_options.html : ''),
        "text" : (params.mail_options && params.mail_options.text) ? params.mail_options.text : '',
        "subject" : params.mail_options.subject,
        "from" : {
          "name" : params.mail_options.from,
          "email" : params.mail_options.from
        },
        "to" : to,
      };

      let data = {
        email: this.serialize(email)
      }

      let tokenResponse = await queryUtility.query({
        method: 'post',
        url: '/smtp/emails',
        api_link: sendPulseService.api_url,
        params: data,
        headers: {
          "Authorization": `Bearer ${params.token.access_token}`,
          "Content-Type": 'application/json',
          "Content-Length": Buffer.byteLength(JSON.stringify(data))
        }
      });
      if (tokenResponse && tokenResponse.status && tokenResponse.status === 'error') return tokenResponse

      return responseUtility.buildResponseSuccess('json')
    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que convierte a base 64
   * @param data
   * @returns
   */
  private base64(data) {
    const b = Buffer.from(data);
    return b.toString('base64');
  }

  /**
   * Metodo que permite serializar los datos
   * @param mixed_value
   * @return string
   */
  private serialize(mixed_value) {
    let val, key, okey,
      ktype = '',
      vals = '',
      count = 0,

    _utf8Size = function (str) {
      let size = 0,
          i = 0,
          l = str.length,
          code = '';
      for (i = 0; i < l; i++) {
        code = str.charCodeAt(i);
        if (parseInt(code) < 0x0080) {
          size += 1;
        } else if (parseInt(code) < 0x0800) {
          size += 2;
        } else {
          size += 3;
        }
      }
      return size;
    },
    _getType = function (inp) {
      let match, key, cons, types, type = typeof inp;

      if (type === 'object' && !inp) {
        return 'null';
      }

      if (type === 'object') {
        if (!inp.constructor) {
          return 'object';
        }
        cons = inp.constructor.toString();
        match = cons.match(/(\w+)\(/);
        if (match) {
          cons = match[1].toLowerCase();
        }
        types = ['boolean', 'number', 'string', 'array'];
        for (key in types) {
          if (cons == types[key]) {
            type = types[key];
            break;
          }
        }
      }
      return type;
    },

    type = _getType(mixed_value);

    switch (type) {
      case 'function':
        val = '';
        break;
      case 'boolean':
        val = 'b:' + (mixed_value ? '1' : '0');
        break;
      case 'number':
        val = (Math.round(mixed_value) == mixed_value ? 'i' : 'd') + ':' + mixed_value;
        break;
      case 'string':
        val = 's:' + _utf8Size(mixed_value) + ':"' + mixed_value + '"';
        break;
      case 'array':
      case 'object':
        val = 'a';
        for (key in mixed_value) {
          if (mixed_value.hasOwnProperty(key)) {
            ktype = _getType(mixed_value[key]);
            if (ktype === 'function') {
              continue;
            }

            okey = (key.match(/^[0-9]+$/) ? parseInt(key, 10) : key);
            vals += this.serialize(okey) + this.serialize(mixed_value[key]);
            count++;
          }
        }
        val += ':' + count + ':{' + vals + '}';
        break;
      case 'undefined':
      default:
        val = 'N';
        break;
    }
    if (type !== 'object' && type !== 'array') {
      val += ';';
    }
    return val;
  }
}

export const mailerSendpulseUtility = new MailerSendpulseUtility();
export { MailerSendpulseUtility }
