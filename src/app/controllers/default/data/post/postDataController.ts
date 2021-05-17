// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import_models Import models
// @end

// @import_services Import services
import {postDataService} from '@scnode_app/services/default/data/post/postDataService'
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

// @import_types Import types
// @end

class PostDataController {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = (req: Request, res: Response) => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite consultar las categorias de publicaciones
   * @param req Objeto de clase Express
   * @param res Objeto de clase Express
   * @returns
   */
   public fetchCategories = async (req: Request, res: Response) => {
    let params = req.getParameters.all()
    const response = await postDataService.fetchCategories(params)
    return responseUtility.sendResponseFromObject(res,response);
  }

  /**
   * Metodo que permite consultar las publicaciones
   * @param req Objeto de clase Express
   * @param res Objeto de clase Express
   * @returns
   */
  public fetchPosts = async (req: Request, res: Response) => {
    let params = req.getParameters.all()
    const response = await postDataService.fetchPosts(params)
    return responseUtility.sendResponseFromObject(res,response);
  }

  /**
   * Metodo que permite consultar las publicaciones
   * @param req Objeto de clase Express
   * @param res Objeto de clase Express
   * @returns
   */
   public fetchPost = async (req: Request, res: Response) => {
    let params = req.getParameters.all()
    const response = await postDataService.fetchPost(params)
    return responseUtility.sendResponseFromObject(res,response);
  }


}

export const postDataController = new PostDataController();
export { PostDataController as DefaultDataPostPostDataController };
