// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import_models Import models
// @end

// @import_services Import services
import { questionService } from '@scnode_app/services/default/admin/academicContent/questions/questionService';
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

// @import_types Import types
import {QueryValues} from '@scnode_app/types/default/global/queryTypes'
// @end

class QuestionController {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = (req: Request, res: Response) => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite crear una pregunta
   * @param req Objeto de Express
   * @param res Objeto de Express
   * @returns
   */
  public create = async (req: Request, res: Response) => {
    const response = await res.service.insertOrUpdate(req.getParameters.all())
    return responseUtility.sendResponseFromObject(res,response);
  }

  /**
   * Metodo que permite actualizar una pregunta
   * @param req Objeto de Express
   * @param res Objeto de Express
   * @returns
   */
  public update = async (req: Request, res: Response) => {
    const response = await res.service.insertOrUpdate(req.getParameters.all())
    return responseUtility.sendResponseFromObject(res,response);
  }

  /**
   * Metodo que permite eliminar una pregunta
   * @param req Objeto de Express
   * @param res Objeto de Express
   * @returns
   */
  public delete = async (req: Request, res: Response) => {
    const response = await res.service.delete(req.getParameters.all())
    return responseUtility.sendResponseFromObject(res,response);
  }

  /**
   * Metodo que permite listar preguntas segun filtros
   * @param req Objeto de Express
   * @param res Objeto de Express
   * @returns
   */
  public list = async (req: Request, res: Response) => {
    let response:any = await questionService.list(req.getParameters.all())
    return responseUtility.sendResponseFromObject(res,response);
  }

  /**
   * Metodo que permite obtener una pregunta
   * @param req Objeto de Express
   * @param res Objeto de Express
   * @returns
   */
  public get = async (req: Request, res: Response) => {
    const {id} = req.getParameters.all()
    const response = await questionService.findBy({query: QueryValues.ONE, where: [{field: '_id', value: id}]})
    return responseUtility.sendResponseFromObject(res,response);
  }

}

export const questionController = new QuestionController();
export { QuestionController as DefaultAdminAcademicContentQuestionsQuestionController };
