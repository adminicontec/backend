// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { ICreateInvoiceERP, ICreateInvoiceERPResponse, IGetErpArticleDataParams, IGetErpArticleDataResponse } from '@scnode_app/types/default/erp/erpTypes';
import { CertificateQueue, Course, Transaction } from '@scnode_app/models';
import { ICourse } from '@scnode_app/types/default/admin/course/courseTypes';
import { erpSetup } from '@scnode_core/config/globals';
import { btoa } from 'js-base64';
import { queryUtility } from '@scnode_core/utilities/queryUtility';
import { ITransaction } from '@scnode_app/types/default/admin/transaction/transactionTypes';
import { customLogService } from '@scnode_app/services/default/admin/customLog/customLogService';
import { userDataService } from '../data/user/userDataService';
import { userService } from '../admin/user/userService';
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

enum Currency {
  USD = "USD",
  COP = "COP",
}

class ErpService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  private getAuthHeaders(): { Authorization: string } {
    const basicHeader = btoa(`${erpSetup?.username}:${erpSetup?.password}`);
    return { Authorization: `Basic ${basicHeader}` };
  }

  private buildErpUrl(programCode: string, currency: string, userDocNumber: string): string {
    return `/ic/api/integration/v1/flows/rest/${erpSetup.endpoint.getItemInventory}/1.0/get_item_inventory?COD_ITEM_ECCOMERCE=${programCode}&CURRENCY=${currency}&NUMERO_IDENTIFICACION=${userDocNumber}`;
  }


  public getErpArticleData = async ({
    programCode,
    userDocNumber,
  }: IGetErpArticleDataParams): Promise<IGetErpArticleDataResponse> => {
    try {
      const headers = this.getAuthHeaders();

      const USDRequest = queryUtility.query({
        method: "get",
        url: this.buildErpUrl(programCode, Currency.USD, userDocNumber),
        api: "erp",
        headers,
      });

      const COPRequest = queryUtility.query({
        method: "get",
        url: this.buildErpUrl(programCode, Currency.COP, userDocNumber),
        api: "erp",
        headers,
      });

      const [usdResponse, copResponse] = await Promise.all([
        USDRequest.catch((err) => {
          customLogService.create({
            label: "erpService - getErpArticleData",
            description: "Error fetching USD price",
            content: { error: err.message },
          });
          return null;
        }),
        COPRequest.catch((err) => {
          customLogService.create({
            label: "erpService - getErpArticleData",
            description: "Error fetching COP price",
            content: { error: err.message },
          });
          return null;
        }),
      ]);

      const copItem = copResponse?.ITEM?.[0] || {};
      const usdItem = usdResponse?.ITEM?.[0] || {};

      const priceCOP = Number(copItem.ItemPrice) || 0;
      const priceUSD = Number(usdItem.ItemPrice) || 0;
      const erpCode = copItem.ItemCode ?? null;

      return {
        programCode,
        price: { COP: priceCOP, USD: priceUSD },
        erpCode,
      };
    } catch (error) {
      await customLogService.create({
        label: "erps - gcp - error fetching certificate price",
        description: "Error fetching certificate price",
        content: { error },
      });

      return {
        programCode,
        error: true,
        price: { COP: 0, USD: 0 },
      };
    }
  };

  public createInvoice = async (params: ICreateInvoiceERP): Promise<ICreateInvoiceERPResponse> => {
    try {

      const headers = this.getAuthHeaders();

      const response = await queryUtility.query({
        method: 'post',
        url: `/ic/api/integration/v1/flows/rest/${erpSetup.endpoint.createUpdate}/1.0/create-update/customer`,
        api: 'erp',
        headers,
        sendBy: 'body',
        params,
      })
      await customLogService.create({
        label: 'erps - cir - create invoice response',
        description: "Create invoice response",
        content: {
          params,
          response,
        },
      })
      if (!response) {
        return {
          error: false
        }
      } else {
        return {
          error: true,
          errorContent: response
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
        error: true,
        errorContent: e.message
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
      if (!transaction?.paymentInfo || !transaction.paymentInfo.identification_number || !transaction.paymentInfo.name) {
        await customLogService.create({
          label: 'erps - missing-payment-info',
          description: 'Faltan datos de paymentInfo para generar la factura',
          content: { transactionId: transaction._id, paymentInfo: transaction.paymentInfo }
        });
        return responseUtility.buildResponseFailed('json', null, {
          code: 400,
          message: 'Faltan datos de pago para generar la factura'
        });
      }

      let programCode: string;
      if (transaction.certificateQueue) {
        // Transacción de certificado - obtener código del programa
        const certificateQueue = await CertificateQueue
          .findOne({ _id: transaction.certificateQueue })
          .populate({ path: 'courseId', populate: {
            path: 'program'
          } })
        const program = certificateQueue?.courseId?.program
        if (!program) {
          return responseUtility.buildResponseFailed('json', null, {
            code: 404,
            message: 'Programa no encontrado'
          })
        }
        programCode = program.code;
      }

      const invoiceParams = this.buildInvoiceParams(transaction, programCode);

      const response = await this.createInvoice(invoiceParams)

      if (response?.error) {
        await customLogService.create({
          label: 'erps - eci - error creating invoice',
          description: "Error creating invoice",
          content: {
            transaction: transaction._id,
            data: invoiceParams
          },
        })
        return responseUtility.buildResponseFailed('json', null, {
          code: 500,
          message: 'Ha ocurrido un error creando la factura',
          additional_parameters: {
            errorContent: response?.errorContent
          }
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

  private buildInvoiceParams = (transaction: ITransaction, programCode?: string): ICreateInvoiceERP => {

    const billingData = transaction.certificateQueue ? transaction.certificateInfo : transaction.billingInfo;

    const {
      identification_number,
      address1,
      address2,
      email,
      name,
      phone,
      identification_type,
      authorization_code,
      city,
      state,
      country
    } = transaction.paymentInfo;

    let countryValidated = country?.toUpperCase();

    if(countryValidated === 'COL') {
      countryValidated =  'CO'
     }

    let articulos;
    if (transaction.shoppingCartItems && transaction.shoppingCartItems.length > 0) {
      // Para transacciones de carrito, crear un artículo por cada item
      articulos = transaction.shoppingCartItems.map((item, index) => ({
        ATRIBUTO_1: String(`${item.numberOfPlaces}`), // CANTIDAD DE ELEMENTOS
        PrecioArticulo: String(item.price), // PRECIO UNITARIO
        CodigoArticuloEcommerce: item.programCode, // CODIGO DEL PROGRAMA
        // ATRIBUTO_2: 'CODIGO', // TODO: Pendiente validar si se puede enviar el ID del servicio
      }));
      // articulos = transaction.shoppingCartItems.reduce((accum: any[], element) => {
      //   for (let index = 0; index < element.numberOfPlaces; index++) {
      //     accum.push({
      //       ATRIBUTO_1: `${element.description} - ${index + 1}`, // CANTIDAD
      //       PrecioArticulo: String(element.price), // PRECIO UNITARIO
      //       CodigoArticuloEcommerce: element.programCode, // CODIGO DEL PROGRAMA
      //       ATRIBUTO_2: 'CODIGO',
      //     })
      //   }
      //   return accum;
      // }, [])
    } else {
      articulos = [
        {
          ATRIBUTO_1: '1', // Descripcion
          PrecioArticulo: String(transaction.baseAmount),
          CodigoArticuloEcommerce: programCode, //
        }
      ];
    }

    return {
      ...PLACEHOLDER_CREATE_INVOICE_PARAMS,
      AccountNumber: identification_number,
      AddressLine1: `${address1 || ''} ${address2 || ''}`.trim(),
      City: city,
      Classifications: billingData?.classification,
      CorreoElectrónico: email,
      Country: countryValidated,
      CustomerName: name,
      Department: state,
      Naturaleza: billingData?.nature,
      Telefono: phone,
      TipoDeDocumento: identification_type,
      Articulos: articulos,
      ATRIBUTO_2: billingData?.currency,
      ATRIBUTO_3: String(authorization_code || '')
    };
  };

  public fetchErpDataForItems = async (items: IGetErpArticleDataParams[]): Promise<Map<string, IGetErpArticleDataResponse>> => {
    try {
      const batchPromises = items.map(item => this.getErpArticleData(item))
      const batchResults = await Promise.all(batchPromises)
      const data: Map<string, IGetErpArticleDataResponse> = new Map();
      batchResults.forEach(result => {
        data.set(result.programCode, result)
      });
      return data;
    } catch (err) {
      console.log(`erpService -> fetchErpDataForItems -> ERROR: ${err}`)
      throw err;
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

      let userDocNumber = ''

      try {
        const fetchUserData: any = await userDataService.fetchUserInfo({ user_id: certificate.userId });

        if(fetchUserData) {
          userDocNumber = fetchUserData.user.docNumber;
        }

      } catch (error) {
        console.log('error obteniendo documento del usuario', error)
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

      const { price, erpCode, error: erpError } = await this.getErpArticleData({
        programName: program.name,
        programCode: program.code,
        duration: course.duration,
        userDocNumber
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
