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
  certificateInfo?: {
    fullName: string
    docNumber: string
  }
  baseAmount?: number
  totalAmount?: number
  taxesAmount?: number
  paymentInfo?: {
    name: string
    identification_number: string
    email: string
    identification_type: string
    phone: string
  }
}

export interface IUpdateTransactionWithNewCertificateQueueIdParams {
  transactions: string | string[]
  certificateQueueId: string
}
//@end
