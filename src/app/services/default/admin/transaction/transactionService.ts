// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { Transaction } from '@scnode_app/models';
import { ITransaction, IUpdateTransactionWithNewCertificateQueueIdParams, TransactionStatus } from '@scnode_app/types/default/admin/transaction/transactionTypes';
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

  public insertOrUpdate = async (params: ITransaction) => {

    try {
      if (params.id) {
        const register = await Transaction.findOne({_id: params.id})
        if (!register) return responseUtility.buildResponseFailed('json')

        const response: any = await Transaction.findByIdAndUpdate(params.id, params, { useFindAndModify: false, new: true })

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            transaction: response
          }
        })

      } else {
        const response: any = await Transaction.create(params)

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            transaction: response
          }
        })
      }

    } catch (e) {
      console.log(`TransactionService -> insertOrUpdate -> ERROR: `, e);
      return responseUtility.buildResponseFailed('json')
    }
  }

  public getTransactionsFromCertificateQueue = async ({
    certificateQueueId
  }) => {
    const transactions = await Transaction.find({
      certificateQueue: certificateQueueId
    })
    return transactions?.length ? transactions : []
  }

  public certificateWasPaid = async (certificateQueueIds: string | string[]) => {
    if (!certificateQueueIds?.length) return false
    if (typeof certificateQueueIds === 'string') {
      certificateQueueIds = [certificateQueueIds]
    }
    for (const certificateQueueId of certificateQueueIds) {
      const transaction = await Transaction.findOne({
        certificateQueue: certificateQueueId,
        status: TransactionStatus.SUCCESS,
      })
      if (!transaction) {
        return false
      }
    }
    return true
  }

  public updateTransactionWithNewCertificateQueueId = async ({
    certificateQueueId,
    transactions,
  }: IUpdateTransactionWithNewCertificateQueueIdParams) => {
    if (!transactions?.length || !certificateQueueId) return false
    if (typeof transactions === 'string') {
      transactions = [transactions]
    }

    const transactionsUpdated = await Transaction.updateMany({
      _id: { $in: transactions }
    }, {
      $set: {
        certificateQueue: certificateQueueId,
      },
    })

    if (transactionsUpdated?.modifiedCount === transactions?.length) return true

    return false
  }

}

export const transactionService = new TransactionService();
export { TransactionService as DefaultAdminTransactionTransactionService };
