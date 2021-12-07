// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import_models Import models
// @end

// @import_services Import services
import {surveyDataService} from '@scnode_app/services/default/data/academicContent/survey/surveyDataService'
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

// @import_types Import types
// @end

class SurveyDataController {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = (req: Request, res: Response) => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite generar el reporte de encuestas
   * @param req
   * @param res
   * @returns
   */
   public generateReport = async (req: Request, res: Response) => {

    const user_id = req.user.sub
    let params = req.getParameters.all()
    params['user'] = user_id

    const response = await surveyDataService.generateReport(params)
		return responseUtility.sendResponseFromObject(res, response)
  }
}

export const surveyDataController = new SurveyDataController();
export { SurveyDataController as DefaultDataAcademicContentSurveySurveyDataController };
