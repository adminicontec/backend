// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import_models Import models
// @end

// @import_services Import services
import {surveyService} from '@scnode_app/services/default/admin/academicContent/survey/surveyService'
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

// @import_types Import types
import {QueryValues} from '@scnode_app/types/default/global/queryTypes'
// @end

class SurveyController {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = (req: Request, res: Response) => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite crear un simulacro fantasma (Con información basica para poder generar recurso, configuracion de lanzamiento y simulacro)
   * @param req Objeto de Express
   * @param res Objeto de Express
   * @returns
   */
  public createGhostSurvey = async (req: Request, res: Response) => {
    let params = req.getParameters.all()
    const response = await surveyService.createGhostSurvey(params)
    return responseUtility.sendResponseFromObject(res,response);
  }

  /**
   * Metodo que permite crear un simulacro
   * @param req Objeto de Express
   * @param res Objeto de Express
   * @returns
   */
  public create = async (req: Request, res: Response) => {
    let params = req.getParameters.all()
    const response = await surveyService.insertOrUpdate(params)
    return responseUtility.sendResponseFromObject(res,response);
  }

  /**
   * Metodo que permite actualizar un simulacro
   * @param req Objeto de Express
   * @param res Objeto de Express
   * @returns
   */
  public update = async (req: Request, res: Response) => {
    let params = req.getParameters.all()
    const response = await surveyService.insertOrUpdate(params)
    return responseUtility.sendResponseFromObject(res,response);
  }

  /**
   * Metodo que permite eliminar un simulacro
   * @param req Objeto de Express
   * @param res Objeto de Express
   * @returns
   */
  public delete = async (req: Request, res: Response) => {
    const response = await surveyService.delete(req.getParameters.all())
    return responseUtility.sendResponseFromObject(res,response);
  }

  /**
   * Metodo que permite listar simulacros segun filtros
   * @param req Objeto de Express
   * @param res Objeto de Express
   * @returns
   */
  public list = async (req: Request, res: Response) => {
    let response:any = await surveyService.list(req.getParameters.all())
    return responseUtility.sendResponseFromObject(res,response);
  }

  /**
   * Metodo que permite obtener un simulacro
   * @param req Objeto de Express
   * @param res Objeto de Express
   * @returns
   */
  public get = async (req: Request, res: Response) => {
    const {id} = req.getParameters.all()
    const response = await surveyService.findBy({query: QueryValues.ONE, where: [{field: '_id', value: id}]})
    return responseUtility.sendResponseFromObject(res,response);
  }
}

export const surveyController = new SurveyController();
export { SurveyController as DefaultAdminAcademicContentSurveySurveyController };
