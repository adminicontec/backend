// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import_models Import models
// @end

// @import_services Import services
import {userDataService} from '@scnode_app/services/default/data/user/userDataService'
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

// @import_types Import types
// @end

class UserDataController {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = (req: Request, res: Response) => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite consultar la información del usuario
   * @param req Objeto de clase Express
   * @param res Objeto de clase Express
   * @returns
   */
   public fetchUserInfo = async (req: Request, res: Response) => {
    let params = req.getParameters.all()
    const response = await userDataService.fetchUserInfo(params)
    return responseUtility.sendResponseFromObject(res,response);
  }

}

export const userDataController = new UserDataController();
export { UserDataController as DefaultDataUserUserDataController };
