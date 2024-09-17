// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { IGeneratePaymentParams, IGeneratePaymentResponse, IGetTransactionStatusParams, IGetTransactionStatusResponse } from '@scnode_app/types/default/efipay/efipayTypes';
import { customLogService } from '@scnode_app/services/default/admin/customLog/customLogService';
import { queryUtility } from '@scnode_core/utilities/queryUtility';
import { efipaySetup } from '@scnode_core/config/globals';
// @end

// @import models
// @end

// @import types
// @end

class EfipayService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  public generatePayment = async (params: IGeneratePaymentParams): Promise<IGeneratePaymentResponse> => {
    try {
      const headers = {
        'Authorization': `Bearer ${efipaySetup.token}`
      }
      const response: IGeneratePaymentResponse = await queryUtility.query({
        method: 'post',
        url: '/api/v1/payment/generate-payment',
        api: 'efipay',
        params,
        headers
      });
      console.log({ response })
      return response
    } catch (e) {
      customLogService.create({
        label: 'efps - gpe - generate-payment-error',
        description: "Error when generating Efipay payment",
        content: {
          errorMessage: e.message,
          params,
        },
      })
    }
  }

  public getTransactionStatus = async ({ paymentId }: IGetTransactionStatusParams): Promise<IGetTransactionStatusResponse> => {
    try {
      const headers = {
        'Authorization': `Bearer ${efipaySetup.token}`
      }
      const response: IGetTransactionStatusResponse = await queryUtility.query({
        method: 'post',
        url: `/api/v1/payment/transaction-status/${paymentId}`,
        api: 'efipay',
        headers
      });
      console.log({ response })
      return response
    } catch (e) {
      customLogService.create({
        label: 'efps - gtse - error getting transaction status',
        description: "Error getting transaction status",
        content: {
          errorMessage: e.message,
          paymentId,
        },
      })
    }
  }

}

export const efipayService = new EfipayService();
export { EfipayService as DefaultEfipayEfipayService };
