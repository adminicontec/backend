// @import types
// @end

// @add your types
export enum EfipayCheckoutType {
  REDIRECT = 'redirect',
  API = 'api'
}

export enum EfipayTransactionStatus {
    APPROVED = 'Aprobada',
    REJECTED = 'Rechazada',
    FAILED = 'Fallida',
    IN_PROCESS = 'Por Pagar',
    CANCELLED = 'Anulada',
    REVERSED = 'Reversada',
}

export enum EfipayCurrency {
  COP = 'COP',
  USD = 'USD'
}

export interface IGeneratePaymentParams {
  payment: {
    description: string
    amount: number
    currency_type: EfipayCurrency
    checkout_type: EfipayCheckoutType
  }
  advanced_options: {
    picture: string
    limit_date: string // YYYY-MM-DD
    references: string[]
    result_urls: {
      approved: string
      rejected: string
      pending: string
      webhook: string
    }
    has_comments: boolean
  }
  office: number
}

export interface IGeneratePaymentResponse {
  saved: boolean
  payment_id: string
  url: string
}

export interface IGetTransactionStatusParams {
  paymentId: string
}

export interface IGetTransactionStatusResponse {
  data: {
    transaction_id: number
    amount: number
    currency_type: number
    value_cop: number
    status: EfipayTransactionStatus
    url_response: string
    approved_at: string
    production: boolean
    created_at: string
  }
}
//@end
