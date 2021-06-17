// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import {AppModulePermission, Home, Role} from '@scnode_app/models'
// @end

// @import types
import {IQueryFind, QueryValues} from '@scnode_app/types/default/global/queryTypes'
import {IRole, IRoleDelete, IRoleQuery} from '@scnode_app/types/default/admin/secure/roleTypes'
// @end

class RoleService {

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

      let select = 'id name description app_module_permissions homes'
      if (params.query === QueryValues.ALL) {
        const registers = await Role.find(where)
        .populate({path: 'app_module_permissions', select: 'id name description'})
        .populate({path: 'homes', select: 'id name description'})
        .select(select)
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          roles: registers
        }})
      } else if (params.query === QueryValues.ONE) {
        const register = await Role.findOne(where)
        .populate({path: 'app_module_permissions', select: 'id name description'})
        .populate({path: 'homes', select: 'id name description'})
        .select(select)
        if (!register) return responseUtility.buildResponseFailed('json', null, {error_key: 'secure.role.not_found'})
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          role: register
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
  public insertOrUpdate = async (params: IRole) => {

    try {
      if (!params.app_module_permissions) {
        // params.app_module_permissions = []
      } else if (typeof params.app_module_permissions === "string") {
        params.app_module_permissions = params.app_module_permissions.split(",");
      }

      if (params.id) {
        const register = await Role.findOne({_id: params.id})
        if (!register) return responseUtility.buildResponseFailed('json', null, {error_key: 'secure.role.not_found'})

        // @INFO: Validando nombre unico
        if (params.name) {
          const exist = await Role.findOne({ name: params.name, _id: {$ne: params.id}})
          if (exist) return responseUtility.buildResponseFailed('json', null, { error_key: {key: 'secure.role.insertOrUpdate.already_exists', params: {name: params.name}} })
        }

        const response: any = await Role.findByIdAndUpdate(params.id, params, {
          useFindAndModify: false,
          new: true,
          lean: true,
        })
        await AppModulePermission.populate(response, {path: 'app_module_permissions', select: 'id name description'})
        await Home.populate(response, {path: 'homes', select: 'id name description'})

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            role: {
              _id: response._id,
              name: response.name,
              description: response.description,
              app_module_permissions: response.app_module_permissions,
              homes: response.homes,
            }
          }
        })

      } else {
        const exist = await Role.findOne({ name: params.name })
        if (exist) return responseUtility.buildResponseFailed('json', null, { error_key: {key: 'secure.role.insertOrUpdate.already_exists', params: {name: params.name}} })

        const {_id} = await Role.create(params)
        const response: any = await Role.findOne({_id})
        .populate({path: 'app_module_permissions', select: 'id name description'})
        .populate({path: 'homes', select: 'id name description'})
        .lean()

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            role: {
              _id: response._id,
              name: response.name,
              description: response.description,
              app_module_permissions: response.app_module_permissions,
              homes: response.homes,
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
  public delete = async (params: IRoleDelete) => {
    try {
      const find: any = await Role.findOne({ _id: params.id })
      if (!find) return responseUtility.buildResponseFailed('json', null, { error_key: 'secure.role.not_found' })

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
  public list = async (filters: IRoleQuery = {}) => {

    const paging = (filters.pageNumber && filters.nPerPage) ? true : false

    const pageNumber= filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage= filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let select = 'id name description app_module_permissions homes'
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
      registers =  await Role.find(where)
      .select(select)
      .populate({path: 'app_module_permissions', select: 'id name description'})
      .populate({path: 'homes', select: 'id name description'})
      .skip(paging ? (pageNumber > 0 ? ( ( pageNumber - 1 ) * nPerPage ) : 0) : null)
      .limit(paging ? nPerPage : null)
    } catch (e) {}

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        roles: [
          ...registers
        ],
        total_register: (paging) ? await Role.find(where).count() : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    })
  }

}

export const roleService = new RoleService();
export { RoleService as DefaultAdminSecureRoleService };
