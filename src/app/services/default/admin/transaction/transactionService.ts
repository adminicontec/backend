// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { Transaction } from '@scnode_app/models';
import { TransactionStatus } from '@scnode_app/types/default/admin/transaction/transactionTypes';
// @end

// @import models
// @end

// @import types
// @end

class TransactionService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  public certificateWasPaid = async (certificateQueueId: string) => {
    const transaction = await Transaction.findOne({
      certificateQueue: certificateQueueId,
      status: TransactionStatus.SUCCESS,
    })
    return transaction ? true : false
  }

}

export const transactionService = new TransactionService();
export { TransactionService as DefaultAdminTransactionTransactionService };
