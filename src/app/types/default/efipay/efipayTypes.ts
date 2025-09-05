// @import types
// @end

// @add your types
export enum EfipayCheckoutType {
  REDIRECT = 'redirect',
  API = 'api'
}

export enum EfipayTransactionStatus {
    SUCCESS = 'Aprobada',
    REJECTED = 'Rechazada',
    ERROR = 'Fallida',
    IN_PROCESS = 'Por Pagar',
    CANCELLED = 'Anulada',
    REVERSED = 'Reversada',
}

export enum EfipayCurrency {
  COP = 'COP',
  USD = 'USD'
}

export enum EfipayTaxes {
  IVA_19 = 1,
  IVA_10 = 2
}

export interface IGeneratePaymentParams {
  payment: {
    description: string
    amount: number
    currency_type: EfipayCurrency
    checkout_type: EfipayCheckoutType
    selected_taxes: EfipayTaxes[]
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
  status: string, 
  status_code?: string;
  message?: string;
  queryErrors?: string;
  saved?: boolean
  payment_id?: string
  url?: string
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
    authorization_code: string
    transaction_details: {
      name: string
      country: string
      identification_number: string
      franchise: string
      status_message: string
      email: string
      identification_type: string
      phone: string
    }
    customer_payer: {
      id: string
      name: string
      email: string
      country: string
      zip_code: string
      state: string
      city: string
      address_2: string
      address_1: string
      created_at: string
      updated_at: string
    }
  }
}

export interface IOnTransactionSuccessParams {
  checkout: {
    payment_gateway_id: string
    paid_at: string
    payment_gateway: {
      created_at: string
    }
  }
  transaction: {
    amount: number
    authorization_code: string
    transaction_details: {
      name: string
      country: string
      identification_number: string
      franchise: string
      status_message: string
      email: string
      identification_type: string
      phone: string
    }
    customer_payer: {
      id: string
      name: string
      email: string
      country: string
      zip_code: string
      state: string
      city: string
      address_2: string
      address_1: string
      created_at: string
      updated_at: string
    }
    status: EfipayTransactionStatus
    approved_at: string
    value_cop: number
    created_at: string
  }
}
//@end
