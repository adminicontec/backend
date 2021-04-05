// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import_models Import models
// @end

// @import_services Import services
import {editorJsService} from '@scnode_app/services/default/admin/editorJs/editorJsService'
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

// @import_types Import types
// @end

class EditorJsController {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = (req: Request, res: Response) => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite cargar una imagen desde un archivo
   * @param req Objeto de clase Express
   * @param res Objeto de clase Express
   * @returns
   */
  public uploadImageByFile = async (req: Request, res: Response) => {
    let params = req.getParameters.all()
    params['type'] = 'by_file'
    params['file'] = req.files['image']

    const response = await editorJsService.uploadImage(params)
    return responseUtility.sendResponseFromObject(res, response)
  }

  /**
   * Metodo que permite cargar una imagen desde una URL
   * @param req Objeto de clase Express
   * @param res Objeto de clase Express
   * @returns
   */
  public uploadImageByUrl = async (req: Request, res: Response) => {
    let params = req.getParameters.all()
    params['type'] = 'by_url'

    const response = await editorJsService.uploadImage(params)
    return responseUtility.sendResponseFromObject(res, response)
  }

  /**
   * Metodo que permite obtener información de un sition segun link
   * @param req Objeto de clase Express
   * @param res Objeto de clase Express
   * @returns
   */
  public fetchUrlFromLink = async (req: Request, res: Response) => {
    let params = req.getParameters.all()

    const response = await editorJsService.fetchUrlFromLink(params)
    return responseUtility.sendResponseFromObject(res, response)
  }

}

export const editorJsController = new EditorJsController();
export { EditorJsController as DefaultAdminEditorJsEditorJsController };
