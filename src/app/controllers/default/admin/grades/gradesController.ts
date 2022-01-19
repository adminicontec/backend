// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import_models Import models
// @end

// @import_services Import services
import {gradesService} from '@scnode_app/services/default/moodle/grades/gradesService'
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

// @import_types Import types
// @end

class GradesController {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = (req: Request, res: Response) => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  public fetchGrades = async (req: Request, res: Response) => {
    let params = req.getParameters.all()
    const response = await gradesService.fetchGrades(params)
    return responseUtility.sendResponseFromObject(res,response);
  }

}

export const gradesController = new GradesController();
export { GradesController as DefaultAdminGradesGradesController };
