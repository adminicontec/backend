// @import_dependencies_node Import libraries
// @end

// @import services
import { enrollmentService } from '@scnode_app/services/default/admin/enrollment/enrollmentService';
import { customLogService } from '@scnode_app/services/default/admin/customLog/customLogService';
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import { PurchasedPlace, Transaction, User, CourseScheduling } from '@scnode_app/models';
// @end

// @import types
import { IPurchasedPlace, ICreatePurchasedPlacesFromTransaction, IAssignPurchasedPlace, IGetPurchasedPlaces, PurchasedPlaceStatus } from '@scnode_app/types/default/admin/purchasedPlace/purchasedPlaceTypes';
import { BUY_ACTION, IEnrollment } from '@scnode_app/types/default/admin/enrollment/enrollmentTypes';
import { TransactionStatus } from '@scnode_app/types/default/admin/transaction/transactionTypes';
import { IUser } from '@scnode_app/types/default/admin/user/userTypes';
import { ICourseScheduling } from '@scnode_app/types/default/admin/enrollment/enrollmentTrackingTypes';
// @end

class PurchasedPlaceService {
  constructor() {}

  public insertOrUpdate = async (params: IPurchasedPlace) => {
    try {
      if (params.id) {
        const register = await PurchasedPlace.findOne({ _id: params.id });
        if (!register) return responseUtility.buildResponseFailed('json');

        const filteredParams = Object.entries(params).reduce((acc, [key, value]) => {
          if (value !== undefined) acc[key] = value;
          return acc;
        }, {} as any);

        const merged = {
          ...register.toObject(),
          ...filteredParams
        };

        delete merged._id;

        const response: any = await PurchasedPlace.findByIdAndUpdate(params.id, { $set: merged }, {
          useFindAndModify: false,
          new: true,
        });

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            purchasedPlace: response
          }
        });
      } else {
        const response: any = await PurchasedPlace.create(params);

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            purchasedPlace: response
          }
        });
      }
    } catch (e) {
      console.log(`PurchasedPlaceService -> insertOrUpdate -> ERROR: `, e);
      return responseUtility.buildResponseFailed('json');
    }
  }

  public createFromTransaction = async ({ transactionId }: ICreatePurchasedPlacesFromTransaction) => {
    try {
      const transaction = await Transaction.findOne({ _id: transactionId });
      if (!transaction || !transaction.shoppingCartItems || transaction.shoppingCartItems.length === 0) {
        return responseUtility.buildResponseFailed('json', null, {
          message: 'Transacción no válida o sin items'
        });
      }

      if (transaction.status !== TransactionStatus.SUCCESS) {
        return responseUtility.buildResponseFailed('json', null, {
          message: 'La transacción no ha sido aprobada'
        });
      }

      // Verificar si ya existen cupos creados para esta transacción
      const existingPlaces = await PurchasedPlace.find({ transaction: transactionId });
      if (existingPlaces.length > 0) {
        return responseUtility.buildResponseSuccess('json', null, {
          message: 'Los cupos ya fueron creados para esta transacción',
          additional_parameters: {
            purchasedPlaces: existingPlaces
          }
        });
      }

      const createdPlaces = [];

      // Procesar cada item del carrito
      for (const item of transaction.shoppingCartItems) {
        try {
          // Buscar el servicio/curso
          const courseScheduling = await CourseScheduling.findOne({ _id: item.identifier })
            .populate({ path: 'program', select: 'name code' });

          if (!courseScheduling) {
            await customLogService.create({
              label: 'pps - cft - course not found',
              description: 'Curso no encontrado al crear cupos',
              content: {
                identifier: item.identifier,
                transactionId
              }
            });
            continue;
          }

          // Determinar cuántos cupos crear
          let placesToCreate = item.numberOfPlaces || 1;

          // Crear los cupos
          for (let i = 0; i < placesToCreate; i++) {
            const placeData: IPurchasedPlace = {
              transaction: transactionId,
              buyer: transaction.buyer,
              courseScheduling: courseScheduling._id,
              programCode: courseScheduling.program?.code || item.programCode,
              programName: courseScheduling.program?.name || item.description,
              status: PurchasedPlaceStatus.AVAILABLE,
              metadata: {
                buyAction: item.buyAction,
                originalItem: item
              }
            };

            const placeResult: any = await this.insertOrUpdate(placeData);
            if (placeResult.status === 'success') {
              createdPlaces.push(placeResult.purchasedPlace);
            }
          }
        } catch (itemError) {
          await customLogService.create({
            label: 'pps - cft - item processing error',
            description: 'Error al procesar item del carrito',
            content: {
              errorMessage: itemError.message,
              item,
              transactionId
            }
          });
        }
      }

      return responseUtility.buildResponseSuccess('json', null, {
        message: 'Cupos creados exitosamente',
        additional_parameters: {
          purchasedPlaces: createdPlaces
        }
      });
    } catch (e) {
      console.log(`PurchasedPlaceService -> createFromTransaction -> ERROR: `, e);
      await customLogService.create({
        label: 'pps - cft - general error',
        description: 'Error general al crear cupos desde transacción',
        content: {
          errorMessage: e.message,
          transactionId
        }
      });
      return responseUtility.buildResponseFailed('json');
    }
  }

  public assignPlace = async ({ purchasedPlaceId, userId, enrollmentId }: IAssignPurchasedPlace) => {
    try {
      const place = await PurchasedPlace.findOne({ _id: purchasedPlaceId });
      if (!place) {
        return responseUtility.buildResponseFailed('json', null, {
          message: 'Cupo no encontrado'
        });
      }

      if (place.status !== PurchasedPlaceStatus.AVAILABLE) {
        return responseUtility.buildResponseFailed('json', null, {
          message: 'El cupo no está disponible para asignación'
        });
      }

      // Corregido: Usar el método findByIdAndUpdate directamente en lugar de insertOrUpdate
      const updateResult = await PurchasedPlace.findByIdAndUpdate(
        purchasedPlaceId,
        {
          $set: {
            status: PurchasedPlaceStatus.ASSIGNED,
            assignedTo: userId,
            assignedAt: new Date(),
            ...(enrollmentId ? { enrollment: enrollmentId } : {})
          }
        },
        { new: true }
      );

      if (!updateResult) {
        return responseUtility.buildResponseFailed('json', null, {
          message: 'Error al actualizar el cupo'
        });
      }

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          purchasedPlace: updateResult
        }
      });
    } catch (e) {
      console.log(`PurchasedPlaceService -> assignPlace -> ERROR: `, e);
      return responseUtility.buildResponseFailed('json');
    }
  }

  public getPlaces = async (params: IGetPurchasedPlaces) => {
    try {
      const query: any = {};

      if (params.buyerId) {
        query.buyer = params.buyerId;
      }

      if (params.status) {
        if (Array.isArray(params.status)) {
          query.status = { $in: params.status };
        } else {
          query.status = params.status;
        }
      }

      if (params.transactionId) {
        query.transaction = params.transactionId;
      }

      if (params.courseSchedulingId) {
        query.courseScheduling = params.courseSchedulingId;
      }

      if (params.programCode) {
        query.programCode = params.programCode;
      }

      const places = await PurchasedPlace.find(query)
        .populate('buyer', 'email profile.first_name profile.last_name')
        .populate('assignedTo', 'email profile.first_name profile.last_name')
        .populate('courseScheduling', 'metadata.service_id program')
        .populate({
          path: 'courseScheduling',
          populate: {
            path: 'program',
            select: 'name code'
          }
        })
        .populate('enrollment')
        .sort({ created_at: -1 });

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          purchasedPlaces: places
        }
      });
    } catch (e) {
      console.log(`PurchasedPlaceService -> getPlaces -> ERROR: `, e);
      return responseUtility.buildResponseFailed('json');
    }
  }

  public processAutoAssignments = async (transactionId: string) => {
    try {
      // Obtener todos los cupos de la transacción
      const placesResponse: any = await this.getPlaces({
        transactionId,
        status: PurchasedPlaceStatus.AVAILABLE
      });

      if (placesResponse.status !== 'success' || !placesResponse.purchasedPlaces?.length) {
        return;
      }

      const places = placesResponse.purchasedPlaces;

      // Agrupar por buyAction
      const placesByBuyAction = places.reduce((acc, place) => {
        const buyAction = place.metadata?.buyAction || '';
        if (!acc[buyAction]) {
          acc[buyAction] = [];
        }
        acc[buyAction].push(place);
        return acc;
      }, {});

      // Procesar cupos para el comprador (FOR_MYSELF o FOR_ME_AND_OTHERS)
      const buyerPlaces = [
        ...(placesByBuyAction[BUY_ACTION.FOR_MYSELF] || []),
        ...(placesByBuyAction[BUY_ACTION.FOR_ME_AND_OTHERS] || []).slice(0, 1) // Solo el primer cupo si es FOR_ME_AND_OTHERS
      ];

      if (buyerPlaces.length > 0) {
        for (const place of buyerPlaces) {
          await this.enrollAndAssignPlace(place);
        }
      }

      return responseUtility.buildResponseSuccess('json');
    } catch (e) {
      console.log(`PurchasedPlaceService -> processAutoAssignments -> ERROR: `, e);
      await customLogService.create({
        label: 'pps - paa - error',
        description: 'Error al procesar asignaciones automáticas',
        content: {
          errorMessage: e.message,
          transactionId
        }
      });
      return responseUtility.buildResponseFailed('json');
    }
  }

  private enrollAndAssignPlace = async (place) => {
    try {
      // Obtener información del comprador y del curso
      const [buyer, courseScheduling]: [IUser, ICourseScheduling] = await Promise.all([
        User.findOne({ _id: place.buyer }).select('_id email profile username phoneNumber'),
        CourseScheduling.findOne({ _id: place.courseScheduling }).select('_id moodle_id program')
          .populate('program', 'name')
      ]);

      if (!buyer || !courseScheduling) {
        throw new Error('No se encontró el comprador o el curso');
      }

      // Crear la matrícula
      const enrollmentParams: IEnrollment = {
        email: buyer.email,
        user: buyer.username,
        password: buyer.username,
        documentType: buyer.profile?.doc_type,
        documentID: buyer.profile?.doc_number || buyer.username,
        firstname: buyer.profile?.first_name,
        lastname: buyer.profile?.last_name,
        phoneNumber: buyer.phoneNumber,
        courseID: courseScheduling.moodle_id.toString(),
        origin: "ShoppingCart",
        sendEmail: true,
        trackingEnrollment: true,
      };
      const enrollmentResult: any = await enrollmentService.insertOrUpdate(enrollmentParams);

      if (enrollmentResult.status === 'error') {
        throw new Error(`Error al crear la matrícula: ${enrollmentResult.message}`);
      }

      // Asignar el cupo
      await this.assignPlace({
        purchasedPlaceId: place._id,
        userId: buyer._id,
        enrollmentId: enrollmentResult.enrollment?._id
      });

      return true;
    } catch (error) {
      await customLogService.create({
        label: 'pps - eap - error',
        description: 'Error al matricular y asignar cupo',
        content: {
          errorMessage: error.message,
          placeId: place._id
        }
      });
      return false;
    }
  }
}

export const purchasedPlaceService = new PurchasedPlaceService();
export { PurchasedPlaceService as DefaultAdminPurchasedPlacePurchasedPlaceService };