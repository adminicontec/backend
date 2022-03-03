// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import_models Import models
// @end

// @import_services Import services
import { certificateQueueService } from '@scnode_app/services/default/admin/certificateQueue/certificateQueueService'
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

// @import_types Import types
import { QueryValues } from '@scnode_app/types/default/global/queryTypes'
// @end

class CertificateQueueController {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = (req: Request, res: Response) => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor() { }

  public create = async (req: Request, res: Response) => {
    const user_id = req.user.sub;
    let params = req.getParameters.all();
    console.log(user_id);
    params['auxiliar'] = user_id;
    const response = await certificateQueueService.insertOrUpdate(params)
    return responseUtility.sendResponseFromObject(res, response)
  }

  /**
   * Metodo que permite editar un registro
   * @param req Objeto de clase Express
   * @param res Objeto de clase Express
   * @returns
   */
  public update = async (req: Request, res: Response) => {
    const response = await certificateQueueService.insertOrUpdate(req.getParameters.all())
    return responseUtility.sendResponseFromObject(res, response)
  }

  public list = async (req: Request, res: Response) => {
    const response = await certificateQueueService.list(req.getParameters.all())
    return responseUtility.sendResponseFromObject(res, response)
  }

  public fetchByStatus = async (req: Request, res: Response) => {
    const { status } = req.getParameters.all()
    const response = await certificateQueueService.findBy({ query: QueryValues.ALL, where: [{ field: 'status', value: status }] })
    return responseUtility.sendResponseFromObject(res, response)
  }

}

export const certificateQueueController = new CertificateQueueController();
export { CertificateQueueController as DefaultAdminCertificateQueueCertificateQueueController };
