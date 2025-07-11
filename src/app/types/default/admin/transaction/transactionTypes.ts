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
  buyer?: string
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
  // Add this new field
  shoppingCartItems?: {
    identifier: string,
    programCode: string,
    externalId: string,
    description: string,
    price: number,
    numberOfPlaces: number,
    buyAction: string,
    buyerId: string,
    erpCode?: string,
  }[],
  billingInfo?: {
    fullName: string
    docNumber: string
    nature: string
    classification: string
    country: string
    department: string
    city: string
    currency: EfipayCurrency
    email: string
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

export type IPaymentType = 'certificate' | 'courses'
export interface ISendTransactionStatusParams {
  paymentType: IPaymentType,
  users: {
    name: string
    email: string
  }[]
  transactionId: string
  status: TransactionStatus
  additionalInfo?: {
    courseNames?: string,
    totalAmount?: number,
    currency?: string
    certificateName?: string
  }
}
//@end
