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

interface IAttributesERP {
  ATRIBUTO_2: string
  ATRIBUTO_3: string
  ATRIBUTO_4: string
  ATRIBUTO_5: string
  ATRIBUTO_6: string
  ATRIBUTO_7: string
  ATRIBUTO_8: string
  ATRIBUTO_9: string
  ATRIBUTO_10: string
  ATRIBUTO_11: string
  ATRIBUTO_12: string
  ATRIBUTO_13: string
  ATRIBUTO_14: string
  ATRIBUTO_15: string
  ATRIBUTO_16: string
  ATRIBUTO_17: string
  ATRIBUTO_18: string
  ATRIBUTO_19: string
  ATRIBUTO_20: string
  ATRIBUTO_21: string
  ATRIBUTO_22: string
  ATRIBUTO_23: string
  ATRIBUTO_24: string
  ATRIBUTO_25: string
  ATRIBUTO_26: string
  ATRIBUTO_27: string
  ATRIBUTO_28: string
  ATRIBUTO_29: string
  ATRIBUTO_31: string
  ATRIBUTO_32: string
  ATRIBUTO_33: string
  ATRIBUTO_34: string
  ATRIBUTO_35: string
  ATRIBUTO_36: string
  ATRIBUTO_37: string
  ATRIBUTO_38: string
  ATRIBUTO_39: string
  ATRIBUTO_40: string
  ATRIBUTO_41: string
  ATRIBUTO_42: string
  ATRIBUTO_43: string
  ATRIBUTO_44: string
  ATRIBUTO_45: string
  ATRIBUTO_46: string
  ATRIBUTO_47: string
  ATRIBUTO_48: string
  ATRIBUTO_49: string
  ATRIBUTO_50: string
  ATRIBUTO_51: string
  ATRIBUTO_52: string
  ATRIBUTO_53: string
  ATRIBUTO_54: string
  ATRIBUTO_55: string
  ATRIBUTO_56: string
  ATRIBUTO_57: string
  ATRIBUTO_58: string
  ATRIBUTO_59: string
  ATRIBUTO_60: string
  ATRIBUTO_61: string
  ATRIBUTO_62: string
  ATRIBUTO_63: string
  ATRIBUTO_64: string
  ATRIBUTO_65: string
  ATRIBUTO_66: string
  ATRIBUTO_67: string
  ATRIBUTO_68: string
  ATRIBUTO_69: string
  ATRIBUTO_70: string
  ATRIBUTO_71: string
  ATRIBUTO_72: string
  ATRIBUTO_73: string
  ATRIBUTO_74: string
  ATRIBUTO_75: string
  ATRIBUTO_76: string
  ATRIBUTO_77: string
  ATRIBUTO_78: string
  ATRIBUTO_79: string
  ATRIBUTO_80: string
  ATRIBUTO_81: string
  ATRIBUTO_82: string
  ATRIBUTO_83: string
  ATRIBUTO_84: string
  ATRIBUTO_85: string
  ATRIBUTO_86: string
  ATRIBUTO_87: string
  ATRIBUTO_88: string
  ATRIBUTO_89: string
  ATRIBUTO_90: string
  ATRIBUTO_91: string
  ATRIBUTO_92: string
  ATRIBUTO_93: string
  ATRIBUTO_94: string
  ATRIBUTO_95: string
  ATRIBUTO_96: string
  ATRIBUTO_97: string
  ATRIBUTO_98: string
  ATRIBUTO_99: string
  ATRIBUTO_100: string
}

export interface ICreateInvoiceERP extends Partial<IAttributesERP> {
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
  Classifications: string
  Articulos: {
    CodigoArticuloEcommerce: string
    PrecioArticulo: string
    ATRIBUTO_1: string
  }[]
}

export interface ICreateInvoiceERPResponse {
  error?: boolean
}
//@end
