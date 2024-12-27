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
import { customLogService } from '@scnode_app/services/default/admin/customLog/customLogService';
// @end

// @import models
// @end

// @import types
// @end

const PLACEHOLDER_CREATE_INVOICE_PARAMS = {
  "ATRIBUTO_2": "",
  "ATRIBUTO_3": "",
  "ATRIBUTO_4": "",
  "ATRIBUTO_5": "",
  "ATRIBUTO_6": "",
  "ATRIBUTO_7": "",
  "ATRIBUTO_8": "",
  "ATRIBUTO_9": "",
  "ATRIBUTO_10": "",
  "ATRIBUTO_11": "",
  "ATRIBUTO_12": "",
  "ATRIBUTO_13": "",
  "ATRIBUTO_14": "",
  "ATRIBUTO_15": "",
  "ATRIBUTO_16": "",
  "ATRIBUTO_17": "",
  "ATRIBUTO_18": "",
  "ATRIBUTO_19": "",
  "ATRIBUTO_20": "",
  "ATRIBUTO_21": "",
  "ATRIBUTO_22": "",
  "ATRIBUTO_23": "",
  "ATRIBUTO_24": "",
  "ATRIBUTO_25": "",
  "ATRIBUTO_26": "",
  "ATRIBUTO_27": "",
  "ATRIBUTO_28": "",
  "ATRIBUTO_29": "",
  "ATRIBUTO_31": "",
  "ATRIBUTO_32": "",
  "ATRIBUTO_33": "",
  "ATRIBUTO_34": "",
  "ATRIBUTO_35": "",
  "ATRIBUTO_36": "",
  "ATRIBUTO_37": "",
  "ATRIBUTO_38": "",
  "ATRIBUTO_39": "",
  "ATRIBUTO_40": "",
  "ATRIBUTO_41": "",
  "ATRIBUTO_42": "",
  "ATRIBUTO_43": "",
  "ATRIBUTO_44": "",
  "ATRIBUTO_45": "",
  "ATRIBUTO_46": "",
  "ATRIBUTO_47": "",
  "ATRIBUTO_48": "",
  "ATRIBUTO_49": "",
  "ATRIBUTO_50": "",
  "ATRIBUTO_51": "",
  "ATRIBUTO_52": "",
  "ATRIBUTO_53": "",
  "ATRIBUTO_54": "",
  "ATRIBUTO_55": "",
  "ATRIBUTO_56": "",
  "ATRIBUTO_57": "",
  "ATRIBUTO_58": "",
  "ATRIBUTO_59": "",
  "ATRIBUTO_60": "",
  "ATRIBUTO_61": "",
  "ATRIBUTO_62": "",
  "ATRIBUTO_63": "",
  "ATRIBUTO_64": "",
  "ATRIBUTO_65": "",
  "ATRIBUTO_66": "",
  "ATRIBUTO_67": "",
  "ATRIBUTO_68": "",
  "ATRIBUTO_69": "",
  "ATRIBUTO_70": "",
  "ATRIBUTO_71": "",
  "ATRIBUTO_72": "",
  "ATRIBUTO_73": "",
  "ATRIBUTO_74": "",
  "ATRIBUTO_75": "",
  "ATRIBUTO_76": "",
  "ATRIBUTO_77": "",
  "ATRIBUTO_78": "",
  "ATRIBUTO_79": "",
  "ATRIBUTO_80": "",
  "ATRIBUTO_81": "",
  "ATRIBUTO_82": "",
  "ATRIBUTO_83": "",
  "ATRIBUTO_84": "",
  "ATRIBUTO_85": "",
  "ATRIBUTO_86": "",
  "ATRIBUTO_87": "",
  "ATRIBUTO_88": "",
  "ATRIBUTO_89": "",
  "ATRIBUTO_90": "",
  "ATRIBUTO_91": "",
  "ATRIBUTO_92": "",
  "ATRIBUTO_93": "",
  "ATRIBUTO_94": "",
  "ATRIBUTO_95": "",
  "ATRIBUTO_96": "",
  "ATRIBUTO_97": "",
  "ATRIBUTO_98": "",
  "ATRIBUTO_99": "",
  "ATRIBUTO_100": "",
}

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
      await customLogService.create({
        label: 'erps - cir - create invoice response',
        description: "Create invoice response",
        content: {
          params,
          response,
        },
      })
      if (response?.code === 200) {
        return {
          error: false
        }
      } else {
        return {
          error: true
        }
      }
    } catch (e) {
      await customLogService.create({
        label: 'erps - cica - create invoice catch',
        description: "Create invoice catch",
        content: {
          params,
          e,
        },
      })
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
        await customLogService.create({
          label: 'erps - ciftnf - transaction not found',
          description: "Transaction not found",
          content: {
            transaction: transaction._id,
          },
        })
        return responseUtility.buildResponseFailed('json', null, {
          code: 404,
          message: 'Transacción no encontrada'
        })
      }
      if (transaction?.invoiceCreated) {
        await customLogService.create({
          label: 'erps - ciftac - invoice already created',
          description: "Invoice already created",
          content: {
            transaction: transaction._id,
          },
        })
        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            message: 'Factura creada anteriormente'
          }
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
        identification_type,
      } = transaction?.paymentInfo
      const response = await this.createInvoice({
        ...PLACEHOLDER_CREATE_INVOICE_PARAMS,
        AccountNumber: identification_number,
        AddressLine1: `${address1} ${address2}`,
        City: city,
        Classifications: transaction.certificateInfo?.classification,
        CorreoElectrónico: email,
        Country: country,
        CustomerName: name,
        Department: state,
        Naturaleza: transaction.certificateInfo?.nature,
        Telefono: phone,
        TipoDeDocumento: identification_type,
        Articulos: [
          {
            ATRIBUTO_1: '1',  // Amount of items that were bought
            PrecioArticulo: String(transaction.baseAmount),
            CodigoArticuloEcommerce: transaction.erpCode,
          }
        ]
      })
      if (response?.error) {
        await customLogService.create({
          label: 'erps - eci - error creating invoice',
          description: "Error creating invoice",
          content: {
            transaction: transaction._id,
          },
        })
        return responseUtility.buildResponseFailed('json', null, {
          code: 500,
          message: 'Ha ocurrido un error creando la factura'
        })
      } else {
        await Transaction.findByIdAndUpdate(transactionId, { invoiceCreated: true }, { useFindAndModify: false, new: true })
        await customLogService.create({
          label: 'erps - ics - invoice created successfully',
          description: "Invoice created successfully",
          content: {
            transaction: transaction._id,
          },
        })
        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            message: 'Factura creada correctamente'
          }
        })
      }
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
