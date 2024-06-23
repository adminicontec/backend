// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import { Term } from '@scnode_app/models'
// @end

// @import types
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes';
import { IParamsTermDelete, ITerm, ITermQuery } from '@scnode_app/types/default/admin/term/termTypes';
// @end

class TermService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

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


      if (params.query === QueryValues.ALL) {
        const registers = await Term.find(where)
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          terms: registers
        }})
      } else if (params.query === QueryValues.ONE) {
        const register = await Term.findOne(where)
        if (!register) return responseUtility.buildResponseFailed('json', null, {error_key: 'term.not_found'})
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          term: register
        }})
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
  public insertOrUpdate = async (params: ITerm) => {

    try {

      let term: ITerm;
      if (params.name && params.type) {
        term = await Term.findOne({ name: params.name, type: params.type })
        if (term) {
          params.id = term._id
        }
      }

      if (params.id) {
        const register = await Term.findOne({_id: params.id})
        if (!register) return responseUtility.buildResponseFailed('json', null, {error_key: 'term.not_found'})

        // @INFO: Validando nombre unico
        if (params.name && params.type) {
          const exist = await Term.findOne({ name: params.name, type: params.type, _id: {$ne: params.id}})
          if (exist) return responseUtility.buildResponseFailed('json', null, { error_key: {key: 'term.already_exists', params: {name: params.name}} })
        }

        const response: ITerm = await Term.findByIdAndUpdate(params.id, params, { useFindAndModify: false, new: true })

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            term: response
          }
        })

      } else {
        const exist = await Term.findOne({ name: params.name, type: params.type })
        if (exist) return responseUtility.buildResponseFailed('json', null, { error_key: {key: 'term.already_exists', params: {name: params.name}} })

        const response: ITerm = await Term.create(params)

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            term: response,
          }
        })
      }

    } catch (e) {
      console.log(e);
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que permite hacer borrar un registro
   * @param params Filtros para eliminar
   * @returns
   */
  public delete = async (params: IParamsTermDelete) => {
    try {
      const find: any = await Term.findOne({ _id: params.id })
      if (!find) return responseUtility.buildResponseFailed('json', null, { error_key: 'term.not_found' })

      await find.delete()

      return responseUtility.buildResponseSuccess('json')
    } catch (error) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que permite listar todos los registros
   * @param [filters] Estructura de filtros para la consulta
   * @returns
   */
  public list = async (filters: ITermQuery = {}) => {

    const paging = (filters.pageNumber && filters.nPerPage) ? true : false

    const pageNumber= filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage= filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let where = {}

    if (filters.type) {
      where = {
        ...where,
        type: filters.type,
      }
    }

    if (filters.types?.length) {
      filters.types = JSON.parse(filters.types as unknown as string)
      where = {
        ...where,
        type: {
          $in: filters.types
        },
      }
    }

    if (filters.enabled !== undefined) {
      where = {
        ...where,
        enabled: filters.enabled,
      }
    }

    if(filters.search){
      const search = filters.search
      where = {
        ...where,
        $or:[
          {name: { $regex: '.*' + search + '.*',$options: 'i' }},
          {description: { $regex: '.*' + search + '.*',$options: 'i' }},
        ]
      }
    }

    let registers = []
    try {
      registers =  await Term.find(where)
      .skip(paging ? (pageNumber > 0 ? ( ( pageNumber - 1 ) * nPerPage ) : 0) : null)
      .sort({ position: 1 })
      .limit(paging ? nPerPage : null)
    } catch (e) {}

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        terms: [
          ...registers
        ],
        total_register: (paging) ? await Term.find(where).count() : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    })
  }

}

export const termService = new TermService();
export { TermService as DefaultAdminTermTermService };
