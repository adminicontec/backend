// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import_models Import models
// @end

// @import_services Import services
import { certificateService } from '@scnode_app/services/default/huellaDeConfianza/certificate/certificateService'
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

// @import_types Import types
// @end

class CertificateController {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = (req: Request, res: Response) => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor() { }

  public alltemplates = async (req: Request, res: Response) => {
    const response = await certificateService.alltemplates(req.getParameters.all())
    return responseUtility.sendResponseFromObject(res, response)
  }

  public setCertificate = async (req: Request, res: Response) => {
    const response = await certificateService.setCertificate(req.getParameters.all())
    return responseUtility.sendResponseFromObject(res, response)
  }

  public previewCertificate = async (req: Request, res: Response) => {
    const response = await certificateService.previewCertificate(req.getParameters.all())
    return responseUtility.sendResponseFromObject(res, response)
  }

  public completion = async (req: Request, res: Response) => {
    const response = await certificateService.completion(req.getParameters.all())
    return responseUtility.sendResponseFromObject(res, response)
  }

  public rulesForCompletion = async (req: Request, res: Response) => {
    const response = await certificateService.rulesForCompletion(req.getParameters.all())
    return responseUtility.sendResponseFromObject(res, response)
  }

  public automaticRelease = async (req: Request, res: Response) => {
    const response = await certificateService.automaticRelease(req.getParameters.all())
    return responseUtility.sendResponseFromObject(res, response)
  }

}

export const certificateController = new CertificateController();
export { CertificateController as DefaultAdminCertificateCertificateController };
