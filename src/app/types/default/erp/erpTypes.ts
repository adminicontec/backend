// @import types
// @end

import { EfipayCurrency } from "@scnode_app/types/default/efipay/efipayTypes"

// @add your types
export interface IGetCertificatePriceParams {
  programName: string
  programCode: string
  duration: number
}

export interface IGetCertificatePriceResponse {
  price: Record<EfipayCurrency, number>
  erpCode?: string
  error?: boolean
}

export interface ICreateInvoiceERP {
  CustomerName: string
  AccountNumber: string
  Country: string
  AddressLine1: string
  City: string
  Department: string
  TipoDeDocumento: string
  Naturaleza: string
  CorreoElectrónico: string
  Telefono: string
  CodigoArticuloEcommerce: string
  PrecioArticulo: string
  Classifications: string
  ATRIBUTO_1: string
}

export interface ICreateInvoiceERPResponse {
  error?: boolean
}
//@end
