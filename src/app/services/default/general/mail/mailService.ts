// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import_utilities Import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { mailerUtility } from "@scnode_core/utilities/mailer/mailerUtility";
// @end

// @import models
// @end

// @import types
import { MailOptions } from "@scnode_core/types/default/mailer/mailerTypes"
// @end

interface IMailerUtilityConfig {
  html_template_layout?: string
  from?: string
}

interface IMailMessageData {
  emails: Array<string>
  mailOptions: Partial<MailOptions>
}

class MailService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor() { }

  /**
   * Metodo que permite enviar mensajes via Email
   * @param mailMessageData Información del mensaje a enviar
   * @returns
   */
  public sendMail = async (mailMessageData: IMailMessageData) => {

    try {
      let defaultMailOptions = {
        to: mailMessageData.emails,
        subject: 'Mail Notification',
      }

      let mailOptions: MailOptions = {
        ...defaultMailOptions,
        ...mailMessageData.mailOptions
      }

      // @INFO: Enviando mensaje
      const mail_message_response: any = await mailerUtility.sendMail(mailOptions);
      if (mail_message_response.status === 'error') return mail_message_response

      return responseUtility.buildResponseSuccess('json')
    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }
}

export const mailService = new MailService();
export { MailService as DefaultGlobalMailMailService };
