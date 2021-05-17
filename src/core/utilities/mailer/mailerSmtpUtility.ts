// @import_dependencies_node Import libraries
import * as nodemailer from "nodemailer";
import { htmlToText } from "nodemailer-html-to-text";
const hbs = require('nodemailer-express-handlebars')
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from '@scnode_core/utilities/requestUtility';
// @end

// @import types
import {MailerSMTPConfig, MailerSMTPSendMail} from '@scnode_core/types/default/mailer/mailerTypes'
// @end

class MailerSmtpUtility {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  private config: MailerSMTPConfig;

  constructor () { }

  /**
   * Metodo que genera las opciones por defecto del mail
   * @returns
   */
  public buildConfigMail = () => {
    let config: MailerSMTPConfig = {};
    config.smtpauth = false;
    return config;
  }

  /**
   * Metodo que verifica si los campos requeridos estan presentes en la configuración
   * @param config Configuración
   * @returns
   */
  public checkFieldsRequired = async (config: MailerSMTPConfig) => {
    const fields_config = [
      {key: "host"},
      {key: "port"},
      {key: "user"},
      {key: "password"}
    ];

    const validation = await requestUtility.validator(config,{},fields_config);
    if (validation.hasError === true) return responseUtility.buildResponseFailed('json',null,{error_key: "mailer.configuration_invalid"});

    return responseUtility.buildResponseSuccess('json',null);
  }

  /**
   * Metodo que permite crear la intancia del transportador utilizada para el envio de emails
   * @returns  [object] Objeto de clase Transport de NodeMailer
   */
  public buildTransporter = (config: MailerSMTPConfig) => {

    const transporter = nodemailer.createTransport({
      host  : config.host,
      port  : config.port,
      secure: config.smtpauth,
      auth  : {
        user: config.user,
        pass: config.password
      }
    });

    return responseUtility.buildResponseSuccess('json',null,{additional_parameters: {transporter: transporter}});
  }

  /**
   * Metodo que permite enviar el mensaje
   * @param params
   * @returns
   */
  public sendMail = async (params: MailerSMTPSendMail) => {

    try {
      const transporter = params.transporter;

      if (params.mail_options.html !== "") {
        transporter.use('compile', htmlToText());
      } else if (params.mail_options.template !== "") {
        transporter.use('compile',hbs(params.mail_options.hbsConfig))
      }

      await transporter.sendMail(params.mail_options);

      return responseUtility.buildResponseSuccess('json');

    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }
}

export const mailerSmtpUtility = new MailerSmtpUtility();
export { MailerSmtpUtility }
