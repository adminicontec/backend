// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import { Like } from '@scnode_app/models';
// @end

// @import types
import { IQueryFind, QueryValues } from 'app/types/default/global/queryTypes';
import { ILikeQuery, IParamsInsertOrUpdateLike, IParamsRemoveLike } from '@scnode_app/types/default/admin/like/likeTypes';
// @end

class LikeService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite insertar/actualizar un registro
   * @param params Elementos a registrar
   * @returns
   */
   insertOrUpdate = async (params: IParamsInsertOrUpdateLike): Promise<any> => {
    try{
      // @INFO: Validando like único para mensaje de foro
      if (params.forumMessage) {
        const exist = await Like.findOne({ user: params.user, forumMessage: params.forumMessage})
        if (exist) return responseUtility.buildResponseFailed('json', null, { error_key: {key: 'forum.tag.insertOrUpdate.already_exists', params: {name: params.forumMessage}} })
      }

      if (params._id) {
        const register = await Like.findOne({_id: params._id})
        if (!register) return responseUtility.buildResponseFailed('json', null, {error_key: 'forum.tag.not_found'})

        const response: any = await Like.findByIdAndUpdate(params._id, params, { useFindAndModify: false, new: true })

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            like: {
              _id: response._id,
              name: response.name,
            }
          }
        })

      } else {
        const response: any = await Like.create(params)

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            like: {
              _id: response._id,
              name: response.name
            }
          }
        })
      }
    }catch(e){
      return responseUtility.buildResponseFailed('json');
    }
  }

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

      let select = 'id user forumMessage'
      if (params.query === QueryValues.ALL) {
        const registers = await Like.find(where).select(select)
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          likes: registers
        }})
      } else if (params.query === QueryValues.ONE) {
        const register = await Like.findOne(where).select(select)
        if (!register) return responseUtility.buildResponseFailed('json', null, {error_key: 'forum.tag.not_found'})
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          like: register
        }})
      }

      return responseUtility.buildResponseFailed('json')
    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que permite hacer borrar un registro
   * @param params Filtros para eliminar
   * @returns
   */
   public delete = async (params: IParamsRemoveLike) => {
    try {
      const find: any = await Like.findOne({ _id: params._id })
      if (!find) return responseUtility.buildResponseFailed('json', null, { error_key: 'forum.tag.not_found' })

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
   public list = async (filters: ILikeQuery = {}) => {

    const paging = (filters.pageNumber && filters.nPerPage) ? true : false

    const pageNumber= filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage= filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let select = 'id user forumMessage'
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
      registers =  await Like.find(where)
      .select(select)
      .skip(paging ? (pageNumber > 0 ? ( ( pageNumber - 1 ) * nPerPage ) : 0) : null)
      .limit(paging ? nPerPage : null)
    } catch (e) {}

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        forumTags: [
          ...registers
        ],
        total_register: (paging) ? await Like.find(where).count() : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    })
  }

}

export const likeService = new LikeService();
export { LikeService as DefaultAdminLikeLikeService };
