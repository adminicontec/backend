// @import types
// @end

// @add your types
export enum TransactionStatus {
  SUCCESS = 'success',
  IN_PROCESS = 'in-process',
  ERROR = 'error',
}

export const TRANSACTION_STATUSES = [
  TransactionStatus.SUCCESS,
  TransactionStatus.IN_PROCESS,
  TransactionStatus.ERROR,
]

export interface ITransaction {
  _id?: string
  id?: string
  status: TransactionStatus
  certificateQueue?: string
}

export interface IUpdateTransactionWithNewCertificateQueueIdParams {
  transactions: string | string[]
  certificateQueueId: string
}
//@end
