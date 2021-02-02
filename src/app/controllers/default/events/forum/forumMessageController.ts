// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import_models Import models
// @end

// @import_services Import services
import {forumMessageService} from '@scnode_app/services/default/events/forum/forumMessageService'
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

// @import_types Import types
// @end

class ForumMessageController {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = (req: Request, res: Response) => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
	 * Metodo que permite generar un mensaje para un foro
	 * @param req Objeto de clase Express
	 * @param res Objeto de clase Express
	 * @returns
	 */
	public sendMessage = async (req: Request, res: Response) => {
    const user_id = req.user.sub
    let params = req.getParameters.all()
    let files = req.files

    if (files && files['attachment']) {
        params['attachment'] = files['attachment']
    }

    params['user'] = user_id

    const response = await forumMessageService.sendMessage(params)
    return responseUtility.sendResponseFromObject(res, response)
  }

  /**
	 * Metodo que permite eliminar un mensaje de un foro
	 * @param req Objeto de clase Express
	 * @param res Objeto de clase Express
	 * @returns
	 */
	public delete = async (req: Request, res: Response) => {
    const user_id = req.user.sub
    let params = req.getParameters.all()
    params['user'] = user_id

    const response = await forumMessageService.delete(params)
    return responseUtility.sendResponseFromObject(res, response)
  }

}

export const forumMessageController = new ForumMessageController();
export { ForumMessageController as DefaultEventsForumForumMessageController };
