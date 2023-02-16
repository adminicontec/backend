// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import_models Import models
// @end

// @import_services Import services
import { teacherService } from '@scnode_app/services/default/admin/teacher/teacherService';
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

// @import_types Import types
import { QueryValues } from '@scnode_app/types/default/global/queryTypes'
// @end

class TeacherController {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = (req: Request, res: Response) => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor() { }



  public upload = async (req: Request, res: Response) => {
    let params = req.getParameters.all()
    let files = req.files
    const response = await teacherService.upload(params, files)
    return responseUtility.sendResponseFromObject(res, response)
  }

  public processFile = async (req: Request, res: Response) => {

    let params = req.getParameters.all()
    const response = await teacherService.processFile(params)
    return responseUtility.sendResponseFromObject(res, response)
  }

  public list = async (req: Request, res: Response) => {
    const response = await teacherService.list(req.getParameters.all())
    return responseUtility.sendResponseFromObject(res, response)
  }

  public merge = async (req: Request, res: Response) => {
    const response = await teacherService.merge(req.getParameters.all())
    return responseUtility.sendResponseFromObject(res, response)
  }

  public generateReport = async (req: Request, res: Response) => {
    const params = { user: req.user?.sub }
    const response = await teacherService.generateReport(params)
    return responseUtility.sendResponseFromObject(res, response)
  }
}

export const teacherController = new TeacherController();
export { TeacherController as DefaultAdminTeacherTeacherController };
