// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import_models Import models
// @end

// @import_services Import services
import {academicResourceAttemptService} from '@scnode_app/services/default/events/activity/academicResource/academicResourceAttemptService'
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

// @import_types Import types
// @end

class AcademicResourceAttemptController {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = (req: Request, res: Response) => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite generar/actualizar un intento de recurso
   * @param req Objeto de Express
   * @param res Objeto de Express
   * @returns
   */
  public attempt = async (req: Request, res: Response) => {
    const response = await academicResourceAttemptService.insertOrUpdate(req.getParameters.all(), req.files)
    return responseUtility.sendResponseFromObject(res,response);
  }

  /**
   * @INFO Actualizar el estado de "enable" del attempt
   * @param req
   * @param res
   * @returns
   */
  public enableAttempt = async (req: Request, res: Response) => {
    const response = await academicResourceAttemptService.enableAttempt(req.getParameters.all())
    return responseUtility.sendResponseFromObject(res,response);
  }
}

export const academicResourceAttemptController = new AcademicResourceAttemptController();
export { AcademicResourceAttemptController as DefaultEventsActivityAcademicResourceAcademicResourceAttemptController };
