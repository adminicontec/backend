// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import_models Import models
// @end

// @import_services Import services
import { userService } from '@scnode_app/services/default/admin/user/userService';
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

// @import_types Import types
import { QueryValues } from '@scnode_app/types/default/global/queryTypes';
// @end

class AcademicResourceDataController {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = (req: Request, res: Response) => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
     * Metodo que permite consultar la información de un recurso academico
     * @param req Objeto de clase Express
     * @param res Objeto de clase Express
     * @returns
     */
   public fetchAcademicResourceData = async (req: Request, res: Response) => {
    const user_id = req.user.sub
    let params = req.getParameters.all()

    let user_response: any = await userService.findBy({query: QueryValues.ONE, where: [{field: '_id', value: user_id}]})
    if (user_response.status === "error" ) return user_response

    params['user'] = user_response.user

    const response = await res.service.fetchAcademicResourceData(params)
    return responseUtility.sendResponseFromObject(res, response)
}

}

export const academicResourceDataController = new AcademicResourceDataController();
export { AcademicResourceDataController as DefaultDataAcademicContentAcademicResourceAcademicResourceDataController };
