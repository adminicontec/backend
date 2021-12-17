// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import { CertificateQueue } from '@scnode_app/models'
// @end

// @import types
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes'
import { ICertificate, ICertificateQueue, ICertificateQueueQuery } from '@scnode_app/types/default/admin/certificate/certificateTypes'
// @end

class CertificateQueueService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor() { }


  /**
 * Metodo que permite validar si un registro existe segun parametros
 * @param params Filtros para buscar el elemento
 * @returns
 */
  public findBy = async (params: IQueryFind) => {

    try {
      let where = {}
      if (params.where && Array.isArray(params.where)) {
        params.where.map((p) => where[p.field] = p.value)
      }

      let select = 'id courseId userId status certificateType certificateModule certificate';
      if (params.query === QueryValues.ALL) {
        const registers = await CertificateQueue.find(where).select(select)
        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            certificateQueue: registers
          }
        })
      } else if (params.query === QueryValues.ONE) {
        const register = await CertificateQueue.findOne(where).select(select)
        if (!register) return responseUtility.buildResponseFailed('json', null, { error_key: 'city.not_found' })
        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            certificateQueue: register
          }
        })
      }

      return responseUtility.buildResponseFailed('json')
    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
* Metodo que permite insertar/actualizar un registro
* @param params Elementos a registrar
* @returns
*/
  public insertOrUpdate = async (params: ICertificateQueue) => {

    try {
      if (params.id) {
        const register = await CertificateQueue.findOne({ _id: params.id })
        if (!register) return responseUtility.buildResponseFailed('json', null, { error_key: 'certificate.queue.not_found' })

        const response: any = await CertificateQueue.findByIdAndUpdate(params.id, params, { useFindAndModify: false, new: true })
        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            certificateQueue: {
              _id: response._id,
              status: response.status,
              certificate: response.certificate
            }
          }
        })

      } else {
        console.log("Insert certificate queue");
        console.log(params);

        let totalResponse = [];

        for await (const userId of params.users) {

          const exist = await CertificateQueue.findOne({ userid: userId, courseid: params.courseId })
          if (exist) return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'certificate.queue.already_exists', params: { userid: userId, courseid: params.courseId } } });

          const response: any = await CertificateQueue.create({
            courseId: params.courseId,
            userId: userId,
            status: params.status,
            certificateType: '',
            certificateModule: ''
           });

           let certificateQueueResponse = {
            _id: response.id,
            courseId: response.courseId,
            userId: response.userId,
            certificateType: response.certificateType,
            certificateModule: response.certificateModule,
            status: response.status
          }
          totalResponse.push(certificateQueueResponse);

        };

        // const exist = await CertificateQueue.findOne({ userid: params.userId, courseid: params.courseId })
        // if (exist) return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'certificate.queue.already_exists', params: { userid: params.userId, courseid: params.courseId } } })

        // const response: any = await CertificateQueue.create(params)

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            certificateQueue: {
              totalResponse
            }
          }
        })
      }

    } catch (e) {
      return responseUtility.buildResponseFailed('json', null,
        {
          additional_parameters: {
            process: 'insertOrUpdate()',
            error: e.message
          }

        })
    }
  }


  /**
   * Metodo que permite listar todos los registros
   * @param [filters] Estructura de filtros para la consulta
   * @returns
   */
  public list = async (filters: ICertificateQueueQuery = {}) => {

    const paging = (filters.pageNumber && filters.nPerPage) ? true : false

    const pageNumber = filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage = filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let select = 'id courseId userId status certificateType certificateModule certificate'
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
        ]
      }
    }

    let registers = []
    try {
      registers = await CertificateQueue.find(where)
        .select(select)
        .skip(paging ? (pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0) : null)
        .limit(paging ? nPerPage : null)
    } catch (e) { }

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        certificateQueue: [
          ...registers
        ],
        total_register: (paging) ? await CertificateQueue.find(where).count() : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    })
  }


  public fetchItems = async (filters: ICertificateQueueQuery = {}) => {

    const paging = (filters.pageNumber && filters.nPerPage) ? true : false

    const pageNumber = filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage = filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let select = 'id courseId userId status certificateType certificateModule certificate'
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
        ]
      }
    }

    let registers = []
    try {
      registers = await CertificateQueue.find(where)
        .select(select)
        .skip(paging ? (pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0) : null)
        .limit(paging ? nPerPage : null)
    } catch (e) { }

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        certificateQueue: [
          ...registers
        ],
        total_register: (paging) ? await CertificateQueue.find(where).count() : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    })
  }


}

export const certificateQueueService = new CertificateQueueService();
export { CertificateQueueService as DefaultAdminCertificateQueueCertificateQueueService };
