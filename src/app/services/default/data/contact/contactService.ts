// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { IContactEmailParams } from '@scnode_app/types/default/data/contact/contactTypes';
import { customs } from '@scnode_core/config/globals';
import moment from 'moment';
import { mailService } from '@scnode_app/services/default/general/mail/mailService';
import { i18nUtility } from '@scnode_core/utilities/i18nUtility';
// @end

// @import models
// @end

// @import types
// @end

class ContactService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  public sendEmail = async (params: IContactEmailParams) => {
    try {
      const path_template = 'contact/contactEmail'

      const currentDate = moment()
      const currentDateFormatted = currentDate.format('YYYY_MM_DD_HH_mm')

      const emailsToNotify = customs['mailer']?.email_contact_form ? customs['mailer']?.email_contact_form : []

      for (const email of emailsToNotify) {
        const paramsTemplate = {
          ...params,
          notification_source: `contact_email_${params.emailFrom}_${currentDateFormatted}`,
          mailer: customs['mailer'],
          nameTo: email.name
        }

        await mailService.sendMail({
          emails: [email.email],
          mailOptions: {
            subject: 'Nuevo mensaje de contacto desde campus',
            html_template: {
              path_layout: 'icontec',
              path_template: path_template,
              params: { ...paramsTemplate }
            },
            amount_notifications: 2
          },
          notification_source: paramsTemplate.notification_source
        })
      }

      return responseUtility.buildResponseSuccess('json')
    } catch (error) {
      console.log('ContactService -> sendEmail -> ERROR: ', error)
      return responseUtility.buildResponseFailed('json')
    }
  }

}

export const contactService = new ContactService();
export { ContactService as DefaultDataContactContactService };
