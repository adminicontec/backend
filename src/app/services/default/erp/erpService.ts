// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { IGetCertificatePriceParams, IGetCertificatePriceResponse } from '@scnode_app/types/default/erp/erpTypes';
import { CertificateQueue, Course } from '@scnode_app/models';
import { ICourse } from '@scnode_app/types/default/admin/course/courseTypes';
import { erpSetup } from '@scnode_core/config/globals';
import { btoa } from 'js-base64';
import { queryUtility } from '@scnode_core/utilities/queryUtility';
// @end

// @import models
// @end

// @import types
// @end

class ErpService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  public getCertificatePrice = async ({ duration, programCode, programName }: IGetCertificatePriceParams): Promise<IGetCertificatePriceResponse> => {
    try {
      const basicHeader = btoa(`${erpSetup?.username}:${erpSetup?.password}`)
      const headers = {
        'Authorization': `Basic ${basicHeader}`
      }
      const response = await queryUtility.query({
        method: 'get',
        url: `/ic/api/integration/v1/flows/rest/ICO_CO_ITEM_INVENT_TV/1.0/get_item_inventory?COD_ITEM_ECCOMERCE=${programCode}`,
        api: 'erp',
        headers
      })
      return {
        price: {
          COP: 250000,
          USD: 55
        },
      }
    } catch (e) {
      console.log(`erpService -> getCertificatePrice -> ERROR: ${e}`)
    }
  }

  public getCertificatePriceFromCertificateQueue = async ({ certificateQueueId }, exposeCollections?: boolean) => {
    try {
      const certificate = await CertificateQueue
        .findOne({ _id: certificateQueueId })
        .populate({ path: 'courseId', populate: {
          path: 'program'
        } })

      if (!certificate) {
        return responseUtility.buildResponseFailed('json', null, {
          code: 404,
          message: 'Certificado no encontrado'
        })
      }

      const program = certificate?.courseId?.program
      if (!program) {
        return responseUtility.buildResponseFailed('json', null, {
          code: 404,
          message: 'Programa no encontrado'
        })
      }

      const course = await Course.findOne<ICourse>({ program: program._id })
      if (!course) {
        return responseUtility.buildResponseFailed('json', null, {
          code: 404,
          message: 'Curso no encontrado'
        })
      }

      const { price } = await this.getCertificatePrice({
        programName: program.name,
        programCode: program.code,
        duration: course.duration
      })

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          price,
          course,
          program,
        }
      })
    } catch (e) {
      console.log(`erpService -> getCertificatePriceFromCertificateQueue -> ERROR: ${e}`)
      return responseUtility.buildResponseFailed('json')
    }
  }

}

export const erpService = new ErpService();
export { ErpService as DefaultErpErpService };
