// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { ICreateInvoiceERP, ICreateInvoiceERPResponse, IGetCertificatePriceParams, IGetCertificatePriceResponse } from '@scnode_app/types/default/erp/erpTypes';
import { CertificateQueue, Course, Transaction } from '@scnode_app/models';
import { ICourse } from '@scnode_app/types/default/admin/course/courseTypes';
import { erpSetup } from '@scnode_core/config/globals';
import { btoa } from 'js-base64';
import { queryUtility } from '@scnode_core/utilities/queryUtility';
import { ITransaction } from '@scnode_app/types/default/admin/transaction/transactionTypes';
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

  public getCertificatePrice = async ({ programCode }: IGetCertificatePriceParams): Promise<IGetCertificatePriceResponse> => {
    try {
      const basicHeader = btoa(`${erpSetup?.username}:${erpSetup?.password}`)
      const headers = {
        'Authorization': `Basic ${basicHeader}`
      }
      const response = await queryUtility.query({
        method: 'get',
        url: `/ic/api/integration/v1/flows/rest/ICO_CO_ITEM_INVENT_TV/1.0/get_item_inventory?COD_ITEM_ECCOMERCE=${programCode}`,
        api: 'erp',
        headers
      })
      const priceCOP = Number(response?.ITEM?.[0]?.ItemPrice)
      const erpCode = response?.ITEM?.[0]?.ItemCode
      return {
        price: {
          COP: priceCOP,
          USD: 0
        },
        erpCode,
      }
    } catch (e) {
      console.log(`erpService -> getCertificatePrice -> ERROR: ${e}`)
      return {
        error: true,
        price: {
          COP: 0,
          USD: 0,
        }
      }
    }
  }

  public createInvoice = async (params: ICreateInvoiceERP): Promise<ICreateInvoiceERPResponse> => {
    try {
      const basicHeader = btoa(`${erpSetup?.username}:${erpSetup?.password}`)
      const headers = {
        'Authorization': `Basic ${basicHeader}`
      }
      const response = await queryUtility.query({
        method: 'post',
        url: `/ic/api/integration/v1/flows/rest/ICO_CO_CREAT_UPDAT_CUSTO_TV/1.0/create-update/customer`,
        api: 'erp',
        headers,
        params: JSON.stringify(params)
      })
      return {

      }
    } catch (e) {
      console.log(`erpService -> createInvoice -> ERROR: ${e}`)
      return {
        error: true
      }
    }
  }

  public createInvoiceFromTransaction = async (transactionId: string) => {
    try {
      const transaction: ITransaction = await Transaction.findOne({ _id: transactionId })
      if (!transaction) {
        return responseUtility.buildResponseFailed('json', null, {
          code: 404,
          message: 'Transacción no encontrada'
        })
      }
      const {
        identification_number,
        address1,
        address2,
        city,
        email,
        country,
        name,
        state,
        phone,
        identification_type
      } = transaction?.paymentInfo
      // TODO: Transactions - Replace with real classifications and Naturaleza
      const response = await this.createInvoice({
        AccountNumber: identification_number,
        AddressLine1: `${address1} ${address2}`,
        ATRIBUTO_1: '1',  // Amount of items that were bought
        City: city,
        Classifications: '10_NO RESPONSABLE',
        CodigoArticuloEcommerce: transaction.erpCode,
        CorreoElectrónico: email,
        Country: country,
        CustomerName: name,
        Department: state,
        Naturaleza: 'Natural',
        PrecioArticulo: String(transaction.baseAmount),
        Telefono: phone,
        TipoDeDocumento: identification_type,
      })
    } catch (e) {
      console.log(`erpService -> createInvoiceFromTransaction -> ERROR: ${e}`)
      return responseUtility.buildResponseFailed('json', null, {
        code: 500,
        message: 'Ha ocurrido un error creando la factura'
      })
    }
  }

  public getCertificatePriceFromCertificateQueue = async ({ certificateQueueId }, exposeCollections?: boolean) => {
    try {
      const certificate = await CertificateQueue
        .findOne({ _id: certificateQueueId })
        .populate({ path: 'courseId', populate: {
          path: 'program'
        } })

      if (!certificate) {
        return responseUtility.buildResponseFailed('json', null, {
          code: 404,
          message: 'Certificado no encontrado'
        })
      }

      const program = certificate?.courseId?.program
      if (!program) {
        return responseUtility.buildResponseFailed('json', null, {
          code: 404,
          message: 'Programa no encontrado'
        })
      }

      const course = await Course.findOne<ICourse>({ program: program._id })
      if (!course) {
        return responseUtility.buildResponseFailed('json', null, {
          code: 404,
          message: 'Curso no encontrado'
        })
      }

      const { price, erpCode, error: erpError } = await this.getCertificatePrice({
        programName: program.name,
        programCode: program.code,
        duration: course.duration
      })
      if (erpError) {
        return responseUtility.buildResponseFailed('json', null, {
          code: 404,
          message: 'Articulo en ERP no encontrado'
        })
      }

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          price,
          course,
          program,
          erpCode,
        }
      })
    } catch (e) {
      console.log(`erpService -> getCertificatePriceFromCertificateQueue -> ERROR: ${e}`)
      return responseUtility.buildResponseFailed('json')
    }
  }

}

export const erpService = new ErpService();
export { ErpService as DefaultErpErpService };
