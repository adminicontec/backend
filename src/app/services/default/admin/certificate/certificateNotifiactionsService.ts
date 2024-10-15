// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { mailService } from '@scnode_app/services/default/general/mail/mailService';
import { ISendAdminErrorCertificateParams, ISendErrorCertificateParams } from '@scnode_app/types/default/admin/certificate/certificateTypes';
import { customs } from '@scnode_core/config/globals';
// @end

// @import models
// @end

// @import types
// @end

class CertificateNotifiactionsService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  public sendAdminErrorCertificate = async ({
    errorMessage,
    queryErrorMessage,
    certificateQueueId,
    courseName,
    docNumber,
    studentName,
  }: ISendAdminErrorCertificateParams) => {
    try {
      const emailsToSend = customs?.mailer?.emails_error_certificate_generation
      if (!emailsToSend?.length) {
        return
      }
      const pathTemplate = 'certificate/adminErrorGeneration'
      for (const user of emailsToSend) {
        const mail = await mailService.sendMail({
          emails: [user.email],
          mailOptions: {
            subject: 'Error al generar certificado',
            html_template: {
              path_layout: 'icontec',
              path_template: pathTemplate,
              params: {
                errorMessage,
                queryErrorMessage,
                adminName: user.name,
                courseName,
                docNumber,
                studentName,
              }
            },
          },
          notification_source: `admin_error_generation_${certificateQueueId}`
        })
      }
    } catch (e) {
      console.log(`CertificateNotificationsService - sendAdminErrorCertificate - ERROR - ${e}`)
    }
  }

  public sendErrorCertificate = async ({
    certificateQueueId,
    users,
    courseName,
  }: ISendErrorCertificateParams) => {
    try {
      const emailsToSend = customs?.mailer?.emails_error_certificate_generation
      if (!emailsToSend?.length) {
        return
      }
      const pathTemplate = 'certificate/errorGeneration'
      for (const user of users) {
        const mail = await mailService.sendMail({
          emails: [user.email],
          mailOptions: {
            subject: 'Error al generar certificado',
            html_template: {
              path_layout: 'icontec',
              path_template: pathTemplate,
              params: {
                studentName: user.name,
                courseName,
              }
            },
          },
          notification_source: `student_error_generation_${certificateQueueId}`
        })
      }
    } catch (e) {
      console.log(`CertificateNotificationsService - sendAdminErrorCertificate - ERROR - ${e}`)
    }
  }

}

export const certificateNotifiactionsService = new CertificateNotifiactionsService();
export { CertificateNotifiactionsService as DefaultAdminCertificateCertificateNotifiactionsService };
