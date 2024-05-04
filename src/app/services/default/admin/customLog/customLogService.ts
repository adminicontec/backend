// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import { CustomLog } from '@scnode_app/models'
import { ICustomLog, ICustomLogListParams } from '@scnode_app/types/default/admin/customLog/customLogTypes';
// @end

// @import types
// @end

class CustomLogService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  list = async ({ content, description, label, userID, schedulingMoodleId, limit, sort }: ICustomLogListParams) => {
    try {
      const where = {}
      if (content) {
        where['content'] = content
      }
      if (description) {
        where['description'] = { $regex: description, $options: 'i' }
      }
      if (label) {
        where['label'] = { $regex: label, $options: 'i' }
      }
      if (userID) {
        where['userID'] = userID
      }
      if (schedulingMoodleId) {
        where['schedulingMoodleId'] = schedulingMoodleId
      }

      if (!Object.keys(where)?.length) {
        where['_id'] = { $exists: false }
      }

      limit = limit ? Number(limit) : 20
      sort = sort ? sort : { created_at: -1 }

      const logs = await CustomLog.find(where).limit(limit).sort(sort).lean()

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          total: await CustomLog.find(where).count(),
          limit,
          sort,
          logs
        }
      })
    } catch (e) {
      return responseUtility.buildResponseFailed('json', null, {
        additional_parameters: {
          message: e.message
        }
      })
    }
  }

  create = async (customLog: ICustomLog) => {
    try {
      await CustomLog.create(customLog)
      return true
    } catch(_) {
      return false
    }
  }

}

export const customLogService = new CustomLogService();
export { CustomLogService as DefaultAdminCustomLogCustomLogService };
