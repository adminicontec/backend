// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { IEnrollmentTracking } from '@scnode_app/types/default/admin/enrollment/enrollmentTrackingTypes';
// @end

// @import models
import { EnrollmentTracking } from '@scnode_app/models'
// @end

// @import types
// @end

class EnrollmentTrackingService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  public insertOrUpdate = async (params: IEnrollmentTracking) => {

    try {
      if (params.id) {
        const register = await EnrollmentTracking.findOne({ _id: params.id })
        if (!register) return responseUtility.buildResponseFailed('json', null, { message: 'Registro no encontrado' })

        const response: any = await EnrollmentTracking.findByIdAndUpdate(params.id, params, { useFindAndModify: false, new: true })

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            tracking: response
          }
        })

      } else {
        const response: any = await EnrollmentTracking.create(params)

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            tracking: response
          }
        })
      }

    } catch (e) {
      console.log('EnrollmentTrackingService::insertOrUpdate::catch', e)
      return responseUtility.buildResponseFailed('json')
    }
  }

}

export const enrollmentTrackingService = new EnrollmentTrackingService();
export { EnrollmentTrackingService as DefaultAdminEnrollmentEnrollmentTrackingService };
