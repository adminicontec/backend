// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import_models Import models
// @end

// @import_services Import services
import {surveyEventService} from '@scnode_app/services/default/events/academicContent/survey/surveyEventService'
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

// @import_types Import types
// @end

class SurveyEventController {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = (req: Request, res: Response) => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite verificar si se debe lanzar una encuesta
   * @param req
   * @param res
   * @returns
   */
  public checkSurveyAvailable = async (req: Request, res: Response) => {

    const user_id = req.user.sub
    let params = req.getParameters.all()
    params['user'] = user_id

    const response = await surveyEventService.checkSurveyAvailable(params)
		return responseUtility.sendResponseFromObject(res, response)
  }

  /**
   * Metodo que permite obtener las encuestas activas de un usuario
   * @param req
   * @param res
   * @returns
   */
   public getAvailableUserSurveys = async (req: Request, res: Response) => {

    const user_id = req.user.sub
    let params = req.getParameters.all()
    params['user'] = user_id

    const response = await surveyEventService.getAvailableUserSurveys(params)
		return responseUtility.sendResponseFromObject(res, response)
  }
}

export const surveyEventController = new SurveyEventController();
export { SurveyEventController as DefaultEventsAcademicContentSurveySurveyEventController };
