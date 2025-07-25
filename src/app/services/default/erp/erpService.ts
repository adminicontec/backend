// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { ICreateInvoiceERP, ICreateInvoiceERPResponse, IGetErpArticleDataParams, IGetErpArticleDataResponse, IGetPricesByProgram, IUpdateErpPricesParams, IUpdateErpPricesResult } from '@scnode_app/types/default/erp/erpTypes';
import { CertificateQueue, Course, CourseScheduling, CourseSchedulingStatus, Transaction } from '@scnode_app/models';
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

const DEFAULT_BATCH_SIZE = 50;
const DEFAULT_UPDATE_INTERVAL_HOURS = 24;
const DEFAULT_MAX_RETRIES = 3;
const BATCH_DELAY_MS = 1000; // 2 segundos entre lotes
const CONCURRENT_REQUESTS = 5; // Número de requests concurrentes por micro-lote
const MICRO_BATCH_DELAY_MS = 500; // Delay entre micro-lotes
const PROGRAM_CACHE_TTL_MS = 300000;

interface IProgramCacheEntry {
  data: IGetErpArticleDataResponse;
  timestamp: number;
  batchId: string;
}

class ErpService {

  private programCache = new Map<string, IProgramCacheEntry>();

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

  public getPricesByProgram = async (params: IGetPricesByProgram): Promise<any> => {
    try {
      const { programCode, documentNumber } = params;
      const erpItemsToSearch = [
        {
          programCode,
          userDocNumber: documentNumber
        }
      ]
      const erpArticleData = await erpService.fetchErpDataForItems(erpItemsToSearch)
      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          prices: erpArticleData.get(programCode)
        }
      })
    } catch (e) {
      console.log(`erpService -> getPricesByProgram -> ERROR: ${e}`);
      return responseUtility.buildResponseFailed('json', null, {message: e?.message})
    }
  }

  public updateErpPrices = async (params: IUpdateErpPricesParams): Promise<IUpdateErpPricesResult> => {
    const {
      programsIds,
      serviceIds,
      batchSize = DEFAULT_BATCH_SIZE,
      maxRetries = DEFAULT_MAX_RETRIES,
      updateIntervalHours = DEFAULT_UPDATE_INTERVAL_HOURS,
      forceUpdate = false,
      concurrentRequests = CONCURRENT_REQUESTS,
      microBatchDelay = MICRO_BATCH_DELAY_MS,
      batchDelay = BATCH_DELAY_MS
    } = params;

    const result: IUpdateErpPricesResult = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    try {
      this.clearProgramCache();
      const batchId = Date.now().toString();

      // Construir filtros
      const where = await this.buildUpdateFilters({
        programsIds,
        serviceIds,
        updateIntervalHours,
        maxRetries,
        forceUpdate
      });

      // Obtener total de registros
      const totalCount = await CourseScheduling.countDocuments(where);
      console.log(`Total de servicios a procesar: ${totalCount}`);

      if (totalCount === 0) {
        return result;
      }

      // Procesar en lotes
      const totalBatches = Math.ceil(totalCount / batchSize);
      console.log('totalBatches', totalBatches)

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const skip = batchIndex * batchSize;

        console.log(`Procesando lote ${batchIndex + 1}/${totalBatches} (${skip + 1}-${Math.min(skip + batchSize, totalCount)})`);

        // Obtener lote actual
        const schedulings = await CourseScheduling
          .find(where)
          .populate('program')
          .skip(skip)
          .limit(batchSize)
          .lean();

        // Procesar lote
        const batchResult = await this.processBatch(schedulings, maxRetries, batchId, {
          concurrentRequests,
          microBatchDelay
        });

        // Acumular resultados
        result.totalProcessed += batchResult.totalProcessed;
        result.successful += batchResult.successful;
        result.failed += batchResult.failed;
        result.skipped += batchResult.skipped;
        result.errors.push(...batchResult.errors);

        // Log de progreso
        const cacheStats = this.getCacheStats();
        await customLogService.create({
          label: 'erp-price-update-progress',
          description: `Lote ${batchIndex + 1}/${totalBatches} completado`,
          content: {
            batchResult,
            totalProgress: result
          }
        });

        // Pausa entre lotes para no sobrecargar el servicio externo
        if (batchIndex < totalBatches - 1) {
          await this.delay(batchDelay);
        }
      }

      // Log final
      const finalCacheStats = this.getCacheStats();
      await customLogService.create({
        label: 'erp-price-update-completed',
        description: 'Actualización de precios completada',
        content: {
          ...result,
          cacheStats: finalCacheStats,
          optimizationSavings: {
            totalServices: result.totalProcessed,
            uniquePrograms: finalCacheStats.totalEntries,
            savedRequests: result.totalProcessed - finalCacheStats.totalEntries,
            efficiencyGain: `${((result.totalProcessed - finalCacheStats.totalEntries) / result.totalProcessed * 100).toFixed(1)}%`
          }
        }
      });

      this.clearProgramCache();

      return result;

    } catch (error) {
      await customLogService.create({
        label: 'erp-price-update-error',
        description: 'Error en actualización masiva de precios',
        content: { error: error.message, params }
      });

      throw error;
    }
  }

  private buildUpdateFilters = async (params: {
    programsIds?: string[]
    serviceIds?: string[]
    updateIntervalHours: number,
    maxRetries: number,
    forceUpdate: boolean
  }) => {
    const { programsIds, serviceIds, updateIntervalHours, forceUpdate, maxRetries } = params;

    // Estados válidos
    const courseSchedulingStatus = await CourseSchedulingStatus.find({
      name: { $in: ['Programado', 'Confirmado'] }
    });
    const courseSchedulingStatusIds = courseSchedulingStatus.map(status => status._id);

    const where: any = {
      schedulingStatus: { $in: courseSchedulingStatusIds },
      hasCost: true
    };

    // Filtros opcionales
    if (programsIds && programsIds.length > 0) {
      where.program = { $in: programsIds };
    }

    if (serviceIds && serviceIds.length > 0) {
      where._id = { $in: serviceIds };
    }

    // Control de frecuencia de actualización
    if (!forceUpdate) {
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - updateIntervalHours);

      console.log('cutoffDate', cutoffDate);
      console.log('maxRetries', maxRetries);

      where.$or = [
        { 'erpPriceSync.lastAttempt': { $exists: false } },
        { 'erpPriceSync.lastAttempt': null },
        // Registros que han pasado el tiempo de actualización Y fueron exitosos
        {
          'erpPriceSync.lastAttempt': { $lt: cutoffDate },
          'erpPriceSync.status': { $in: ['success', 'pending'] }
        },
        {
          'erpPriceSync.status': 'error',
          // 'erpPriceSync.attempts': { $lt: maxRetries },
          // Opcional: también considerar el tiempo para reintentos
          'erpPriceSync.lastAttempt': { $lt: cutoffDate }
        }
      ];
    }

    return where;
  };


  private processBatch = async (
    schedulings: any[],
    maxRetries: number,
    batchId: string,
    optimizationParams?: {
      concurrentRequests?: number
      microBatchDelay?: number
    }
  ): Promise<IUpdateErpPricesResult> => {
    const batchResult: IUpdateErpPricesResult = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    // Agrupar servicios por programa para optimizar consultas ERP
    const programGroups = new Map<string, any[]>();
    const uniquePrograms = new Set<string>();

    for (const scheduling of schedulings) {
      if (!scheduling.program?.code) {
        batchResult.skipped++;
        continue;
      }

      const programCode = scheduling.program.code;
      uniquePrograms.add(programCode);

      if (!programGroups.has(programCode)) {
        programGroups.set(programCode, []);
      }
      programGroups.get(programCode)!.push(scheduling);
    }

    if (uniquePrograms.size === 0) {
      console.log('No hay programas válidos para procesar en este lote');
      return batchResult;
    }

    console.log(`Lote contiene ${schedulings.length} servicios agrupados en ${uniquePrograms.size} programas únicos`);

    // Identificar programas que necesitan consulta ERP (no están en cache)
    const programsToQuery: string[] = [];
    const cachedPrograms: string[] = [];

    for (const programCode of uniquePrograms) {
      if (this.isProgramCached(programCode, batchId)) {
        cachedPrograms.push(programCode);
      } else {
        programsToQuery.push(programCode);
      }
    }

    console.log(`Cache hit: ${cachedPrograms.length} programas, Cache miss: ${programsToQuery.length} programas`);

    // Consultar solo programas no cacheados
    if (programsToQuery.length > 0) {
      const erpItems: IGetErpArticleDataParams[] = programsToQuery.map(programCode => ({
        programCode,
        userDocNumber: ''
      }));

      console.log(`Consultando ERP para ${erpItems.length} programas únicos...`);

      try {
        const startTime = Date.now();
        const erpData = await this.fetchErpDataForItemsWithDelay(
          erpItems,
          optimizationParams?.concurrentRequests || CONCURRENT_REQUESTS,
          optimizationParams?.microBatchDelay || MICRO_BATCH_DELAY_MS
        );
        const queryTime = Date.now() - startTime;

        console.log(`Consulta ERP completada en ${queryTime}ms para ${erpItems.length} programas`);

        // Almacenar resultados en cache
        for (const [programCode, erpResponse] of erpData.entries()) {
          this.setProgramCache(programCode, erpResponse, batchId);
        }

      } catch (error) {
        console.error('Error consultando ERP para programas:', error.message);

        // Marcar programas con error en cache
        for (const programCode of programsToQuery) {
          this.setProgramCache(programCode, {
            programCode,
            price: { COP: 0, USD: 0 },
            error: true,
            erpCode: null
          }, batchId);
        }
      }
    }

    // Actualizar todos los servicios usando datos de cache
    console.log(`Actualizando ${schedulings.length} servicios usando datos de programas...`);
    const updateStartTime = Date.now();

    for (const [programCode, schedulingsForProgram] of programGroups.entries()) {
      const erpResponse = this.getProgramFromCache(programCode);

      if (!erpResponse) {
        // Esto no debería pasar, pero por seguridad
        console.error(`Programa ${programCode} no encontrado en cache`);
        continue;
      }

      // Actualizar todos los servicios de este programa
      for (const scheduling of schedulingsForProgram) {
        batchResult.totalProcessed++;

        try {
          // Validaciones existentes
          if (erpResponse.error) {
            throw new Error('Error en consulta ERP');
          }

          if (!erpResponse.erpCode || erpResponse.erpCode.trim() === '') {
            throw new Error('ERP Code no válido o vacío - no se puede actualizar precio');
          }

          if (!erpResponse.price || (erpResponse.price.COP === 0 && erpResponse.price.USD === 0)) {
            throw new Error('Precios no válidos recibidos del ERP');
          }

          // Actualizar servicio
          await CourseScheduling.findByIdAndUpdate(
            scheduling._id,
            {
              priceCOP: erpResponse.price.COP,
              priceUSD: erpResponse.price.USD,
              'erpPriceSync.lastUpdated': new Date(),
              'erpPriceSync.lastAttempt': new Date(),
              'erpPriceSync.status': 'success',
              'erpPriceSync.attempts': 0,
              'erpPriceSync.errorMessage': null
            },
            { new: true }
          );

          batchResult.successful++;

        } catch (error) {
          batchResult.failed++;
          const errorMessage = error.message;

          batchResult.errors.push({
            schedulingId: scheduling._id.toString(),
            error: `${programCode}: ${errorMessage}`
          });

          // Actualizar estado de error
          const currentAttempts = scheduling.erpPriceSync?.attempts || 0;
          await CourseScheduling.findByIdAndUpdate(
            scheduling._id,
            {
              'erpPriceSync.lastAttempt': new Date(),
              'erpPriceSync.status': 'error',
              'erpPriceSync.attempts': currentAttempts + 1,
              'erpPriceSync.errorMessage': `${programCode}: ${errorMessage} - erpCode: ${erpResponse?.erpCode || 'N/A'}`
            }
          );
        }
      }
    }

    const updateTime = Date.now() - updateStartTime;
    console.log(`Actualización BD completada en ${updateTime}ms para ${schedulings.length} servicios`);

    return batchResult;
  };

  // Métodos de gestión de cache
  private isProgramCached = (programCode: string, batchId: string): boolean => {
    const entry = this.programCache.get(programCode);
    if (!entry) return false;

    const now = Date.now();
    const isExpired = (now - entry.timestamp) > PROGRAM_CACHE_TTL_MS;

    if (isExpired) {
      this.programCache.delete(programCode);
      return false;
    }

    return true;
  };

  private setProgramCache = (programCode: string, data: IGetErpArticleDataResponse, batchId: string): void => {
    this.programCache.set(programCode, {
      data,
      timestamp: Date.now(),
      batchId
    });
  };

  private getProgramFromCache = (programCode: string): IGetErpArticleDataResponse | null => {
    const entry = this.programCache.get(programCode);
    return entry ? entry.data : null;
  };

  private clearProgramCache = (): void => {
    this.programCache.clear();
  };

  private getCacheStats = () => {
    return {
      totalEntries: this.programCache.size,
      entries: Array.from(this.programCache.keys())
    };
  };

  private fetchErpDataForItemsWithDelay = async (
    items: IGetErpArticleDataParams[],
    concurrentRequests: number = CONCURRENT_REQUESTS,
    microBatchDelay: number = MICRO_BATCH_DELAY_MS
  ): Promise<Map<string, IGetErpArticleDataResponse>> => {
    const results = new Map<string, IGetErpArticleDataResponse>();

    // Dividir items en micro-lotes para procesamiento concurrente controlado
    const microBatches = this.chunkArray(items, concurrentRequests);

    console.log(`Procesando ${items.length} items en ${microBatches.length} micro-lotes de ${concurrentRequests} requests concurrentes`);

    for (let i = 0; i < microBatches.length; i++) {
      const microBatch = microBatches[i];

      console.log(`Procesando micro-lote ${i + 1}/${microBatches.length} con ${microBatch.length} items`);

      try {
        // Procesar micro-lote de forma concurrente
        const microBatchPromises = microBatch.map(async (item) => {
          try {
            const result = await this.getErpArticleData(item);

            // Log detallado del resultado
            if (result.error) {
              console.warn(`⚠ Error en consulta ERP para ${item.programCode}`);
            } else if (!result.erpCode || result.erpCode.trim() === '') {
              console.warn(`⚠ ERP Code vacío para ${item.programCode}`);
            } else {
              console.log(`✓ Datos ERP obtenidos para ${item.programCode} - Code: ${result.erpCode}`);
            }

            return { programCode: item.programCode, result };
          } catch (error) {
            console.error(`✗ Error procesando item ${item.programCode}:`, error.message);
            return {
              programCode: item.programCode,
              result: {
                programCode: item.programCode,
                price: { COP: 0, USD: 0 },
                error: true,
                erpCode: null
              }
            };
          }
        });

        // Esperar a que termine el micro-lote
        const microBatchResults = await Promise.all(microBatchPromises);

        // Agregar resultados al mapa
        microBatchResults.forEach(({ programCode, result }) => {
          results.set(programCode, result);
        });

        // Log de progreso del micro-lote
        const validResults = microBatchResults.filter(r => !r.result.error && r.result.erpCode).length;
        console.log(`Micro-lote ${i + 1}/${microBatches.length} completado. Válidos: ${validResults}/${microBatch.length}. Total procesado: ${results.size}/${items.length}`);

        // Delay entre micro-lotes para no sobrecargar el servicio externo
        if (i < microBatches.length - 1) {
          await this.delay(microBatchDelay);
        }

      } catch (error) {
        console.error(`✗ Error en micro-lote ${i + 1}:`, error.message);

        // En caso de error del micro-lote completo, marcar todos los items como error
        microBatch.forEach(item => {
          results.set(item.programCode, {
            programCode: item.programCode,
            price: { COP: 0, USD: 0 },
            error: true,
            erpCode: null
          });
        });
      }
    }

    return results;
  };

  private chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  };

  private delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };
}

export const erpService = new ErpService();
export { ErpService as DefaultErpErpService };
