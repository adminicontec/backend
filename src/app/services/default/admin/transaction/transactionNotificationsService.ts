// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { ISendTransactionCreatedParams, ISendTransactionStatusParams, TransactionStatus } from '@scnode_app/types/default/admin/transaction/transactionTypes';
import { mailService } from '@scnode_app/services/default/general/mail/mailService';
// @end

// @import models
// @end

// @import types
// @end

class TransactionNotificationsService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  public sendTransactionCreated = async ({
    users,
    paymentUrl,
    transactionId,
    courseName,
    certificateName,
  }: ISendTransactionCreatedParams) => {
    try {
      const pathTemplate = 'payment/transactionCreated'
      for (const user of users) {
        const mail = await mailService.sendMail({
          emails: [user.email],
          mailOptions: {
            subject: 'Transacción creada',
            html_template: {
              path_layout: 'icontec',
              path_template: pathTemplate,
              params: {
                paymentUrl,
                studentName: user.name,
                courseName,
                certificateName,
              }
            },
          },
          notification_source: `transaction_created_${transactionId}`
        })
      }
    } catch (e) {
      console.log(`TransactionNotificationsService - sendTransactionCreated - ERROR - ${e}`)
    }
  }

  public sendTransactionStatus = async ({
    paymentType,
    users,
    transactionId,
    status,
    additionalInfo
  }: ISendTransactionStatusParams) => {
    try {
      const pathTemplate = 'payment/transactionStatus'
      const textByStatus = {
        [TransactionStatus.IN_PROCESS]: 'Tu pago está siendo revisado. Te notificaremos tan pronto como se complete.',
        [TransactionStatus.ERROR]: 'Tu pago no ha sido aceptado. Te sugerimos revisar tu información de pago y volver a intentarlo.',
        [TransactionStatus.CANCELLED]: 'Tu pago ha sido cancelado. Te sugerimos revisar tu información de pago y volver a intentarlo.',
        [TransactionStatus.REJECTED]: 'Tu pago no ha sido aceptado. Te sugerimos revisar tu información de pago y volver a intentarlo.',
        [TransactionStatus.REVERSED]: 'Tu pago ha sido reversado. Te sugerimos revisar tu información de pago y volver a intentarlo.',
        [TransactionStatus.SUCCESS]: '¡Gracias! Tu pago ha sido procesado correctamente.',
      }
      let paymentContext = '';
      switch (paymentType) {
        case 'certificate':
          paymentContext = `el certificado ${additionalInfo?.certificateName ?? ''}`;
          break;
        case 'courses':
          paymentContext = `${additionalInfo?.courseNames}`;
          break;
        default:
          paymentContext = 'el pago';
          break;
      }
      for (const user of users) {
        const mail = await mailService.sendMail({
          emails: [user.email],
          mailOptions: {
            subject: 'Estado de tu transacción',
            html_template: {
              path_layout: 'icontec',
              path_template: pathTemplate,
              params: {
                studentName: user.name,
                paymentContext,
                status,
                statusText: textByStatus[status]
              }
            },
            amount_notifications: 1,
          },
          notification_source: `transaction_status_${status}_${transactionId}`,
        })
      }
    } catch (e) {
      console.log(`TransactionNotificationsService - sendTransactionStatus - ERROR - ${e}`)
    }
  }

}

export const transactionNotificationsService = new TransactionNotificationsService();
export { TransactionNotificationsService as DefaultAdminTransactionTransactionNotificationsService };
