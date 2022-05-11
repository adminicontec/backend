// @import_dependencies_node Import libraries
// @end

// @import config
import { customs } from '@scnode_core/config/globals'
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import { DocumentQueue } from '@scnode_app/models'
// @end

// @import types
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes'
import { IDocumentQueue, IDocumentQueueQuery, IDocumentQueueDelete } from '@scnode_app/types/default/admin/document/documentTypes'
// @end

class DocumentQueueService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor() { }


  public list = async (filters: IDocumentQueueQuery = {}) => {

    const paging = (filters.pageNumber && filters.nPerPage) ? true : false

    const pageNumber = filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage = filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let select = 'id userId status type docPath processLog errorLog processLogTutor errorLogTutor mixedParams'
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

    if (filters.id) {
      where['_id'] = filters.id
    }

    if (filters.document_type) {
      where['type'] = filters.document_type
    }

    let sort = null
    if (filters.sort) {
      sort = {}
      sort[filters.sort.field] = filters.sort.direction
    }

    let registers = []
    try {
      registers = await DocumentQueue.find(where)
        .select(select)
        .skip(paging ? (pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0) : null)
        .limit(paging ? nPerPage : null)
        .sort(sort)
        .lean()

      for await (const register of registers) {
        if (register.docPath) {
          register.fileUrl = this.fileUrl(register)
        }
      }
    } catch (e) { }

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        documentQueue: [
          ...registers
        ],
        total_register: (paging) ? await DocumentQueue.find(where).count() : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    })
  }

  /**
   * Metodo que convierte el valor del cover de un banner a la URL donde se aloja el recurso
   * @param {config} Objeto con data del Banner
   */
  public fileUrl = ({ docPath }) => {
    return docPath && docPath !== ''
    ? `${customs['uploads']}/${docPath}`
    : null
  }


  public findBy = async (params: IQueryFind) => {

    try {
      let where = {}
      if (params.where && Array.isArray(params.where)) {
        params.where.map((p) => where[p.field] = p.value)
      }

      let select = 'id userId status type docPath processLog errorLog mixedParams created_at updated_at';
      if (params.query === QueryValues.ALL) {
        const registers = await DocumentQueue.find(where).select(select)
        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            documentQueue: registers
          }
        })
      } else if (params.query === QueryValues.ONE) {
        const register = await DocumentQueue.findOne(where).select(select)
        if (!register) return responseUtility.buildResponseFailed('json', null, { error_key: 'city.not_found' })
        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            documentQueue: register
          }
        })
      }

      return responseUtility.buildResponseFailed('json')
    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  public insertOrUpdate = async (params: IDocumentQueue) => {

    try {
      if (params.type === 'Generate Report') {
        if (!params.mixedParams) return responseUtility.buildResponseFailed('json', null, {error_key: 'document.queue.generate_report.params_invalid'})
        if (typeof params.mixedParams !== 'object') return responseUtility.buildResponseFailed('json', null, {error_key: 'document.queue.generate_report.params_invalid'})

        if (!params.mixedParams.report || !params.mixedParams.output_format) return responseUtility.buildResponseFailed('json', null, {error_key: 'document.queue.generate_report.params_invalid'})
      }

      if (params.id) {
        const register = await DocumentQueue.findOne({ _id: params.id })
        if (!register) return responseUtility.buildResponseFailed('json', null, { error_key: 'document.queue.not_found' })

        const response: any = await DocumentQueue.findByIdAndUpdate(params.id, params, { useFindAndModify: false, new: true })

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            documentQueue: {
              _id: response._id,
              userId: response.userId,
              docPath: response.docPath,
              status: response.status,
              type: response.type,
              sendEmail: response.sendEmail,
              processLog: (response.processLog) ? response.processLog : null,
              errorLog: (response.errorLog) ? response.errorLog : null,
              processLogTutor: (response.processLogTutor) ? response.processLogTutor : null,
              errorLogTutor: (response.errorLogTutor) ? response.errorLogTutor : null,
              mixedParams: response.mixedParams
            }
          }
        })

      }
      else {
        if (!params.type) return responseUtility.buildResponseFailed('json', null, {error_key: 'document.queue.type_required'})

        const response: any = await DocumentQueue.create(params)
        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            documentQueue: {
              _id: response._id,
              userId: response.userId,
              docPath: response.docPath,
              status: response.status,
              type: response.type,
              sendEmail: response.sendEmail,
              processLog: (response.processLog) ? response.processLog : null,
              errorLog: (response.errorLog) ? response.errorLog : null,
              processLogTutor: (response.processLogTutor) ? response.processLogTutor : null,
              errorLogTutor: (response.errorLogTutor) ? response.errorLogTutor : null,
              mixedParams: response.mixedParams
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



  public delete = async (params: IDocumentQueueDelete) => {
    try {
      const find: any = await DocumentQueue.findOne({ _id: params.id })
      if (!find) return responseUtility.buildResponseFailed('json', null, { error_key: 'document.queue.not_found' })

      await find.delete()

      return responseUtility.buildResponseSuccess('json')
    } catch (error) {
      return responseUtility.buildResponseFailed('json')
    }
  }

}

export const documentQueueService = new DocumentQueueService();
export { DocumentQueueService as DefaultAdminDocumentQueueDocumentQueueService };
