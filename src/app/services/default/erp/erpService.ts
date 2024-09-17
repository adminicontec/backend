// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { IGetCertificatePriceParams, IGetCertificatePriceResponse } from '@scnode_app/types/default/erp/erpTypes';
// @end

// @import models
// @end

// @import types
// @end

class ErpService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  public getCertificatePrice = async ({ duration, programCode, programName }: IGetCertificatePriceParams): Promise<IGetCertificatePriceResponse> => {
    try {
      return {
        price: {
          COP: 250000,
          USD: 55
        },
      }
    } catch (e) {
      console.log(`erpService -> getCertificatePrice -> ERROR: ${e}`)
    }
  }

}

export const erpService = new ErpService();
export { ErpService as DefaultErpErpService };
