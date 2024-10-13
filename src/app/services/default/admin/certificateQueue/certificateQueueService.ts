// @import_dependencies_node Import libraries
const ObjectID = require('mongodb').ObjectID
// @end

// @import services
import { certificateService } from "@scnode_app/services/default/huellaDeConfianza/certificate/certificateService";
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import { Enrollment, CertificateQueue, Course } from '@scnode_app/models';
// @end

// @import types
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes'
import { ICertificateQueue, ICertificateQueueQuery, ICertificateQueueDelete, IProcessCertificateQueue, ICertificatePreview, CertificateQueueStatus, ICertificatePaymentParams } from '@scnode_app/types/default/admin/certificate/certificateTypes'
import moment from 'moment';
import { customs, efipaySetup } from '@scnode_core/config/globals';
import { transactionService } from "@scnode_app/services/default/admin/transaction/transactionService";
import { efipayService } from "@scnode_app/services/default/efipay/efipayService";
import { erpService } from "@scnode_app/services/default/erp/erpService";
import { ICourse } from "app/types/default/admin/course/courseTypes";
import { EfipayCheckoutType, EfipayTaxes, IGeneratePaymentParams } from "@scnode_app/types/default/efipay/efipayTypes";
import { courseService } from "@scnode_app/services/default/admin/course/courseService";
import { ITransaction, TransactionStatus } from "@scnode_app/types/default/admin/transaction/transactionTypes";
import { transactionNotificationsService } from "@scnode_app/services/default/admin/transaction/transactionNotificationsService";
// @end

interface ParamsCertificateGeneratedByMonth {
  months?: number;    // Numero de meses a filtrar (por defecto últimos 12)
}

class CertificateQueueService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor() { }


  /**
 * Metodo que permite validar si un registro existe segun parametros
 * @param params Filtros para buscar el elemento
 * @returns
 */
  public findBy = async (params: IQueryFind) => {

    try {
      let where = {}
      if (params.where && Array.isArray(params.where)) {
        params.where.map((p) => where[p.field] = p.value)
      }

      let select = 'id courseId userId auxiliar status certificateType certificateModule certificateConsecutive certificate certificateType message notificationSent certificateSetting';
      if (params.query === QueryValues.ALL) {
        const registers = await CertificateQueue.find(where)
          .select(select)
          .populate({ path: 'userId', select: 'id email phoneNumber profile.first_name profile.last_name profile.doc_type profile.doc_number profile.regional profile.origen moodle_id' })
          .populate({ path: 'auxiliar', select: 'id email phoneNumber profile.first_name profile.last_name profile.doc_type profile.doc_number profile.regional profile.origen moodle_id' });

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            certificateQueue: registers
          }
        })
      } else if (params.query === QueryValues.ONE) {
        const register = await CertificateQueue.findOne(where).select(select)
        if (!register) return responseUtility.buildResponseFailed('json', null, { error_key: 'city.not_found' })
        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            certificateQueue: register
          }
        })
      }

      return responseUtility.buildResponseFailed('json')
    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
* Metodo que permite insertar/actualizar un registro
* @param params Elementos a registrar
* @returns
*/
  public insertOrUpdate = async (params: ICertificateQueue) => {

    try {
      const moduleEnabled = customs?.modules?.certificate?.enabled !== undefined ? customs?.modules?.certificate?.enabled : true
      const force = params?.force || false

      if (params.id) {
        // console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++");
        // console.log("UPDATE certificate queue");
        // console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++");
        // console.log(params);

        const register = await CertificateQueue.findOne({ _id: params.id })
        if (!register) return responseUtility.buildResponseFailed('json', null, { error_key: 'certificate.queue.not_found' })

        // only inserts downloadDate if it doesn't exist.
        if (!register.downloadDate && params.downloadDate) {
          register.downloadDate = moment().format('YYYY-MM-DD HH:mm:ss').replace(' ', 'T');
          console.log('update dowload date >>>' + register.downloadDate);
        }

        const lastStatus = register?.status

        const response: any = await CertificateQueue.findByIdAndUpdate(params.id, params, { useFindAndModify: false, new: true })
        console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++\n\r");

        this.checkRetryCertificate({ certificateQueueId: params.id, lastStatus })

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            certificateQueue: {
              _id: response._id,
              status: response.status,
              certificate: response.certificate,
              auxiliar: response.auxiliar,
              certificateConsecutive: response.certificateConsecutive,
              certificateType: response.certificateType,
              notificationSent: response.notificationSent
            }
          }
        })

      } else {
        if (!moduleEnabled && !force) return responseUtility.buildResponseFailed('json', null, {message: 'Módulo deshabilitado. Consulte con el administrador.'})
        console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++");
        console.log("INSERT certificate queue");
        console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++");
        console.log(params);
        console.log("AuxiliarID:" + params.auxiliar);

        let totalResponse = [];
        let select = 'id user courseID course_scheduling enrollmentCode';

        // Multiple request from List in front
        if (params.users !== undefined) {
          for await (const userId of params?.users) {
            const exist = await CertificateQueue.findOne({ userId: userId, courseId: params.courseId, auxiliar: params.auxiliar, certificateConsecutive: params.certificateConsecutive });
            if (exist) return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'certificate.queue.already_exists', params: { userid: userId, courseid: params.courseId } } });

            let consecutive = '';
            const enrollmentRegisters = await Enrollment.findOne({ user: userId, course_scheduling: params.courseId }).select(select);
            console.log('Enrollment');
            console.log(enrollmentRegisters);

            // seguro en caso de no tener Código de enrolamiento
            consecutive = enrollmentRegisters.enrollmentCode ? enrollmentRegisters.enrollmentCode : '0';

            const response: any = await CertificateQueue.create({
              courseId: params.courseId,
              userId: userId,
              auxiliar: params.auxiliar,
              status: params.status,
              certificateType: params.certificateType,
              certificateConsecutive: consecutive,
              certificateModule: ''
            });

            let certificateQueueResponse = {
              _id: response.id,
              courseId: response.courseId,
              userId: response.userId,
              auxiliar: response.auxiliar,
              // certificateType: response.certificateType,
              // certificateModule: response.certificateModule,
              status: response.status
            }

            totalResponse.push(certificateQueueResponse);

            // if (params.users.length == 1) {
            //   return responseUtility.buildResponseSuccess('json', null, {
            //     additional_parameters: {
            //       certificateQueue: certificateQueueResponse
            //     }
            //   });
            // }
            // else
            //   totalResponse.push(certificateQueueResponse);

          };
        }

        console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++\n\r");

        if (totalResponse.length > 0) {
          this.sendToProcess(totalResponse.filter((item) => item._id && item.status === 'New').map((item) => item._id))
        }
        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            certificateQueue: {
              totalResponse
            }
          }
        });
      }

    } catch (e) {
      console.log('certificateQueueService-InsertOrUpdate-error', e)
      return responseUtility.buildResponseFailed('json', null,
        {
          additional_parameters: {
            process: 'insertOrUpdate()',
            error: e.message
          }
        })
    }
  }

  public sendToProcess = (certificatesQueue: string[]) => {
    console.log('Init SendToProcess', certificatesQueue)
    certificatesQueue.map((certificateQueue: string) => {
      this.processCertificateQueue({
        certificateQueueId: certificateQueue,
        output: 'process'
      })
    })
  }


  /**
   * Metodo que permite listar todos los registros
   * @param [filters] Estructura de filtros para la consulta
   * @returns
   */
  public list = async (filters: ICertificateQueueQuery = {}) => {

    const paging = (filters.pageNumber && filters.nPerPage) ? true : false

    const pageNumber = filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage = filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let select = 'id courseId userId auxiliar status certificateConsecutive certificateType certificateModule certificate message notificationSent created_at certificateSetting'
    if (filters.select) {
      select = filters.select
    }

    let where = {}

    if (filters.search) {
      const search = filters.search
      where = {
        ...where,
        $or: [
          { name: { $regex: '.*' + search + '.*', $options: 'i' } },
        ]
      }
    }

    if (filters?.courseId) {
      where['courseId'] = filters.courseId
    }
    if (filters?.userId) {
      where['userId'] = filters.userId
    }
    if (filters?.auxiliar) {
      where['auxiliar'] = filters.auxiliar
    }
    if (filters?.status) {
      where['status'] = filters.status
    }

    let registers = []
    try {
      registers = await CertificateQueue.find(where)
        .select(select)
        .skip(paging ? (pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0) : null)
        .limit(paging ? nPerPage : null)
    } catch (e) { }

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        certificateQueue: [
          ...registers
        ],
        total_register: (paging) ? await CertificateQueue.find(where).count() : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    })
  }


  public fetchItems = async (filters: ICertificateQueueQuery = {}) => {

    const paging = (filters.pageNumber && filters.nPerPage) ? true : false

    const pageNumber = filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage = filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let select = 'id courseId userId auxiliar status certificateType certificateModule certificate message notificationSent'
    if (filters.select) {
      select = filters.select
    }

    let where = {}

    if (filters.search) {
      const search = filters.search
      where = {
        ...where,
        $or: [
          { name: { $regex: '.*' + search + '.*', $options: 'i' } },
        ]
      }
    }

    let registers = []
    try {
      registers = await CertificateQueue.find(where)
        .select(select)
        .skip(paging ? (pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0) : null)
        .limit(paging ? nPerPage : null)
    } catch (e) { }

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        certificateQueue: [
          ...registers
        ],
        total_register: (paging) ? await CertificateQueue.find(where).count() : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    })
  }

  /**
   * @INFO Obtener el numero de certificados emitidos por mes (últimos 12 meses por defecto)
   * @returns
   */
  public certificateGeneratedByMonth = async (params?: ParamsCertificateGeneratedByMonth) => {
    try {
      // Fechas para filtrar
      const startDate = new Date();
      startDate.setMonth(params.months ? startDate.getMonth() - params.months : startDate.getMonth() - 12);
      const endDate = new Date();

      // Obtener los certificados generados por mes
      const certificatesGeneratedResponse = await CertificateQueue.find({ 'certificate.date': { $gte: startDate, $lt: endDate }, status: 'Complete' });
      let certificatesGenerated: { date_ms: number, certificates: number, dateFormated: string }[] = [];
      if (certificatesGeneratedResponse && certificatesGeneratedResponse?.length) {
        certificatesGeneratedResponse.forEach((certificate: any) => {
          const dateFormated = moment(certificate.certificate.date).format('YYYY-MM');
          const idx = certificatesGenerated.findIndex((cc) => cc.dateFormated === dateFormated);
          if (idx >= 0) {
            certificatesGenerated[idx].certificates += 1;
          } else {
            certificatesGenerated.push({
              date_ms: (new Date(certificate.certificate.date)).getTime(),
              certificates: 1,
              dateFormated
            });
          }
        });
      }

      // Ordenar el array
      certificatesGenerated = certificatesGenerated.sort((a, b) => a.date_ms - b.date_ms);

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          certificatesGenerated,
        }
      })
    } catch (e) {
      console.log('courseSchedulingDataService => schedulingConfirmedByMonth error: ', e);
      return responseUtility.buildResponseFailed('json');
    }
  }


  /**
* Metodo que permite hacer borrar un registro
* @param params Filtros para eliminar
* @returns
*/
  public delete = async (params: ICertificateQueueDelete) => {
    try {
      const find = await CertificateQueue.findOne({ _id: params.id })
      if (!find) return responseUtility.buildResponseFailed('json', null, { error_key: 'certificate.queue.not_found' })

      await find.delete()

      return responseUtility.buildResponseSuccess('json')
    } catch (error) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  public processCertificateQueue = async (params: IProcessCertificateQueue) => {
    try {
      const output = params.output || 'process'
      const force = params.force || false

      const where = {}
      console.log({ params })
      if (params?.certificateQueueId) {
        where['_id'] = params.certificateQueueId
      } else if (params?.certificateQueueIds) {
        where['_id'] = {$in: params?.certificateQueueIds}
      }
      if (params?.courseId) {
        where['courseId'] = params.courseId
      }
      if (params?.userId) {
        where['userId'] = params.userId
      }
      if (params?.auxiliar) {
        where['auxiliar'] = params.auxiliar
      }
      if (params?.status) {
        where['status'] = params.status
      }

      if (Object.keys(where).length === 0) return responseUtility.buildResponseFailed('json', null, {message: `Se deben proporcionar filtros para la busqueda`, code: 400})

      const certificateQueuesResponse = await CertificateQueue.find(where)

      // Filtrar los certificados que no han sido pagados
      const certificateQueues = []
      for (const certificate of certificateQueuesResponse) {
        if (certificate?.needPayment) {
          const certificateWasPaid = await transactionService.certificateWasPaid(certificate?._id?.toString())
          if (!certificateWasPaid) continue;
        }
        certificateQueues.push(certificate)
      }

      if (output === 'query') {
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          certificateQueues
        }})
      }

      if (certificateQueues.length === 0) return responseUtility.buildResponseFailed('json', null, {message: `No hay certificados a procesar`, code: 400})

      const logs = ["Init Task: Certificate Processor "]

      const moduleEnabled = customs?.modules?.certificate?.enabled !== undefined ? customs?.modules?.certificate?.enabled : true
      if (!moduleEnabled && !force) return responseUtility.buildResponseFailed('json', null, {message: 'Módulo deshabilitado. Consulte con el administrador.'})

      for (const certificate of certificateQueues) {
        if (certificate?.status === 'New') {
          logs.push(`Certificate ${certificate._id} (${certificate?.status}) - process started`)
          try {
            let respSetCertificate: any = await certificateService.createCertificate({
              certificateQueueId: certificate._id,
              courseId: certificate.courseId,
              userId: certificate.userId,
              auxiliarId: certificate.auxiliar,
              certificateConsecutive: certificate.certificateConsecutive,
              certificateSettingId: certificate?.certificateSetting || undefined
            });
            if (respSetCertificate.status === "error") {
              logs.push(`Certificate ${certificate._id} (${certificate?.status}) - process ended with error`)
              logs.push(respSetCertificate)
            }
            else {
              logs.push(`Certificate ${certificate._id} (${certificate?.status}) - process ended successful`)
            }
          } catch (err) {
            logs.push(`Certificate ${certificate._id} (${certificate?.status}) - process failed`)
            logs.push(err?.message)
          }
        } else if (certificate?.status === 'Re-issue') {
          logs.push(`Certificate ${certificate._id} (${certificate?.status}) process started`)

          try {
            let respPutCertificate: any = await certificateService.editCertificate({
              certificateQueueId: certificate._id,
              courseId: certificate.courseId,
              userId: certificate.userId,
              auxiliarId: certificate.auxiliar,
              certificateConsecutive: certificate.certificateConsecutive,
              certificateHash: certificate.certificate.hash,
              certificateType: certificate.certificateType
            });
            if (respPutCertificate.status === "error") {
              logs.push(`Certificate ${certificate._id} (${certificate?.status}) - process ended with error`)
              logs.push(respPutCertificate)
            }
            else {
              logs.push(`Certificate ${certificate._id} (${certificate?.status}) - process ended successful`)
            }
          } catch (err) {
            logs.push(`Certificate ${certificate._id} (${certificate?.status}) - process failed`)
            logs.push(err?.message)
          }
        } else if (certificate?.status === 'Requested') {
          logs.push(`Certificate ${certificate._id} (${certificate?.status}) process started`)

          try {
            let queuePreview: ICertificatePreview = {
              certificate_queue: certificate._id.toString(),
              hash: certificate.certificate.hash,
              format: 2,
              template: 1,
              updateCertificate: true,
            };

            //Get preview of recent certificate
            let responsePreviewCertificate: any = await certificateService.previewCertificate(queuePreview);

            if (responsePreviewCertificate.status == 'error') {
              logs.push(`Certificate ${certificate._id} (${certificate?.status}) - process ended with error`)
              logs.push(responsePreviewCertificate)
            } else {
              logs.push(`Certificate ${certificate._id} (${certificate?.status}) - process ended successful`)
            }

          } catch (err) {
            logs.push(`Certificate ${certificate._id} (${certificate?.status}) - process failed`)
            logs.push(err?.message)
          }
        } else if (['In-process', 'Error'].includes(certificate?.status)) {
          try {
            logs.push(`Certificate ${certificate._id} (${certificate?.status}) process started`)
            await CertificateQueue.findByIdAndUpdate(certificate._id, {
              status: 'In-process'
            })
            try {
              let respSetCertificate: any = await certificateService.createCertificate({
                certificateQueueId: certificate._id,
                courseId: certificate.courseId,
                userId: certificate.userId,
                auxiliarId: certificate.auxiliar,
                certificateConsecutive: certificate.certificateConsecutive,
                certificateSettingId: certificate?.certificateSetting || undefined,
                onlyThisCertificate: certificate.certificateConsecutive
              });
              if (respSetCertificate.status === "error") {
                logs.push(`Certificate ${certificate._id} (${certificate?.status}) - process ended with error`)
                logs.push(respSetCertificate)
              }
              else {
                logs.push(`Certificate ${certificate._id} (${certificate?.status}) - process ended successful`)
              }
            } catch (err) {
              logs.push(`Certificate ${certificate._id} (${certificate?.status}) - process failed`)
              logs.push(err?.message)
            }
            logs.push(`Certificate ${certificate._id} (${certificate?.status}) - process ended successful`)
          } catch (err) {
            logs.push(`Certificate ${certificate._id} (${certificate?.status}) - process failed`)
            logs.push(err?.message)
          }
        }
      }

      logs.push(`End Task: Certificate Processor`)
      const certificateQueuesAfter = await CertificateQueue.find(where).select()
      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          certificateQueues: certificateQueuesAfter,
          logs
        }
      })
    } catch (err) {
      return responseUtility.buildResponseFailed('json', null, {additional_parameters: {error: err?.message}})
    }
  }

  public checkPendingCertificationsWithPayment = async ({
    user
  }) => {
    try {
      const certificate = await CertificateQueue.findOne({
        needPayment: true,
        userNotified: false,
        status: CertificateQueueStatus.NEW,
        userId: user,
        certificateSetting: { $exists: true }
      })
      .select('courseId status certificateSetting certificate')
      .populate([
        { path: 'courseId', select: 'metadata program', populate: [
          { path: 'program', select: 'name code moodle_id' }
        ]},
        {
          path: 'certificateSetting', select: 'certificateName'
        }
      ])

      if (!certificate) return responseUtility.buildResponseFailed('json')

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          certificate
        }
      })
    } catch (e) {
      console.log(`CertificateService -> checkPendingCertificationsWithPayment -> ERROR: `, e)
      return responseUtility.buildResponseFailed('json')
    }
  }

  public certificatePayment = async ({ certificateQueueId, currencyType, certificateInfo }: ICertificatePaymentParams) => {
    const transactionResponse: any = await transactionService.insertOrUpdate({})
    if (transactionResponse.status === 'error') return responseUtility.buildResponseFailed('json', null, {
      code: 500,
      message: 'Error al generar la transacción'
    })
    const transaction: ITransaction = transactionResponse.transaction
    try {
      const erpResponse: any = await erpService.getCertificatePriceFromCertificateQueue({ certificateQueueId }, true)
      if (erpResponse?.status === 'error') {
        await transactionService.delete(transaction._id)
        return erpResponse
      }
      const { price, course, program } = erpResponse
      const minutesLimit = efipaySetup.payment_limit_minutes
      const limitDate = moment().add(minutesLimit, 'minutes').format('YYYY-MM-DD')
      const pictureUrl = courseService.coverUrl(course as any)
      const campusUrl = customs.campus_virtual

      const iva = price[currencyType] * 0.19
      const totalPrice = Math.trunc(iva + price[currencyType])

      const paymentParams: IGeneratePaymentParams = {
        payment: {
          amount: totalPrice,
          checkout_type: EfipayCheckoutType.REDIRECT,
          currency_type: currencyType,
          description: program.name,
          selected_taxes: [EfipayTaxes.IVA_19]
        },
        advanced_options: {
          has_comments: false,
          limit_date: limitDate,
          picture: pictureUrl,
          references: [certificateQueueId],
          result_urls: {
            approved: `${campusUrl}/payment-status/${transaction._id}`,
            pending: `${campusUrl}/payment-status/${transaction._id}`,
            rejected: `${campusUrl}/payment-status/${transaction._id}`,
            // TODO: Transactions - Replace webhook URL
            webhook: 'https://testfunction-6d4wmyy6ja-uc.a.run.app'
          }
        },
        office: efipaySetup.office_number
      }

      const paymentResponse = await efipayService.generatePayment(paymentParams)

      if (!paymentResponse?.payment_id) {
        await transactionService.delete(transaction._id)
        return responseUtility.buildResponseFailed('json', null, {
          code: 500,
          message: 'Error al generar la transacción'
        })
      }

      transaction.id = transaction._id
      transaction.certificateQueue = certificateQueueId
      transaction.paymentId = paymentResponse.payment_id
      transaction.redirectUrl = paymentResponse.url
      transaction.status = TransactionStatus.IN_PROCESS
      transaction.certificateInfo = certificateInfo
      transaction.baseAmount = price[currencyType]
      transaction.taxesAmount = iva
      transaction.totalAmount = totalPrice
      const updateResponse = await transactionService.insertOrUpdate(transaction)
      if (updateResponse.status === 'error') {
        await transactionService.delete(transaction._id)
        return responseUtility.buildResponseFailed('json', null, {
          code: 500,
          message: 'Error al crear la transacción'
        })
      }

      // Send transaction created email to user
      const certificateQueue = await CertificateQueue.findOne({ _id: certificateQueueId })
        .populate({ path: 'userId', select: 'profile email' })
        .populate({ path: 'certificateSetting', select: 'certificateName' })
      if (certificateQueue) {
        await transactionNotificationsService.sendTransactionCreated({
          paymentUrl: paymentResponse.url,
          transactionId: transaction._id,
          users: [
            {
              name: `${certificateQueue?.userId?.profile?.first_name} ${certificateQueue?.userId?.profile?.last_name}`,
              email: certificateQueue?.userId?.email
            }
          ],
          courseName: program.name,
          certificateName: certificateQueue?.certificateSetting?.certificateName
        })
      }


      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          redirectUrl: paymentResponse.url
        }
      })

    } catch (e) {
      console.log(`CertificateQueueService -> certificatePayment -> ERROR: ${e}`)
      await transactionService.delete(transaction._id)
      return responseUtility.buildResponseFailed('json')
    }
  }

  private checkRetryCertificate = async ({ certificateQueueId, lastStatus }) => {
    const certificateQueue = CertificateQueue.findOne({ _id: certificateQueueId })
    const maxRetries = certificateQueue?.retryConfig?.maxRetries
    const currentAttempt = certificateQueue?.retryConfig?.currentAttempt ? certificateQueue?.retryConfig?.currentAttempt : 0
    const hasChangedToError = lastStatus !== 'Error' && certificateQueue?.status === 'Error'
    if (hasChangedToError && maxRetries && maxRetries > currentAttempt) {
      const baseToRetry = 10
      const newAttempt = currentAttempt + 1
      const timeToWait = (baseToRetry ** newAttempt) * 1000
      setTimeout(() => {
        certificateService.reGenerateCertification({
          certificateQueueId,
          courseId: certificateQueue?.courseId,
          userId: certificateQueue?.userId,
          isMultiple: certificateQueue?.certificateSetting ? true : false,
          currentAttempt: newAttempt,
        })
      }, timeToWait)
    }
  }

}

export const certificateQueueService = new CertificateQueueService();
export { CertificateQueueService as DefaultAdminCertificateQueueCertificateQueueService };
