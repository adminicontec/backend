// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import { CertificateLogs } from '@scnode_app/models'
// @end

// @import types
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes'
import { ICertificateLog, ICertificateLogQuery, ICertificateDelete, ProcessList } from '@scnode_app/types/default/admin/certificate/certificateLogTypes'
// @end

class CertificateLogsService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor() { }


  public list = async (filters: ICertificateLogQuery = {}) => {

    const paging = (filters.pageNumber && filters.nPerPage) ? true : false

    const pageNumber = filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage = filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let select = 'id idCertificateQueue serviceResponse process message requestData responseService created_at updated_at';
    if (filters.select) {
      select = filters.select
    }

    let where = {}

    if (filters.search) {
      const search = filters.search
      where = {
        ...where,
        $or: [
          { name: { $regex: '.*' + search + '.*', $options: 'i' } },
          { description: { $regex: '.*' + search + '.*', $options: 'i' } },
        ]
      }
    }

    if (filters?.idCertificateQueue) {
      where['idCertificateQueue'] = filters.idCertificateQueue
    } else if (filters?.idCertificateQueues) {
      where['idCertificateQueue'] = {$in: filters.idCertificateQueues}
    }
    if (filters?.process) {
      const processAvailable = Object.keys(ProcessList).filter((key) => ProcessList[key] === filters.process)
      if (processAvailable.length === 0) {
        return responseUtility.buildResponseFailed('json', null, {code: 400, message: `Los tipos de proceso permitidos son ${Object.keys(
          ProcessList,
        ).map((key) => ProcessList[key])}`})
      }
      where['process'] = filters.process
    }

    let registers = []
    try {
      registers = await CertificateLogs.find(where)
        .select(select)
        .skip(paging ? (pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0) : null)
        .limit(paging ? nPerPage : null)
        .sort({ name: 1 })
    } catch (e) { }

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        certificateLogs: [
          ...registers
        ],
        total_register: (paging) ? await CertificateLogs.find(where).count() : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    })

  }

  public findBy = async (params: IQueryFind) => {

    try {
      let where = {}
      if (params.where && Array.isArray(params.where)) {
        params.where.map((p) => where[p.field] = p.value)
      }

      let select = 'id idCertificateQueue serviceResponse  message requestData created_at updated_at';
      if (params.query === QueryValues.ALL) {
        const registers = await CertificateLogs.find(where).select(select)
        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            certificateLogs: registers
          }
        })
      } else if (params.query === QueryValues.ONE) {
        const register = await CertificateLogs.findOne(where).select(select)
        if (!register) return responseUtility.buildResponseFailed('json', null, { error_key: 'certificate.logs.not_found' })
        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            certificateLogs: register
          }
        })
      }

      return responseUtility.buildResponseFailed('json')
    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }

  }

  public insertOrUpdate = async (params: ICertificateLog) => {

    try {
      if (params.id) {
        const register = await CertificateLogs.findOne({ _id: params.id })
        if (!register) return responseUtility.buildResponseFailed('json', null, { error_key: 'country.not_found' })

        const response: any = await CertificateLogs.findByIdAndUpdate(params.id, params, { useFindAndModify: false, new: true })

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            certificateLog: {
              _id: response._id,
              idCertificateQueue: response.idCertificateQueue,
              serviceResponse: response.serviceResponse,
              message: response.message
            }
          }
        })

      } else {
        const response: any = await CertificateLogs.create(params)

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            certificateLog: {
              _id: response._id,
              idCertificateQueue: response.idCertificateQueue,
              serviceResponse: response.serviceResponse,
              message: response.message
            }
          }
        })
      }

    } catch (e) {
      console.log('errorLog', e)
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que permite hacer borrar un registro
   * @param params Filtros para eliminar
   * @returns
   */
  public delete = async (params: ICertificateDelete) => {
    try {
      const find: any = await CertificateLogs.findOne({ _id: params.id })
      if (!find) return responseUtility.buildResponseFailed('json', null, { error_key: 'country.not_found' })

      await find.delete()

      return responseUtility.buildResponseSuccess('json')
    } catch (error) {
      return responseUtility.buildResponseFailed('json')
    }
  }


}

export const certificateLogsService = new CertificateLogsService();
export { CertificateLogsService as DefaultAdminCertificateQueueCertificateLogsService };
