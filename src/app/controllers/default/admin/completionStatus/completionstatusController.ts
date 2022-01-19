// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import_models Import models
// @end

// @import_services Import services
import { completionstatusService } from '@scnode_app/services/default/admin/completionStatus/completionstatusService'
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

// @import_types Import types
import { QueryValues } from '@scnode_app/types/default/global/queryTypes'
// @end

class CompletionstatusController {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = (req: Request, res: Response) => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor() { }

  /**
 * Metodo que permite listar los registros
 * @param req Objeto de clase Express
 * @param res Objeto de clase Express
 * @returns
 */
  public list = async (req: Request, res: Response) => {
    const response = await completionstatusService.list(req.getParameters.all())
    return responseUtility.sendResponseFromObject(res, response)
  }


  public activitiesCompletion = async (req: Request, res: Response) => {
    const response = await completionstatusService.activitiesCompletion(req.getParameters.all())
    return responseUtility.sendResponseFromObject(res, response)
  }

}

export const completionstatusController = new CompletionstatusController();
export { CompletionstatusController as DefaultAdminCompletionStatusCompletionstatusController };
