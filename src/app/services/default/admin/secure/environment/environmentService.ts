// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import {AppModule, Enviroment} from '@scnode_app/models'
// @end

// @import types
import {IQueryFind, QueryValues} from '@scnode_app/types/default/global/queryTypes'
import {IEnvironment, IEnvironmentDelete, IEnvironmentQuery} from '@scnode_app/types/default/admin/secure/environment/environmentTypes'
// @end

class EnvironmentService {

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

      let select = 'id name description app_module'
      if (params.query === QueryValues.ALL) {
        const registers = await Enviroment.find(where)
        .populate({path: 'app_module', select: 'id name description'})
        .select(select)
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          environments: registers
        }})
      } else if (params.query === QueryValues.ONE) {
        const register = await Enviroment.findOne(where)
        .populate({path: 'app_module', select: 'id name description'})
        .select(select)
        if (!register) return responseUtility.buildResponseFailed('json', null, {error_key: 'secure.environment.not_found'})
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          environment: register
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
  public insertOrUpdate = async (params: IEnvironment) => {

    try {
      if (params.id) {
        const register = await Enviroment.findOne({_id: params.id})
        if (!register) return responseUtility.buildResponseFailed('json', null, {error_key: 'secure.environment.not_found'})

        // @INFO: Validando nombre unico
        if (params.name) {
          const exist = await Enviroment.findOne({ name: params.name, _id: {$ne: params.id}})
          if (exist) return responseUtility.buildResponseFailed('json', null, { error_key: {key: 'secure.environment.insertOrUpdate.already_exists', params: {name: params.name}} })
        }

        const response: any = await Enviroment.findByIdAndUpdate(params.id, params, {
          useFindAndModify: false,
          new: true,
          lean: true,
        })
        await AppModule.populate(response, {path: 'app_module', select: 'id name description'})

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            environment: {
              _id: response._id,
              name: response.name,
              description: response.description,
              app_module: response.app_module
            }
          }
        })

      } else {
        const exist = await Enviroment.findOne({ name: params.name })
        if (exist) return responseUtility.buildResponseFailed('json', null, { error_key: {key: 'secure.environment.insertOrUpdate.already_exists', params: {name: params.name}} })

        const {_id} = await Enviroment.create(params)
        const response: any = await Enviroment.findOne({_id})
        .populate({path: 'app_module', select: 'id name description'})
        .lean()

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            environment: {
              _id: response._id,
              name: response.name,
              description: response.description,
              app_module: response.app_module
            }
          }
        })
      }

    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que permite hacer borrar un registro
   * @param params Filtros para eliminar
   * @returns
   */
  public delete = async (params: IEnvironmentDelete) => {
    try {
      const find: any = await Enviroment.findOne({ _id: params.id })
      if (!find) return responseUtility.buildResponseFailed('json', null, { error_key: 'secure.environment.not_found' })

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
  public list = async (filters: IEnvironmentQuery = {}) => {

    const paging = (filters.pageNumber && filters.nPerPage) ? true : false

    const pageNumber= filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage= filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let select = 'id name description app_module'
    if (filters.select) {
      select = filters.select
    }

    let where = {}

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
      registers =  await Enviroment.find(where)
      .select(select)
      .populate({path: 'app_module', select: 'id name description'})
      .skip(paging ? (pageNumber > 0 ? ( ( pageNumber - 1 ) * nPerPage ) : 0) : null)
      .limit(paging ? nPerPage : null)
    } catch (e) {}

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        environments: [
          ...registers
        ],
        total_register: (paging) ? await Enviroment.find(where).count() : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    })
  }
}

export const environmentService = new EnvironmentService();
export { EnvironmentService as DefaultAdminSecureEnvironmentEnvironmentService };
