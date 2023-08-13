// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import_models Import models
// @end

// @import_services Import services
import { courseSchedulingAssociationService } from '@scnode_app/services/default/admin/course/courseSchedulingAssociationService';
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

// @import_types Import types
// @end

class CourseSchedulingAssociationController {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = (req: Request, res: Response) => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  public associationsByCourseScheduling = async (req: Request, res: Response) => {
    const user_id = req.user.sub
    let params = req.getParameters.all()
    params['user'] = user_id

    const response = await courseSchedulingAssociationService.associationsByCourseScheduling(params)
    return responseUtility.sendResponseFromObject(res, response)
  }

  public associateSchedules = async (req: Request, res: Response) => {
    const user_id = req.user.sub
    let params = req.getParameters.all()
    params['user'] = user_id

    const response = await courseSchedulingAssociationService.associateSchedules(params)
    return responseUtility.sendResponseFromObject(res, response)
  }

  public processDocument = async (req: Request, res: Response) => {
    let params = req.getParameters.all()
    if (typeof params?.data === 'string') {
      params = JSON.parse(params?.data)
      params = {
        ...params,
        recordToProcess: {
          ...params.recordToProcess,
          id: params?.recordToProcess?._id,
        }
      }
    }

    const response = await courseSchedulingAssociationService.processAssociateSchedulesByDocumentQueue(params)
    return responseUtility.sendResponseFromObject(res, response)
  }

}

export const courseSchedulingAssociationController = new CourseSchedulingAssociationController();
export { CourseSchedulingAssociationController as DefaultAdminCourseCourseSchedulingAssociationController };
