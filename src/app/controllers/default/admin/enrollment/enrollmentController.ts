// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import_models Import models
// @end

// @import_services Import services
import { enrollmentService } from '@scnode_app/services/default/admin/enrollment/enrollmentService'
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

// @import_types Import types
import { QueryValues } from '@scnode_app/types/default/global/queryTypes'
import { userService } from '@scnode_app/services/default/admin/user/userService';
// @end

class EnrollmentController {

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
    const response = await enrollmentService.list(req.getParameters.all())
    return responseUtility.sendResponseFromObject(res, response)
  }


  /**
   * Metodo que permite obtener un unico registro
   * @param req Objeto de clase Express
   * @param res Objeto de clase Express
   * @returns
   */
  public get = async (req: Request, res: Response) => {
    const { id } = req.getParameters.all()
    const response = await enrollmentService.findBy({ query: QueryValues.ONE, where: [{ field: '_id', value: id }] })
    return responseUtility.sendResponseFromObject(res, response)
  }


  /**
   * Metodo que permite crear un registro
   * @param req Objeto de clase Express
   * @param res Objeto de clase Express
   * @returns
   */
  public create = async (req: Request, res: Response) => {
    const response = await enrollmentService.insertOrUpdate(req.getParameters.all())
    return responseUtility.sendResponseFromObject(res, response)
  }

  public delete = async (req: Request, res: Response) => {
    const response = await enrollmentService.delete(req.getParameters.all())
    return responseUtility.sendResponseFromObject(res, response)
  }

  public massive = async (req: Request, res: Response) => {

    let params = req.getParameters.all()
    let files = req.files
    // if (files && files.hasOwnProperty('file_xlsx')) {
    //   params['contentFile'] = files['file_xlsx']
    // } else {
    //   params['contentFile'] = null
    // }

    if (files && Object.prototype.hasOwnProperty.call(files, 'file_xlsx')) {
      params['contentFile'] = files['file_xlsx']
    } else {
      params['contentFile'] = null
    }


    const response = await enrollmentService.massive(params)
    return responseUtility.sendResponseFromObject(res, response)
  }

}

export const enrollmentController = new EnrollmentController();
export { EnrollmentController as DefaultAdminEnrollmentEnrollmentController };
