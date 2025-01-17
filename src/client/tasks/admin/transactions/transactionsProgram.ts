// @import_services Import Services
import { DefaultPluginsTaskTaskService } from "@scnode_core/services/default/plugins/tasks/taskService";
// @end

// @import_models Import models
// @end

// @import_utilitites Import utilities
// @end

// @import types
import {TaskParams} from '@scnode_core/types/default/task/taskTypes'
import { CertificateQueue, Transaction } from "@scnode_app/models";
import { customLogService } from "@scnode_app/services/default/admin/customLog/customLogService";
import { ITransaction, TransactionStatus } from "@scnode_app/types/default/admin/transaction/transactionTypes";
import { efipayService } from "@scnode_app/services/default/efipay/efipayService";
import { transactionService } from "@scnode_app/services/default/admin/transaction/transactionService";
import { EfipayTransactionStatus } from "@scnode_app/types/default/efipay/efipayTypes";
import { certificateQueueService } from "@scnode_app/services/default/admin/certificateQueue/certificateQueueService";
import { transactionNotificationsService } from "@scnode_app/services/default/admin/transaction/transactionNotificationsService";
import { erpService } from '@scnode_app/services/default/erp/erpService';
import { certificateNotifiactionsService } from '@scnode_app/services/default/admin/certificate/certificateNotifiactionsService';
// @end

class TransactionsProgram extends DefaultPluginsTaskTaskService {

  /**
   * Metodo que contiene la logica de la tarea
   * @return Booleano que identifica si se pudo o no ejecutar la tarea
   */
  public run = async (taskParams: TaskParams) => {
    // @task_logic Add task logic
    await this.updateTransactionStatus()

    await this.cleanPendingTransactions()
    // @end

    return true; // Always return true | false
  }

  // @add_more_methods
  private updateTransactionStatus = async () => {
    try {
      const fifteenMinutesBefore = new Date(Date.now() - 15 * 60 * 1000)
      const pendingTransactions: ITransaction[] = await Transaction.find({
        status: TransactionStatus.IN_PROCESS,
        paymentId: { $exists: true },
        created_at: { $lte: fifteenMinutesBefore }
      })
      for (const transaction of pendingTransactions) {
        const efipayStatus = await efipayService.getTransactionStatus({ paymentId: transaction.paymentId })
        if (efipayStatus && efipayStatus?.data?.status !== EfipayTransactionStatus.IN_PROCESS) {
          const updateResponse = await transactionService.insertOrUpdate({
            id: transaction._id,
            status: efipayStatus.data.status as unknown as TransactionStatus,
            ...(efipayStatus.data?.transaction_details ? {
              paymentInfo: {
                name: efipayStatus.data.transaction_details.name,
                identification_number: efipayStatus.data.transaction_details.identification_number,
                identification_type: efipayStatus.data.transaction_details.identification_type,
                email: efipayStatus.data.transaction_details.email,
                phone: efipayStatus.data.transaction_details.phone,
                address1: efipayStatus.data.customer_payer.address_1,
                address2: efipayStatus.data.customer_payer.address_2,
                city: efipayStatus.data.customer_payer.city,
                country: efipayStatus.data.customer_payer.country,
                state: efipayStatus.data.customer_payer.state,
                zipCode: efipayStatus.data.customer_payer.zip_code
              }
            } : {})
          })

          const certificateQueue = await CertificateQueue.findOne({ _id: transaction?.certificateQueue })
            .populate({ path: 'userId', select: 'profile email' })
            .populate({ path: 'certificateSetting', select: 'certificateName' })
            .populate({ path: 'courseId', populate: {
              path: 'program'
            } })
          const program = certificateQueue?.courseId?.program

          if (updateResponse.status === 'success' && efipayStatus.data.status === EfipayTransactionStatus.SUCCESS) {
            const response = await certificateQueueService.processCertificateQueue({
              certificateQueueId: transaction.certificateQueue,
              output: 'process'
            })
            const invoiceResponse: any = await erpService.createInvoiceFromTransaction(transaction._id)
            if (invoiceResponse?.status === 'error') {
              // TODO: Transactions - send error email
              await certificateNotifiactionsService.sendAdminErrorCertificate({
                errorMessage: 'Error al generar la factura',
                queryErrorMessage: typeof invoiceResponse?.errorContent === 'object' ? JSON.stringify(invoiceResponse?.errorContent) : invoiceResponse?.errorContent,
                certificateQueueId: certificateQueue?._id?.toString(),
                courseName: program?.name,
                docNumber: certificateQueue?.userId?.username,
                studentName: `${certificateQueue?.userId?.profile?.first_name} ${certificateQueue?.userId?.profile?.last_name}`,
              })
              await certificateNotifiactionsService.sendErrorCertificate({
                certificateQueueId: certificateQueue?._id?.toString(),
                users: [
                  {
                    name: `${certificateQueue?.userId?.profile?.first_name} ${certificateQueue?.userId?.profile?.last_name}`,
                    email: certificateQueue?.userId?.email
                  }
                ],
                courseName: program?.name
              })
              continue
            }
          }

          if (certificateQueue) {
            await transactionNotificationsService.sendTransactionStatus({
              certificateName: certificateQueue?.certificateSetting?.certificateName,
              status: efipayStatus.data.status as unknown as TransactionStatus,
              transactionId: transaction._id,
              users: [
                {
                  name: `${certificateQueue?.userId?.profile?.first_name} ${certificateQueue?.userId?.profile?.last_name}`,
                  email: certificateQueue?.userId?.email
                }
              ]
            })
          }
        }
      }
    } catch (e) {
      customLogService.create({
        label: 'tp - utse - update transaction status error',
        description: 'Update transaction status error',
        content: {
          errorMessage: e.message
        }
      })
      console.log(`Transactions program -> UpdateTransactionStatus -> ERROR: ${e}`)
    }
  }

  private cleanPendingTransactions = async () => {
    try {
      const oneDayBefore = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const pendingTransactions: ITransaction[] = await Transaction.find({
        status: TransactionStatus.IN_PROCESS,
        paymentId: { $exists: true },
        created_at: { $lte: oneDayBefore }
      })
      for (const transaction of pendingTransactions) {
        const efipayStatus = await efipayService.getTransactionStatus({ paymentId: transaction.paymentId })
        if (efipayStatus) {
          if (efipayStatus.data.status === EfipayTransactionStatus.IN_PROCESS) {
            await transactionService.insertOrUpdate({
              id: transaction._id,
              status: TransactionStatus.CANCELLED
            })
          }
        }
      }
    } catch (e) {
      customLogService.create({
        label: 'tp - ctpe - clean transaction pending error',
        description: 'Clean pending transactions error',
        content: {
          errorMessage: e.message
        }
      })
      console.log(`Transactions program -> cleanPendingTransactions -> ERROR: ${e}`)
    }
  }
  // @end
}

export const transactionsProgram = new TransactionsProgram();
export { TransactionsProgram };
