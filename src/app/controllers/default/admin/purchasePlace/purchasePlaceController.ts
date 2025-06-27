
// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import services
import { purchasedPlaceService } from '@scnode_app/services/default/admin/purchasedPlace/purchasedPlaceService';
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

  public findUser = async (req: Request, res: Response) => {
    const response = await purchasedPlaceService.findUser(req.getParameters.all());
    return responseUtility.sendResponseFromObject(res, response);
  }

  public getPlaces = async (req: Request, res: Response) => {
    const response = await purchasedPlaceService.getPlaces(req.getParameters.all());
    return responseUtility.sendResponseFromObject(res, response);
  }

  public assignPlace = async (req: Request, res: Response) => {
    const response = await purchasedPlaceService.processAssignments(req.getParameters.all());
    return responseUtility.sendResponseFromObject(res, response)
  }
}

export const purchasedPlaceController = new PurchasedPlaceController();
export { PurchasedPlaceController as DefaultAdminPurchasedPlacePurchasedPlaceController };