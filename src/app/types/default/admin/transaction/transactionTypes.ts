// @import types
// @end

// @add your types
export enum TransactionStatus {
  SUCCESS = 'Aprobada',
  REJECTED = 'Rechazada',
  ERROR = 'Fallida',
  IN_PROCESS = 'Por Pagar',
  CANCELLED = 'Anulada',
  REVERSED = 'Reversada',
}

export const TRANSACTION_STATUSES = [
  TransactionStatus.SUCCESS,
  TransactionStatus.REJECTED,
  TransactionStatus.ERROR,
  TransactionStatus.IN_PROCESS,
  TransactionStatus.CANCELLED,
  TransactionStatus.REVERSED,
]

export interface ITransaction {
  _id?: string
  id?: string
  status?: TransactionStatus
  certificateQueue?: string
  paymentId?: string
  redirectUrl?: string
}

export interface IUpdateTransactionWithNewCertificateQueueIdParams {
  transactions: string | string[]
  certificateQueueId: string
}
//@end
