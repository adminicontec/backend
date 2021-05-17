// @import_dependencies_node Import libraries
import moment from "moment";
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from '@scnode_core/utilities/requestUtility';
import { generalUtility } from '@scnode_core/utilities/generalUtility';
// @end

// @import_config_files Import config files
import { customs, host, environment, dist_dir, mailer } from "@scnode_core/config/globals";
// @end

// @import types
import {MailerDriver, MailOptions} from '@scnode_core/types/default/mailer/mailerTypes'
// @end

// Direccion URL del plugin - https://nodemailer.com/about/

class MailerUtility {

  private config; // Variable donde se almacena la configuración de la herramienta
  private _driver; // Metodo de ejecución de la herramienta
  private templates_dir = null; // Directorio donde se alojan los templates

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {
    this.config = {};
    this._driver = null;

    const base_dir = __dirname.split('core');
    this.templates_dir = base_dir[0] + 'views/email_templates/';
  }

  public setDriver(driver: MailerDriver) {
    this._driver = driver;
  }

  public getDriver() {
    return this._driver;
  }

  /**
   * Metodo que permite enviar un email
   * @param mail_options_default Configuracion del email a enviar
   * @returns [json] Objeto en formato JSON con el estado de envio del email
   */
  public sendMail = async(mail_options_default: MailOptions) => {

    if (mail_options_default.hasOwnProperty('driver') && mail_options_default['driver'] !== null) {
      this._driver = mail_options_default['driver'];
    } else {
      if (!mailer.hasOwnProperty('driver')) {
        return responseUtility.buildResponseFailed('json',null,{error_key: "mailer.driver_required"});
      }
      this._driver = mailer['driver'];
    }

    if (!mailer.hasOwnProperty(this.getDriver())) {
      return responseUtility.buildResponseFailed('json',null,{error_key: "mailer.configuration_invalid"});
    }

    const utility_response = requestUtility.utilityInstance(`mailer-${this.getDriver()}`,'mailer/');

    if (utility_response.status === 'error') return responseUtility.buildResponseFailed('json',null,{error_key: "mailer.driver_invalid"});
    const mailer_utility = utility_response['utility'];

    const mail_options: MailOptions = {
      from       : (mailer.hasOwnProperty('from')) ? mailer['from']: 'mailer@ket.com',
      to         : [],
      cc         : [],
      bcc        : [],
      subject    : "",
      text       : "",
      html       : "",
      template   : "",
      context: {},
      attachments: [],
      hbsConfig  : {
        viewEngine: {
          extname: ".hbs",
          defaultLayout: "default/layout",
          layoutsDir: `${this.templates_dir}layouts`,
          partialsDir: `${this.templates_dir}templates`
        },
        viewPath: `${this.templates_dir}templates`,
        extName: '.hbs'
      }
    }

    let validation = null;

    // Validacion de quien envia el mensaje
    validation = this.validateFromMessage(mail_options,mail_options_default);
    if (validation.status == 'error') return validation;

    // Validacion de los receptores del mensaje (to)
    validation = this.validateMessageRecipients(mail_options,mail_options_default,'to',true);
    if (validation.status == 'error') return validation;

    // Validacion de los receptores del mensaje (cc)
    validation = this.validateMessageRecipients(mail_options,mail_options_default,'cc',false);
    if (validation.status == 'error') return validation;

    // Validacion de los receptores del mensaje (bcc)
    validation = this.validateMessageRecipients(mail_options,mail_options_default,'bcc',false);
    if (validation.status == 'error') return validation;

    // Validacion del asunto del mensaje
    validation = this.validateMailSubject(mail_options,mail_options_default);
    if (validation.status == 'error') return validation;

    // Validacion del cuerpo del mensaje
    validation = await this.validateMailBody(mail_options,mail_options_default);
    if (validation.status == 'error') return validation;

    validation = this.validateAttachments(mail_options,mail_options_default);
    if (validation.status == 'error') return validation;

    this.config = mailer_utility['buildConfigMail']();
    const user_config = mailer[this.getDriver()];
    Object.assign(this.config,user_config);

    const checkFields: any = await mailer_utility['checkFieldsRequired'](this.config);
    if (checkFields.status === "error") return checkFields;

    const response_transporter = await mailer_utility['buildTransporter'](this.config);

    if (response_transporter.status === 'error') return response_transporter;

    try {

      const sendMailResponse: any = await mailer_utility['sendMail']({
        ...response_transporter,
        mail_options
      });
      // if (sendMailResponse.status === "error") return sendMailResponse;
      return sendMailResponse

    } catch (err) {
      return responseUtility.buildResponseFailed('json',null,{error_key: "mailer.mailer_fail_request", additional_parameters: {
        reason: err,
      }})
    }
  }

  /**
   * Metodo que permite validar el propietario del mensaje
   * @param mail_options Configuracion del mensaje
   * @param mail_options_default Configuracion del mensaje proporcionada desde la peticion
   * @returns  [json] Objeto en formato JSON
   */
  private validateFromMessage = (mail_options,mail_options_default) => {

    // Validar si se proporciono el parametro from
    if (!mail_options_default.hasOwnProperty('from')) {
      return responseUtility.buildResponseSuccess('json',null);
    }

    if (typeof mail_options_default["from"] !== "string" || mail_options_default["from"] === "" || mail_options_default["from"] == "0") {
      return responseUtility.buildResponseFailed('json',null,{error_key: "mailer.mail_from_invalid"});
    }

    mail_options["from"] = mail_options_default["from"];
    return responseUtility.buildResponseSuccess('json',null);
  }

  /**
   * Metodo que valida los receptores del mensaje
   * @param mail_options Configuracion del mensaje
   * @param mail_options_default Configuracion del mensaje proporcionada desde la peticion
   * @param recipient Destinatario(s) del mensaje
   * @param is_required Variable binaria que define si el campo es requerido y debe ser obligatorio en la peticion
   * @returns  [json] Objeto en formato JSON
   */
  private validateMessageRecipients = (mail_options,mail_options_default,recipient: "to" | "cc" | "bcc" = 'to', is_required: boolean = true) => {

    if (!mail_options_default.hasOwnProperty(recipient)) {
      if (is_required === true) {
        return responseUtility.buildResponseFailed('json',null,{error_key: `mailer.mail_${recipient}_required`});
      } else {
        return responseUtility.buildResponseSuccess('json',null);
      }
    }

    if (!Array.isArray(mail_options_default[recipient])) {
      return responseUtility.buildResponseFailed('json',null,{error_key: `mailer.mail_${recipient}_invalid`});
    }

    if (mail_options_default[recipient].length == 0) {
      return responseUtility.buildResponseFailed('json',null,{error_key: `mailer.mail_${recipient}_invalid`});
    }

    let format_email_valid = true;
    for (const key in mail_options_default[recipient]) {
      if (mail_options_default[recipient].hasOwnProperty(key)) {
        const element = mail_options_default[recipient][key];
        if (generalUtility.validateEmailFormat(element) === false) {
          format_email_valid = false;
        }
      }
    }

    if (format_email_valid === false) {
      return responseUtility.buildResponseFailed('json',null,{error_key: `mailer.mail_${recipient}_invalid`});
    }

    mail_options[recipient] = mail_options_default[recipient];

    return responseUtility.buildResponseSuccess('json',null);
  }

  /**
   * Metodo que valida el asunto del mensaje
   * @param mail_options Configuracion del mensaje
   * @param mail_options_default Configuracion del mensaje proporcionada desde la peticion
   * @returns  [json] Objeto en formato JSON
   */
  private validateMailSubject = (mail_options,mail_options_default) => {

    // Validar si se proporciono el asunto
    if (!mail_options_default.hasOwnProperty('subject')) {
      return responseUtility.buildResponseFailed('json',null,{error_key: "mailer.mail_subject_required"});
    }

    if (typeof mail_options_default["subject"] !== "string" || mail_options_default["subject"] === "" || mail_options_default["subject"] == "0") {
      return responseUtility.buildResponseFailed('json',null,{error_key: "mailer.mail_subject_invalid"});
    }

    mail_options["subject"] = mail_options_default["subject"];
    return responseUtility.buildResponseSuccess('json',null);
  }

  /**
   * Metodo que valida el cuerpo del mensaje
   * @param mail_options Configuracion del mensaje
   * @param mail_options_default Configuracion del mensaje proporcionada desde la peticion
   * @returns  [json] Objeto en formato JSON
   */
  private validateMailBody = async (mail_options,mail_options_default) => {

    // Validar si se proporciono un cuerpo del mensaje
    if (!mail_options_default.hasOwnProperty('html') && !mail_options_default.hasOwnProperty('html_template')) {
      return responseUtility.buildResponseFailed('json',null,{error_key: "mailer.mail_content_required"});
    }

    // Si se proporciona directamente el HTML como cuerpo del mensaje
    if (mail_options_default.hasOwnProperty('html')) {
      mail_options.html = mail_options_default['html'];

      // Validar si el cuerpo del mensaje cumple con el formato requerido
      if (mail_options.html.trim() == "") {
        return responseUtility.buildResponseFailed('json',null,{error_key: "mailer.mail_content_invalid"});
      }
    }

    // Si se proporciona un template como cuerpo del mensaje
    if (mail_options_default.hasOwnProperty('html_template')) {

      if (mail_options_default.html_template.path_layout && mail_options_default.html_template.path_layout != "") {
        mail_options.hbsConfig.viewEngine.defaultLayout = `${mail_options_default.html_template.path_layout}/layout`;
      }

      if (mail_options_default.html_template.path_template && mail_options_default.html_template.path_template != "") {
        mail_options.template = mail_options_default.html_template.path_template;
      }

      let params: any = {
        customs,
        public_dir : `${host}`,
        default_template: (mailer.hasOwnProperty('default_template')) ? mailer['default_template'] : null,
        dates: {
          year: moment().format('YYYY')
        }
      };

      if (mail_options_default['html_template'].hasOwnProperty('params') && typeof mail_options_default['html_template']['params'] === 'object') {
        params = {
          ...params,
          ...mail_options_default['html_template']['params']
        }
      }

      mail_options.context = {params};

      // Validar si el cuerpo del mensaje cumple con el formato requerido
      if (mail_options.template.trim() == "") {
        return responseUtility.buildResponseFailed('json',null,{error_key: "mailer.mail_content_invalid"});
      }
    }
    return responseUtility.buildResponseSuccess('json',null);
  }

  /**
   * Metodo que valida los adjuntos anexos al mensaje
   * @param mail_options Configuracion del mensaje
   * @param mail_options_default Configuracion del mensaje proporcionada desde la peticion
   * @returns  [json] Objeto en formato JSON
   */
  private validateAttachments = (mail_options,mail_options_default) => {

    if (!mail_options_default.hasOwnProperty('attachments')) {
      return responseUtility.buildResponseSuccess('json',null);
    }

    if (!Array.isArray(mail_options_default["attachments"])) {
      return responseUtility.buildResponseFailed('json',null,{error_key: "mailer.mail_attachments_invalid"});
    }

    if (mail_options_default["attachments"].length == 0) {
      return responseUtility.buildResponseFailed('json',null,{error_key: "mailer.mail_attachments_invalid"});
    }

    mail_options["attachments"] = mail_options_default["attachments"];

    return responseUtility.buildResponseSuccess('json',null);
  }


}

export const mailerUtility = new MailerUtility();
export { MailerUtility}

