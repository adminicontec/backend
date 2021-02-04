// @import_dependencies_node Import libraries
// @end

// @import services
import { uploadService } from '@scnode_core/services/default/global/uploadService'
// @end

// @import config
import { customs } from '@scnode_core/config/globals'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import {Forum, ForumCategory, ForumLocation} from '@scnode_app/models'
// @end

// @import types
import {IQueryFind, QueryValues} from '@scnode_app/types/default/global/queryTypes'
import {IForum, IForumDelete, IForumQuery, IForumLocations} from '@scnode_app/types/default/admin/forum/forumTypes'
// @end

class ForumService {

  private default_cover_path = 'forums'

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

      let select = 'id title description coverUrl postDate isActive tags locations'
      if (params.query === QueryValues.ALL) {
        const registers: any = await Forum.find(where)
        .populate({path: 'tags', select: 'id name'})
        .populate({path: 'locations.forumLocation', select: 'id name'})
        .select(select)
        .lean()

        for await (const register of registers) {
          if (register.coverUrl) {
            register.coverUrl = this.coverUrl(register)
          }
        }

        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          forums: registers
        }})
      } else if (params.query === QueryValues.ONE) {
        const register: any = await Forum.findOne(where)
        .populate({path: 'tags', select: 'id name'})
        .populate({path: 'locations.forumLocation', select: 'id name'})
        .select(select)
        .lean()

        if (register.coverUrl) {
          register.coverUrl = this.coverUrl(register)
        }

        if (!register) return responseUtility.buildResponseFailed('json', null, {error_key: 'forum.forum.not_found'})
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          forum: register
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
  public insertOrUpdate = async (params: IForum) => {

    try {

      // @INFO: Cargando imagen al servidor
      if (params.cover) {
        const defaulPath = this.default_cover_path
        const response_upload: any = await uploadService.uploadFile(params.cover, defaulPath)
        if (response_upload.status === 'error') return response_upload
        if (response_upload.hasOwnProperty('name')) params.coverUrl = response_upload.name
      }

      if (params.id) {
        const register: any = await Forum.findOne({_id: params.id}).lean()
        if (!register) return responseUtility.buildResponseFailed('json', null, {error_key: 'forum.forum.not_found'})

        // @INFO: Actualizando ubicaciones del foro
        if (params.locations && params.locations.length > 0) {
          let oldLocations: IForumLocations[] = register.locations
          if (oldLocations && Array.isArray(oldLocations) && oldLocations.length > 0) {
            for await (const location of params.locations) {
              if (!location.viewCounter) {
                let findIndex = oldLocations.findIndex((ol) => location.forumLocation.toString() === ol.forumLocation.toString())
                if (findIndex !== -1) {
                  location.viewCounter = (oldLocations[findIndex].viewCounter) ? oldLocations[findIndex].viewCounter : 0
                }
              }
            }
          }
        } else if (params.location) {
          // @INFO: Actualizando ubicación del foro
          params.locations = [...register.locations]
          if (params.locations && Array.isArray(params.locations) && params.locations.length > 0) {
            let findIndex = params.locations.findIndex((ol) => params.location.forumLocation.toString() === ol.forumLocation.toString())
            if (findIndex !== -1) {
              if (params.location.viewCounter === 0) {
                params.locations[findIndex].viewCounter = 0
              } else if (params.location.viewCounter) {
                params.locations[findIndex].viewCounter = (params.location.viewCounter) ? params.location.viewCounter : 0
              }
            }
          }
        }

        const response: any = await Forum.findByIdAndUpdate(params.id, params, {
          useFindAndModify: false,
          new: true,
          lean: true,
        })
        await ForumCategory.populate(response, {path: 'tags', select: 'id name'})
        await ForumLocation.populate(response, {path: 'locations.forumLocation', select: 'id name'})

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            forum: {
              ...response,
              coverUrl: this.coverUrl(response),
            }
          }
        })

      } else {
        if (!params.postDate) return responseUtility.buildResponseFailed('json', null, {error_key: 'forum.forum.post_date_required'})

        const {_id} = await Forum.create(params)
        const response: any = await Forum.findOne({_id})
        .populate({path: 'tags', select: 'id name'})
        .populate({path: 'locations.forumLocation', select: 'id name'})
        .lean()

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            forum: {
              ...response,
              coverUrl: this.coverUrl(response),
            }
          }
        })
      }

    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que convierte el valor del cover de un foro a la URL donde se aloja el recurso
   * @param {config} Objeto con data del Forum
   */
  public coverUrl = ({ coverUrl }) => {
    return coverUrl && coverUrl !== ''
    ? `${customs['uploads']}/${this.default_cover_path}/${coverUrl}`
    : `${customs['uploads']}/${this.default_cover_path}/default.jpg`
  }

  /**
   * Metodo que permite hacer borrar un registro
   * @param params Filtros para eliminar
   * @returns
   */
  public delete = async (params: IForumDelete) => {
    try {
      const find: any = await Forum.findOne({ _id: params.id })
      if (!find) return responseUtility.buildResponseFailed('json', null, { error_key: 'forum.forum.not_found' })

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
  public list = async (filters: IForumQuery = {}) => {

    const paging = (filters.pageNumber && filters.nPerPage) ? true : false

    const pageNumber= filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage= filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let select = 'id title description coverUrl postDate isActive tags locations'
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

    if (typeof filters.isActive === 'undefined' || filters.isActive === true) {
      where['isActive'] = true
    }

    if (filters.postDate) {
      where['postDate'] = {$gte: new Date(filters.postDate)}
    }

    if (filters.locations) {
      let locations = await ForumLocation.find({'name': {$in: filters.locations}}).select('id')
      locations = locations.map((l) => l._id)
      where['locations.forumLocation'] = {$in: locations}
    }

    let registers = []
    try {
      registers =  await Forum.find(where)
      .select(select)
      .populate({path: 'tags', select: 'id name'})
      .populate({path: 'locations.forumLocation', select: 'id name'})
      .skip(paging ? (pageNumber > 0 ? ( ( pageNumber - 1 ) * nPerPage ) : 0) : null)
      .limit(paging ? nPerPage : null)
      .sort({created_at: -1})
      .lean()

      for await (const register of registers) {
        if (register.coverUrl) {
          register.coverUrl = this.coverUrl(register)
        }
      }
    } catch (e) {}

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        forums: [
          ...registers
        ],
        total_register: (paging) ? await Forum.find(where).count() : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    })
  }

}

export const forumService = new ForumService();
export { ForumService as DefaultAdminForumForumService };
