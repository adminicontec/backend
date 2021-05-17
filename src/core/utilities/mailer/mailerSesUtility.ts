// @import_dependencies_node Import libraries
import * as nodemailer from "nodemailer";
import { htmlToText } from "nodemailer-html-to-text";
const hbs = require('nodemailer-express-handlebars')
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from '@scnode_core/utilities/requestUtility';
// @end

// @import_services
import { sesAwsService } from "@scnode_core/services/default/aws/sesAwsService";
// @end

// @import types
import {MailerSESConfig, MailerSESSendMail} from '@scnode_core/types/default/mailer/mailerTypes'
// @end

// @Errors info: https://docs.aws.amazon.com/es_es/ses/latest/DeveloperGuide/api-error-codes.html

class MailerSesUtility {

  private ses; // Instancia de Amazon SES

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {
    this.ses = null;
  }

  /**
   * Metodo que genera las opciones por defecto del mail
   * @returns
   */
  public buildConfigMail = () => {
    const config: MailerSESConfig = {};
    return config;
  }

  /**
   * Metodo que verifica si los campos requeridos estan presentes en la configuración
   * @param config Configuración
   * @returns
   */
  public checkFieldsRequired = async (config: MailerSESConfig) => {
    const fields_config = [];

    const validation = await requestUtility.validator(config,{},fields_config);
    if (validation.hasError === true) return responseUtility.buildResponseFailed('json',null,{error_key: "mailer.configuration_invalid"});

    return responseUtility.buildResponseSuccess('json',null);
  }

  /**
   * Metodo que permite generar una instancia de Amazon S3 segun la configuración
   * @param upload_config Objeto de clase UploadConfig que posee todas las opciones y configuraciones de los archivos a cargar
   * @returns
   */
  private instance = async (config: MailerSESConfig) => {
    if (this.ses) return;

    const instance = await sesAwsService.instance(config.credentials);
    if (instance.status === 'success') this.ses = instance['ses'];
  }

  /**
   * Metodo que permite crear la intancia del transportador utilizada para el envio de emails
   * @returns  [object] Objeto de clase Transport de NodeMailer
   */
  public buildTransporter = async (config: MailerSESConfig) => {

    await this.instance(config);

    if (this.ses) {
      const transporter = nodemailer.createTransport({
        SES: this.ses
      });

      return responseUtility.buildResponseSuccess('json',null,{additional_parameters: {transporter: transporter}});
    } else {
      return responseUtility.buildResponseFailed('json',null,{error_key: "mailer.configuration_invalid"});
    }
  }

  /**
   * Metodo que permite enviar el mensaje
   * @param params
   * @returns
   */
  public sendMail = async (params: MailerSESSendMail) => {
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

export const mailerSesUtility = new MailerSesUtility();
export { MailerSesUtility }
