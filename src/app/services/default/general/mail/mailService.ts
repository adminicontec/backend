// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import_utilities Import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { mailerUtility } from "@scnode_core/utilities/mailer/mailerUtility";
// @end

// @import models
import { MailMessageLog } from '@scnode_app/models'
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
  notification_source: string
  resend_notification?: boolean
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

      if (mailMessageData.mailOptions && mailMessageData.mailOptions.amount_notifications) {
        const amountNotifications = await MailMessageLog.find({ notification_source: mailMessageData.notification_source }).count()
        if (amountNotifications >= mailMessageData.mailOptions.amount_notifications) {
          return responseUtility.buildResponseFailed('json')
        }
      }

      // @INFO: Enviando mensaje
      const mail_message_response: any = await mailerUtility.sendMail(mailOptions);
      if (mail_message_response.status === 'error') return mail_message_response

      // Revisa si debe enviar de nuevo correo si ya existía (cambio de email, pej)
      if (mailMessageData.resend_notification) {
        console.log('Delete MailMessageLog...');

        const find: any = await MailMessageLog.findOne({ notification_source: mailMessageData.notification_source })
        if (!find) return responseUtility.buildResponseFailed('json', null, { error_key: 'MailMessageLog.not_found' })
        await find.delete();
        console.log('Deleted!');
      }


      await this.generateMailLog(mailMessageData.emails, mailOptions, mailMessageData.notification_source)

      return responseUtility.buildResponseSuccess('json')
    } catch (e) {
      console.log('MailService-sendMail', e)
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que genera el log de envio de email
   * @param user Usuario al que se envia el email
   * @param mailOptions Información del email enviado
   * @param notification_source Origen de la solicitud de envio
   * @returns
   */
  private generateMailLog = async (emails: Array<string>, mailOptions: MailOptions, notification_source: string) => {
    for await (const email of emails) {
      await MailMessageLog.create({
        email: email,
        subject: mailOptions.subject,
        notification_source: notification_source
      })
    }
  }
}

export const mailService = new MailService();
export { MailService as DefaultGlobalMailMailService };
