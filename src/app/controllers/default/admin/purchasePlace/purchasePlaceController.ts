
// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import services
import { purchasedPlaceService } from '@scnode_app/services/default/admin/purchasedPlace/purchasedPlaceService';
import { enrollmentService } from '@scnode_app/services/default/admin/enrollment/enrollmentService';
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
// @end

// @import types
// @end

class PurchasedPlaceController {
  constructor() {}

  public getPlaces = async (req: Request, res: Response) => {
    const result = await purchasedPlaceService.getPlaces(req.query);
    return responseUtility.sendResponseFromObject(res, result);
  }

  public assignPlace = async (req: Request, res: Response) => {
    // try {
    //   const { purchasedPlaceId, userId, userEmail, userDocumentId, userFirstName, userLastName } = req.body;

    //   if (!purchasedPlaceId || !userId) {
    //     return responseUtility.buildResponse(res, responseUtility.buildResponseFailed('json', null, {
    //       message: 'Se requiere el ID del cupo y el ID del usuario'
    //     }));
    //   }

    //   // Si se proporcionan datos del usuario, crear matrícula
    //   if (userEmail && userDocumentId && userFirstName && userLastName) {
    //     // Obtener información del cupo
    //     const placeResponse = await purchasedPlaceService.getPlaces({
    //       _id: purchasedPlaceId
    //     });

    //     if (placeResponse.status !== 'success' || !placeResponse.purchasedPlaces?.length) {
    //       return responseUtility.buildResponse(res, responseUtility.buildResponseFailed('json', null, {
    //         message: 'Cupo no encontrado'
    //       }));
    //     }

    //     const place = placeResponse.purchasedPlaces[0];

    //     // Crear matrícula
    //     const enrollmentObj = {
    //       email: userEmail,
    //       documentID: userDocumentId,
    //       firstname: userFirstName,
    //       lastname: userLastName,
    //       courseID: place.courseScheduling.moodle_id,
    //       course_scheduling: place.courseScheduling._id,
    //       origin: "ShoppingCart",
    //       trackingEnrollment: true,
    //     };

    //     const enrollmentResult = await enrollmentService.insertOrUpdate(enrollmentObj);

    //     if (enrollmentResult.status === 'success') {
    //       // Asignar el cupo con la matrícula
    //       const result = await purchasedPlaceService.assignPlace({
    //         purchasedPlaceId,
    //         userId,
    //         enrollmentId: enrollmentResult.enrollment._id
    //       });

    //       return responseUtility.buildResponse(res, result);
    //     } else {
    //       return responseUtility.buildResponse(res, responseUtility.buildResponseFailed('json', null, {
    //         message: 'Error al crear la matrícula',
    //         details: enrollmentResult.message
    //       }));
    //     }
    //   } else {
    //     // Solo asignar el cupo sin matrícula
    //     const result = await purchasedPlaceService.assignPlace({
    //       purchasedPlaceId,
    //       userId
    //     });

    //     return responseUtility.buildResponse(res, result);
    //   }
    // } catch (e) {
    //   console.log(`PurchasedPlaceController -> assignPlace -> ERROR: `, e);
    //   return responseUtility.buildResponse(res, responseUtility.buildResponseFailed('json'));
    // }
  }
}

export const purchasedPlaceController = new PurchasedPlaceController();
export { PurchasedPlaceController as DefaultAdminPurchasedPlacePurchasedPlaceController };