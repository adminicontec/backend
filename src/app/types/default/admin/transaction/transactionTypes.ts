// @import types
// @end

import { EfipayCurrency } from "@scnode_app/types/default/efipay/efipayTypes"

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
  erpCode?: string
  paymentId?: string
  redirectUrl?: string
  certificateInfo?: {
    fullName: string
    docNumber: string
    nature: string
    classification: string
    country: string
    department: string
    city: string
    currency: EfipayCurrency
  }
  baseAmount?: number
  totalAmount?: number
  taxesAmount?: number
  invoiceCreated?: boolean
  paymentInfo?: {
    name: string
    identification_number: string
    email: string
    identification_type: string
    phone: string
    address1: string
    address2: string
    country: string
    zipCode: string
    state: string
    city: string
    authorization_code: string
  }
}

export interface IUpdateTransactionWithNewCertificateQueueIdParams {
  transactions: string | string[]
  certificateQueueId: string
}

export interface ISendTransactionCreatedParams {
  users: {
    name: string
    email: string
  }[]
  paymentUrl: string
  transactionId: string
  certificateName: string
  courseName: string
}

export interface ISendTransactionStatusParams {
  users: {
    name: string
    email: string
  }[]
  transactionId: string
  status: TransactionStatus
  certificateName: string
}
//@end
