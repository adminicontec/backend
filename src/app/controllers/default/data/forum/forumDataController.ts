// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import_models Import models
// @end

// @import_services Import services
import {forumDataService} from '@scnode_app/services/default/data/forum/forumDataService'
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

// @import_types Import types
// @end

class ForumDataController {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = (req: Request, res: Response) => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite consultar los foros
   * @param req Objeto de clase Express
   * @param res Objeto de clase Express
   * @returns
   */
  public fetchForums = async (req: Request, res: Response) => {
    let params = req.getParameters.all()
    const response = await forumDataService.fetchForums(params)
    return responseUtility.sendResponseFromObject(res,response);
  }

  /**
   * Metodo que permite consultar los mensajes de un foro
   * @param req Objeto de clase Express
   * @param res Objeto de clase Express
   * @returns
   */
  public fetchMessagesByForum = async (req: Request, res: Response) => {

    const user_id = req.user.sub
    let params = req.getParameters.all()

    params['user'] = user_id
    const response = await forumDataService.fetchMessagesByForum(params)
    return responseUtility.sendResponseFromObject(res,response);
  }

}

export const forumDataController = new ForumDataController();
export { ForumDataController as DefaultDataForumForumDataController };
