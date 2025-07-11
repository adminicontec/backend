// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { CertificateQueue, Transaction } from '@scnode_app/models';
import { ITransaction, IUpdateTransactionWithNewCertificateQueueIdParams, TransactionStatus } from '@scnode_app/types/default/admin/transaction/transactionTypes';
import { customLogService } from '@scnode_app/services/default/admin/customLog/customLogService';
import { efipayService } from '@scnode_app/services/default/efipay/efipayService';
import { EfipayTransactionStatus, IOnTransactionSuccessParams } from '@scnode_app/types/default/efipay/efipayTypes';
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes';
import { certificateQueueService } from '@scnode_app/services/default/admin/certificateQueue/certificateQueueService';
import { erpService } from '@scnode_app/services/default/erp/erpService';
import { transactionNotificationsService } from '@scnode_app/services/default/admin/transaction/transactionNotificationsService';
import { certificateNotifiactionsService } from '@scnode_app/services/default/admin/certificate/certificateNotifiactionsService';
import { purchasedPlaceService } from '../purchasedPlace/purchasedPlaceService';
import { notificationEventService } from '../../events/notifications/notificationEventService';
// @end

// @import models
// @end

// @import types
// @end

class TransactionService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  public insertOrUpdate = async (params: ITransaction) => {

    try {
      if (params.id) {
        const register = await Transaction.findOne({_id: params.id})
        if (!register) return responseUtility.buildResponseFailed('json')

          const filteredParams = Object.entries(params).reduce((acc, [key, value]) => {
            if (value !== undefined) acc[key] = value;
            return acc;
          }, {} as any);

        const merged = {
          ...register.toObject(),
          ...filteredParams
        }

        delete merged._id;

        const response: any = await Transaction.findByIdAndUpdate(params.id, { $set: merged }, {
          useFindAndModify: false,
          new: true,
        })

        await customLogService.create({
          label: 'transactions - update after merge',
          description: 'Transacción actualizada con merge seguro',
          content: {
            transactionId: params.id,
            merged,
            register,
            filteredParams
          }
        })
        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            transaction: response
          }
        })

      } else {
        const response: any = await Transaction.create(params)

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            transaction: response
          }
        })
      }

    } catch (e) {
      console.log(`TransactionService -> insertOrUpdate -> ERROR: `, e);
      return responseUtility.buildResponseFailed('json')
    }
  }

  public findBy = async (params: IQueryFind) => {

    try {
      let where = {}
      if (params.where && Array.isArray(params.where)) {
        params.where.map((p) => where[p.field] = p.value)
      }


      let select = 'id status certificateQueue certificateInfo baseAmount taxesAmount totalAmount shoppingCartItems billingInfo'
      if (params.query === QueryValues.ALL) {
        const registers = await Transaction.find(where).select(select)
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          transactions: registers
        }})
      } else if (params.query === QueryValues.ONE) {
        const register = await Transaction.findOne(where)
          .select(select)
          .populate({ path: 'certificateQueue', select: 'certificate certificateSetting', populate: {
            path: 'certificateSetting', select: 'certificateName'
          }})
        if (!register) return responseUtility.buildResponseFailed('json', null, {
          code: 404,
          message: 'Transaction not found'
        })
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          transaction: register
        }})
      }

      return responseUtility.buildResponseFailed('json')
    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  public delete = async (transactionId: string) => {
    try {
      const find: any = await Transaction.findOne({ _id: transactionId })
      if (!find) return responseUtility.buildResponseFailed('json', null, {
        code: 404,
        message: 'Transaction not found'
      })

      await find.delete()
    } catch (e) {
      console.log(`TransactionService -> delete -> ERROR: `, e)
      return responseUtility.buildResponseFailed('json')
    }
  }

  public getTransactionsFromCertificateQueue = async ({
    certificateQueueId
  }) => {
    const transactions = await Transaction.find({
      certificateQueue: certificateQueueId
    })
    return transactions?.length ? transactions : []
  }

  public certificateWasPaid = async (certificateQueueIds: string | string[]) => {
    if (!certificateQueueIds?.length) return false
    if (typeof certificateQueueIds === 'string') {
      certificateQueueIds = [certificateQueueIds]
    }
    for (const certificateQueueId of certificateQueueIds) {
      const transaction = await Transaction.findOne({
        certificateQueue: certificateQueueId,
        status: TransactionStatus.SUCCESS,
      })
      if (!transaction) {
        return false
      }
    }
    return true
  }

  public certificateHasPendingTransaction = async (certificateQueueIds: string | string[]): Promise<{ status: boolean, url?: string }> => {
    if (!certificateQueueIds?.length) return {
      status: false
    }
    if (typeof certificateQueueIds === 'string') {
      certificateQueueIds = [certificateQueueIds]
    }
    for (const certificateQueueId of certificateQueueIds) {
      const transaction: ITransaction = await Transaction.findOne({
        certificateQueue: certificateQueueId,
        status: TransactionStatus.IN_PROCESS,
      })
      if (transaction) {
        return {
          status: true,
          url: transaction?.redirectUrl
        }
      }
    }
    return {
      status: false,
    }
  }

  public updateTransactionWithNewCertificateQueueId = async ({
    certificateQueueId,
    transactions,
  }: IUpdateTransactionWithNewCertificateQueueIdParams) => {
    if (!transactions?.length || !certificateQueueId) return false
    if (typeof transactions === 'string') {
      transactions = [transactions]
    }

    const transactionsUpdated = await Transaction.updateMany({
      _id: { $in: transactions }
    }, {
      $set: {
        certificateQueue: certificateQueueId,
      },
    })

    if (transactionsUpdated?.modifiedCount === transactions?.length) return true

    return false
  }

  public onTransactionSuccess = async (params: IOnTransactionSuccessParams, signature: string, bodyBuffer: Buffer) => {
    try {
      await customLogService.create({
        label: 'efps - ots - on transaction success',
        description: "On transaction success Efipay",
        content: {
          params,
          signature,
        },
      })
      if (!signature) {
        customLogService.create({
          label: 'efps - nsf - no signature found',
          description: "No signature found",
          content: {
            params,
          },
        })
        return responseUtility.buildResponseFailed('json', null, {
          code: 400,
          message: 'No signature found'
        })
      }
      const transaction: ITransaction = await Transaction.findOne({ paymentId: params.checkout.payment_gateway_id })
      if (!transaction) {
        customLogService.create({
          label: 'efps - tnf - transaction not found',
          description: "Transaction not found",
          content: {
            params,
          },
        })
        return responseUtility.buildResponseFailed('json', null, {
          code: 404,
          message: 'Transaction not found'
        })
      }

      const signatureIsValid = efipayService.validateSignature(signature, bodyBuffer)
      if (!signatureIsValid) {
        customLogService.create({
          label: 'efps - esnv - error signature is not valid',
          description: "Error signature is not valid",
          content: {
            params,
            transaction: {
              id: transaction._id,
              status: params.transaction.status
            },
            signature,
          },
        })
        return responseUtility.buildResponseFailed('json', null, {
          code: 400,
          message: 'The signature is not valid'
        })
      }

      const result: any = await transactionService.insertOrUpdate({
        id: transaction._id,
        status: params.transaction.status as unknown as TransactionStatus,
        ...(params?.transaction?.transaction_details ? {
          paymentInfo: {
            name: params.transaction.transaction_details.name,
            identification_number: params.transaction.transaction_details.identification_number,
            identification_type: params.transaction.transaction_details.identification_type,
            email: params.transaction.transaction_details.email,
            phone: params.transaction.transaction_details.phone,
            address1: params.transaction.customer_payer.address_1,
            address2: params.transaction.customer_payer.address_2,
            city: params.transaction.customer_payer.city,
            country: params.transaction.customer_payer.country,
            state: params.transaction.customer_payer.state,
            zipCode: params.transaction.customer_payer.zip_code,
            authorization_code: params.transaction.authorization_code,
          }
        } : {})
      })
      if (result.status === 'error') {
        customLogService.create({
          label: 'efps - euts - error updating transaction status',
          description: "Error updating transaction status",
          content: {
            params,
            transaction: {
              id: transaction._id,
              status: params.transaction.status,
            },
            updateResult: result
          },
        })
        return responseUtility.buildResponseFailed('json', null, {
          code: 500,
          message: 'An error occurred while saving the transaction status'
        })
      }

      // Determinar el tipo de transacción y procesarla según corresponda
      if (transaction.shoppingCartItems && transaction.shoppingCartItems.length > 0) {
        // Procesar transacción de carrito de compras
        await this.processShoppingCartTransaction(result.transaction, params);
      } else if (transaction.certificateQueue) {
        // Procesar transacción de certificado (lógica existente)
        await this.processCertificateTransaction(result.transaction, params);
      } else {
        // Tipo de transacción desconocido o no especificado
        customLogService.create({
          label: 'efps - utt - unknown transaction type',
          description: "Unknown transaction type",
          content: {
            transactionId: transaction._id,
          },
        })
      }

      return responseUtility.buildResponseSuccess('json', null, {
        message: "Ok",
        code: 200,
      })

    } catch (e) {
      customLogService.create({
        label: 'efps - otse - on transaction success error',
        description: "On transaction success error",
        content: {
          errorMessage: e.message,
          params,
        },
      })
    }
  }

  // Nuevo método para procesar transacciones de certificados (lógica existente extraída)
  private processCertificateTransaction = async (transaction: ITransaction, params: IOnTransactionSuccessParams) => {
    try {
      const certificateQueue = await CertificateQueue.findOne({ _id: transaction?.certificateQueue })
        .populate({ path: 'userId', select: 'profile email username' })
        .populate({ path: 'certificateSetting', select: 'certificateName' })
        .populate({ path: 'courseId', populate: {
          path: 'program'
        } })
      const program = certificateQueue?.courseId?.program

      if (params.transaction.status === EfipayTransactionStatus.SUCCESS) {
        erpService.createInvoiceFromTransaction(transaction._id)
          .then((invoiceResponse: any) => {
            if (invoiceResponse?.status === 'error') {
              certificateNotifiactionsService.sendAdminErrorCertificate({
                errorMessage: 'Error al generar la factura',
                queryErrorMessage: typeof invoiceResponse?.errorContent === 'object' ? JSON.stringify(invoiceResponse?.errorContent) : invoiceResponse?.errorContent,
                certificateQueueId: certificateQueue?._id?.toString(),
                courseName: program?.name,
                docNumber: certificateQueue?.userId?.username,
                studentName: `${certificateQueue?.userId?.profile?.first_name} ${certificateQueue?.userId?.profile?.last_name}`,
              })
              certificateNotifiactionsService.sendErrorCertificate({
                certificateQueueId: certificateQueue?._id?.toString(),
                users: [
                  {
                    name: `${certificateQueue?.userId?.profile?.first_name} ${certificateQueue?.userId?.profile?.last_name}`,
                    email: certificateQueue?.userId?.email
                  }
                ],
                courseName: program?.name
              })
              return invoiceResponse
            }
          })
          .catch((e: any) => {
            customLogService.create({
              label: 'efps - otse - error creating invoice',
              description: 'Error al crear la factura con ERP',
              content: {
                errorMessage: e.message,
                transactionId: transaction._id,
              },
            })
          })
      }

      if (certificateQueue) {
        transactionNotificationsService.sendTransactionStatus({
          paymentType: 'certificate',
          additionalInfo: {
            certificateName: certificateQueue?.certificateSetting?.certificateName,
          },
          status: params.transaction.status as unknown as TransactionStatus,
          transactionId: transaction._id,
          users: [
            {
              name: `${certificateQueue?.userId?.profile?.first_name} ${certificateQueue?.userId?.profile?.last_name}`,
              email: certificateQueue?.userId?.email
            }
          ]
        }).then((response: any) => {
          customLogService.create({
            label: 'efps - otse - notification sent',
            description: 'Notificación de estado de transacción enviada exitosamente',
            content: {
              response,
              transactionId: transaction._id,
            },
          })
        }).catch((e: any) => {
          customLogService.create({
            label: 'efps - otse - error sending notification',
            description: 'Error al enviar el correo de notificación de transacción',
            content: {
              errorMessage: e.message,
              transactionId: transaction._id,
            },
          })
        })
      }

      if (params.transaction.status === EfipayTransactionStatus.SUCCESS) {
        certificateQueueService.sendToProcess([ transaction.certificateQueue ])
      }
    } catch (error) {
      customLogService.create({
        label: 'efps - pct - process certificate transaction error',
        description: 'Error al procesar transacción de certificado',
        content: {
          errorMessage: error.message,
          transactionId: transaction._id,
        },
      })
      throw error;
    }
  }

  private processShoppingCartTransaction = async (transaction: ITransaction, params: IOnTransactionSuccessParams) => {
    try {
      // 1. Si la transacción es SUCCESS debo crear una factura en el sistema ERP
      // 1.1 Si la creación de la factura en el sistema ERP falla debo enviar correo electronico a los administradores del ERP
      if (params.transaction.status === EfipayTransactionStatus.SUCCESS) {
        erpService.createInvoiceFromTransaction(transaction._id)
          .then((invoiceResponse: any) => {
            if (invoiceResponse?.status === 'error') {
              notificationEventService.sendNotificationErp({
                errorMessage: 'Error al generar la factura',
                queryErrorMessage: invoiceResponse?.errorContent ?
                  typeof invoiceResponse?.errorContent === 'object' ? JSON.stringify(invoiceResponse?.errorContent) : invoiceResponse?.errorContent :
                  invoiceResponse.message,
                transactionId: transaction.paymentId,
              })
              return invoiceResponse
            }
          })
          .catch((e: any) => {
            customLogService.create({
              label: 'efps - sct - shopping cart invoice exception',
              description: 'Excepción al crear la factura para compra de cursos',
              content: {
                errorMessage: e.message,
                transactionId: transaction._id,
              },
            })
          })
      }

      // 2. Enviar notificación de estado de la transacción al cliente
      await this.sendShoppingCartStatusNotification(transaction, params);

      // 3. Si la transacción es SUCCESS debo inscribir a los usuarios en los cursos correspondientes, en caso que sea de asignación propia.
      // 3.1 En caso que alguno de los cursos adquiridos sea para otra persona debo enviar otra notificación con los pasos a seguir.
      // TODO: Pendiente enviar segundo correo con instrucciones para el usuario cuando debe asignar cupos
      await this.processShoppingCartEnrollment(transaction, params);
    } catch (error) {
      customLogService.create({
        label: 'efps - sct - process shopping cart transaction error',
        description: 'Error al procesar transacción de carrito de compras',
        content: {
          errorMessage: error.message,
          transactionId: transaction._id,
        },
      })
      throw error;
    }
  }

  private processShoppingCartEnrollment = async (transaction: ITransaction, params: IOnTransactionSuccessParams) => {
    try {
      if (params.transaction.status === EfipayTransactionStatus.SUCCESS) {
        // 1. Crear los cupos para la transacción
        const createPlacesResult: any = await purchasedPlaceService.createFromTransaction({
          transactionId: transaction._id
        });

        if (createPlacesResult.status === 'error') {
          await customLogService.create({
            label: 'efps - sct - create places error',
            description: 'Error al crear los cupos para la transacción',
            content: {
              errorMessage: createPlacesResult.message,
              transactionId: transaction._id,
            },
          });
        }

        // 2. Procesar asignaciones automáticas (para el comprador)
        const autoAssignResult: any = await purchasedPlaceService.processAutoAssignments(transaction._id);

        if (autoAssignResult && autoAssignResult.status === 'error') {
          await customLogService.create({
            label: 'efps - sct - auto assign error',
            description: 'Error al procesar asignaciones automáticas',
            content: {
              errorMessage: autoAssignResult.message,
              transactionId: transaction._id,
            },
          });
        }
      }
    } catch (error) {
      customLogService.create({
        label: 'efps - sct - process shopping cart transaction error',
        description: 'Error al procesar transacción de carrito de compras',
        content: {
          errorMessage: error.message,
          transactionId: transaction._id,
        },
      })
      throw error;
    }
  }

  // Método para enviar notificación de estado de transacción
  private sendShoppingCartStatusNotification = async (transaction: ITransaction, params: IOnTransactionSuccessParams) => {
    try {
      transactionNotificationsService.sendTransactionStatus({
        paymentType: 'courses',
        status: params.transaction.status as unknown as TransactionStatus,
        transactionId: transaction._id,
        users: [{
          name: `${transaction?.paymentInfo?.name}`,
          email: transaction?.paymentInfo?.email
        }],
        additionalInfo: {
          courseNames: transaction.shoppingCartItems?.map(item => item.description).join(', ')
        }
      }).then((response: any) => {
        customLogService.create({
          label: 'efps - otse - notification sent',
          description: 'Notificación de estado de transacción enviada exitosamente',
          content: {
            response,
            transactionId: transaction._id,
          },
        })
      }).catch((e: any) => {
        customLogService.create({
          label: 'efps - otse - error sending notification',
          description: 'Error al enviar el correo de notificación de transacción',
          content: {
            errorMessage: e.message,
            transactionId: transaction._id,
          },
        })
      })
    } catch (error) {
      customLogService.create({
        label: 'efps - scsn - status notification error',
        description: 'Error al enviar notificación de estado de transacción',
        content: {
          errorMessage: error.message,
          transactionId: transaction._id,
        },
      })
    }
  }

}

export const transactionService = new TransactionService();
export { TransactionService as DefaultAdminTransactionTransactionService };
