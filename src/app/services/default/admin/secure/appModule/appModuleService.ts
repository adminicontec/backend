// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import {AppModule, AppModulePermission} from '@scnode_app/models'
// @end

// @import types
import {IQueryFind, QueryValues} from '@scnode_app/types/default/global/queryTypes'
import {IAppModule, IAppModuleDelete, IAppModuleQuery} from '@scnode_app/types/default/admin/secure/appModule/appModuleTypes'
// @end

class AppModuleService {

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

      let select = 'id name description app_module_permissions'
      if (params.query === QueryValues.ALL) {
        const registers = await AppModule.find(where)
        .populate({path: 'app_module_permissions', select: 'id name description'})
        .select(select)
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          appModules: registers
        }})
      } else if (params.query === QueryValues.ONE) {
        const register = await AppModule.findOne(where)
        .populate({path: 'app_module_permissions', select: 'id name description'})
        .select(select)
        if (!register) return responseUtility.buildResponseFailed('json', null, {error_key: 'secure.appModule.module.not_found'})
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          appModule: register
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
  public insertOrUpdate = async (params: IAppModule) => {

    try {
      if (params.id) {
        const register = await AppModule.findOne({_id: params.id})
        if (!register) return responseUtility.buildResponseFailed('json', null, {error_key: 'secure.appModule.module.not_found'})

        // @INFO: Validando nombre unico
        if (params.name) {
          const exist = await AppModule.findOne({ name: params.name, _id: {$ne: params.id}})
          if (exist) return responseUtility.buildResponseFailed('json', null, { error_key: {key: 'secure.appModule.module.insertOrUpdate.already_exists', params: {name: params.name}} })
        }

        const response: any = await AppModule.findByIdAndUpdate(params.id, params, {
          useFindAndModify: false,
          new: true,
          lean: true,
        })
        await AppModulePermission.populate(response, {path: 'app_module_permissions', select: 'id name description'})

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            appModule: {
              _id: response._id,
              name: response.name,
              description: response.description,
              app_module_permissions: response.app_module_permissions
            }
          }
        })

      } else {
        const exist = await AppModule.findOne({ name: params.name })
        if (exist) return responseUtility.buildResponseFailed('json', null, { error_key: {key: 'secure.appModule.module.insertOrUpdate.already_exists', params: {name: params.name}} })

        const {_id} = await AppModule.create(params)
        const response: any = await AppModule.findOne({_id})
        .populate({path: 'app_module_permissions', select: 'id name description'})
        .lean()

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            appModule: {
              _id: response._id,
              name: response.name,
              description: response.description,
              app_module_permissions: response.app_module_permissions
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
  public delete = async (params: IAppModuleDelete) => {
    try {
      const find: any = await AppModule.findOne({ _id: params.id })
      if (!find) return responseUtility.buildResponseFailed('json', null, { error_key: 'secure.appModule.module.not_found' })

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
  public list = async (filters: IAppModuleQuery = {}) => {

    const paging = (filters.pageNumber && filters.nPerPage) ? true : false

    const pageNumber= filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage= filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let select = 'id name description app_module_permissions'
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
      registers =  await AppModule.find(where)
      .select(select)
      .populate({path: 'app_module_permissions', select: 'id name description'})
      .skip(paging ? (pageNumber > 0 ? ( ( pageNumber - 1 ) * nPerPage ) : 0) : null)
      .limit(paging ? nPerPage : null)
    } catch (e) {}

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        appModules: [
          ...registers
        ],
        total_register: (paging) ? await AppModule.find(where).count() : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    })
  }
}

export const appModuleService = new AppModuleService();
export { AppModuleService as DefaultAdminSecureAppModuleAppModuleService };
