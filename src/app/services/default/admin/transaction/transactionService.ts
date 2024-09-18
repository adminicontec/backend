// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { Transaction } from '@scnode_app/models';
import { ITransaction, IUpdateTransactionWithNewCertificateQueueIdParams, TransactionStatus } from '@scnode_app/types/default/admin/transaction/transactionTypes';
import { customLogService } from '@scnode_app/services/default/admin/customLog/customLogService';
import { efipayService } from '@scnode_app/services/default/efipay/efipayService';
import { IOnTransactionSuccessParams } from '@scnode_app/types/default/efipay/efipayTypes';
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

  public delete = async (transactionId: string) => {
    try {
      const find: any = await Transaction.findOne({ _id: transactionId })
      if (!find) return responseUtility.buildResponseFailed('json', null, {
        code: 404,
        message: 'Transaction not found'
      })

      await find.delete()
    } catch (e) {
      console.log(`TransactionService -> delete -> ERROR: `, e)
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

  public onTransactionSuccess = async (params: IOnTransactionSuccessParams, signature: string) => {
    try {
      if (!signature) {
        customLogService.create({
          label: 'efps - nsf - no signature found',
          description: "No signature found",
          content: {
            params,
          },
        })
        return responseUtility.buildResponseFailed('json', null, {
          code: 400,
          message: 'No signature found'
        })
      }
      const transaction: ITransaction = await Transaction.findOne({ paymentId: params.checkout.payment_gateway_id })
      if (!transaction) {
        customLogService.create({
          label: 'efps - tnf - transaction not found',
          description: "Transaction not found",
          content: {
            params,
          },
        })
        return responseUtility.buildResponseFailed('json', null, {
          code: 404,
          message: 'Transaction not found'
        })
      }

      const signatureIsValid = efipayService.validateSignature('', params)
      if (!signatureIsValid) {
        customLogService.create({
          label: 'efps - esnv - error signature is not valid',
          description: "Error signature is not valid",
          content: {
            params,
            transaction: {
              id: transaction._id,
              status: params.transaction.status
            },
            signature,
          },
        })
        return responseUtility.buildResponseFailed('json', null, {
          code: 400,
          message: 'The signature is not valid'
        })
      }

      const result = await transactionService.insertOrUpdate({
        id: transaction._id,
        status: params.transaction.status as unknown as TransactionStatus
      })
      if (result.status === 'error') {
        customLogService.create({
          label: 'efps - euts - error updating transaction status',
          description: "Error updating transaction status",
          content: {
            params,
            transaction: {
              id: transaction._id,
              status: params.transaction.status,
            },
            updateResult: result
          },
        })
        return responseUtility.buildResponseFailed('json', null, {
          code: 500,
          message: 'An error occurred while saving the transaction status'
        })
      }

      return responseUtility.buildResponseSuccess('json', null, {
        message: "Ok"
      })

    } catch (e) {
      customLogService.create({
        label: 'efps - otse - on transaction success error',
        description: "On transaction success error",
        content: {
          errorMessage: e.message,
          params,
        },
      })
    }
  }

}

export const transactionService = new TransactionService();
export { TransactionService as DefaultAdminTransactionTransactionService };
