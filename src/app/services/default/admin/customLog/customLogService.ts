// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import { CustomLog } from '@scnode_app/models'
import { ICustomLog } from '@scnode_app/types/default/admin/customLog/customLogTypes';
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
