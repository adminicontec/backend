// @import_services Import Services
import { DefaultPluginsTaskTaskService } from "@scnode_core/services/default/plugins/tasks/taskService";
// @end

// @import_models Import models
// @end

// @import_utilitites Import utilities
// @end

// @import types
import {TaskParams} from '@scnode_core/types/default/task/taskTypes'
import { Transaction } from "@scnode_app/models";
import { customLogService } from "@scnode_app/services/default/admin/customLog/customLogService";
import { ITransaction, TransactionStatus } from "@scnode_app/types/default/admin/transaction/transactionTypes";
import { efipayService } from "@scnode_app/services/default/efipay/efipayService";
import { transactionService } from "app/services/default/admin/transaction/transactionService";
// @end

class TransactionsProgram extends DefaultPluginsTaskTaskService {

  /**
   * Metodo que contiene la logica de la tarea
   * @return Booleano que identifica si se pudo o no ejecutar la tarea
   */
  public run = async (taskParams: TaskParams) => {
    // @task_logic Add task logic
    this.updateTransactionStatus()
    // @end

    return true; // Always return true | false
  }

  // @add_more_methods
  private updateTransactionStatus = async () => {
    try {
      const pendingTransactions: ITransaction[] = await Transaction.find({
        status: TransactionStatus.IN_PROCESS,
        paymentId: { $exists: true },
        deleted: false
      })
      for (const transaction of pendingTransactions) {
        const efipayStatus = await efipayService.getTransactionStatus({ paymentId: transaction.paymentId })
        if (efipayStatus) {
          const updateResponse = await transactionService.insertOrUpdate({
            id: transaction._id,
            status:efipayStatus.data.status as unknown as TransactionStatus
          })
          if (updateResponse.status === 'success') {
            // TODO: Trigger certificate generation
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
  // @end
}

export const transactionsProgram = new TransactionsProgram();
export { TransactionsProgram };
