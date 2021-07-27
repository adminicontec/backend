// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import_models Import models
// @end

// @import_services Import services
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

// @import_types Import types
import {QueryValues} from '@scnode_app/types/default/global/queryTypes'
// @end

class AcademicResourceController {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = (req: Request, res: Response) => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite crear un recurso
   * @param req Objeto de Express
   * @param res Objeto de Express
   * @returns
   */
  public create = async (req: Request, res: Response) => {
    let params = req.getParameters.all()
    // let files = req.files

    // if (files && files['attached']) {
    //     params['attached'] = files['attached']
    // }
    const response = await res.service.insertOrUpdate(params)
    return responseUtility.sendResponseFromObject(res,response);
  }

  /**
   * Metodo que permite actualizar un recurso
   * @param req Objeto de Express
   * @param res Objeto de Express
   * @returns
   */
  public update = async (req: Request, res: Response) => {
    let params = req.getParameters.all()
    // let files = req.files

    // if (files && files['attached']) {
    //     params['attached'] = files['attached']
    // }

    if (params.config && typeof params.config === 'string'){
      params.config = JSON.parse(params.config)
    }

    // if (params.metadata && typeof params.metadata === 'string'){
    //   params.metadata = JSON.parse(params.metadata)
    // }

    const response = await res.service.insertOrUpdate(params)
    return responseUtility.sendResponseFromObject(res,response);
  }

  /**
   * Metodo que permite eliminar un recurso
   * @param req Objeto de Express
   * @param res Objeto de Express
   * @returns
   */
  public delete = async (req: Request, res: Response) => {
    const response = await res.service.delete(req.getParameters.all())
    return responseUtility.sendResponseFromObject(res,response);
  }

  /**
   * Metodo que permite listar recursos segun filtros
   * @param req Objeto de Express
   * @param res Objeto de Express
   * @returns
   */
  public list = async (req: Request, res: Response) => {
    let response:any = await res.service.list(req.getParameters.all())
    return responseUtility.sendResponseFromObject(res,response);
  }

  /**
   * Metodo que permite obtener un recurso
   * @param req Objeto de Express
   * @param res Objeto de Express
   * @returns
   */
  public get = async (req: Request, res: Response) => {
    const {id} = req.getParameters.all()
    const response = await res.service.findBy({query: QueryValues.ONE, where: [{field: '_id', value: id}]})
    return responseUtility.sendResponseFromObject(res,response);
  }

}

export const academicResourceController = new AcademicResourceController();
export { AcademicResourceController as DefaultAdminAcademicContentAcademicResourceAcademicResourceController };
