// @import_dependencies_node Import libraries
import CryptoJS from 'crypto-js'
// @end

// @import services
// @end

// @import utilities
import { IGeneratePaymentParams, IGeneratePaymentResponse, IGetTransactionStatusParams, IGetTransactionStatusResponse, IOnTransactionSuccessParams } from '@scnode_app/types/default/efipay/efipayTypes';
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
      await customLogService.create({
        label: 'efps - gp - generate new payment',
        description: "Generate new payment for Efipay",
        content: {
          params,
        },
      })
      console.log('GeneratePayment::1', params)
      const headers = {
        'Authorization': `Bearer ${efipaySetup.token}`
      }
      console.log('GeneratePayment::2', headers)
      params.payment.description = params.payment.description.slice(0, 190)
      console.log('GeneratePayment::3', params)
      console.log('GeneratePayment::4', {
        method: 'post',
        url: '/api/v1/payment/generate-payment',
        api: 'efipay',
        params,
        headers,
        sendBy: 'body'
      })
      const response: IGeneratePaymentResponse = await queryUtility.query({
        method: 'post',
        url: '/api/v1/payment/generate-payment',
        api: 'efipay',
        params,
        headers,
        sendBy: 'body'
      });
      console.log('GeneratePayment::5', response)
      await customLogService.create({
        label: 'efps - gp - response generate new payment',
        description: "Response new payment for Efipay",
        content: {
          body: params,
          response,
        },
      })
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

  public validateSignature = (signature: string, payloadBuffer: Buffer) => {
    const webhookToken = efipaySetup.webhook_token
    const hmac = CryptoJS.HmacSHA256(payloadBuffer.toString(), webhookToken)
    const generatedSignature = hmac.toString(CryptoJS.enc.Hex)
    customLogService.create({
      label: 'efps - vs - validate signature',
      description: "Validate signature",
      content: {
        generatedSignature,
        signature,
      },
    })
    return this.secureHashCompare(signature, generatedSignature)
  }

  private secureHashCompare = (signature: string, generatedSignature: string) => {
    if (signature.length !== generatedSignature.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < signature.length; i++) {
      result |= signature.charCodeAt(i) ^ generatedSignature.charCodeAt(i);
    }

    return result === 0;
  }

}

export const efipayService = new EfipayService();
export { EfipayService as DefaultEfipayEfipayService };
