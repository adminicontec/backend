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

          await transactionService.onTransactionSuccess(
            {
              checkout: {
                payment_gateway_id: transaction.paymentId,
                paid_at: '',
                payment_gateway: {
                  created_at: ''
                }
              },
              transaction: efipayStatus.data,
            },
            undefined,
            undefined,
            'local'
          )
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
            customLogService.create({
              label: 'tp - ctpe - clean transaction pending',
              description: 'Clean pending transaction successfully',
              content: {
                transaction: transaction._id,
                createdAt: transaction?.created_at,
                comparisonDate: oneDayBefore,
              }
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
