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
}
//@end
