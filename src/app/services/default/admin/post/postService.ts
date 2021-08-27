// @import_dependencies_node Import libraries
const ObjectID = require('mongodb').ObjectID
// @end

// @import services
import {postTypeService} from '@scnode_app/services/default/admin/post/postTypeService'
import {postCategoryService} from '@scnode_app/services/default/admin/post/postCategoryService'
import { uploadService } from '@scnode_core/services/default/global/uploadService'
// @end

// @import config
import { customs } from '@scnode_core/config/globals'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import {mapUtility} from '@scnode_core/utilities/mapUtility'
// @end

// @import models
import {Post, PostCategory, PostLocation, PostType} from '@scnode_app/models'
// @end

// @import types
import {IQueryFind, QueryValues} from '@scnode_app/types/default/global/queryTypes'
import {IPost, IPostDelete, IPostQuery, IPostLocations} from '@scnode_app/types/default/admin/post/postTypes'
// @end

const POST_DATE = ['news', 'research', 'webinar', 'capsules', 'blog']

class PostService {

  private default_cover_path = 'posts'

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

      let select = 'id title subtitle content coverUrl postDate eventDate lifeSpan highlighted isActive startDate endDate externUrl user postType tags locations video researchUrl'
      if (params.query === QueryValues.ALL) {
        const registers: any = await Post.find(where)
        .populate({path: 'postType', select: 'id name'})
        .populate({path: 'tags', select: 'id name'})
        .populate({path: 'locations.postLocation', select: 'id name'})
        .select(select)
        .lean()

        for await (const register of registers) {
          if (register.coverUrl) {
            register.coverUrl = this.coverUrl(register)
          }
          if (register.researchUrl) {
            register.researchUrl = this.researchUrl(register)
          }
        }

        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          posts: registers
        }})
      } else if (params.query === QueryValues.ONE) {
        const register: any = await Post.findOne(where)
        .populate({path: 'postType', select: 'id name'})
        .populate({path: 'tags', select: 'id name'})
        .populate({path: 'locations.postLocation', select: 'id name'})
        .select(select)
        .lean()

        if (!register) return responseUtility.buildResponseFailed('json', null, {error_key: 'post.post.not_found'})

        if (register.coverUrl) {
          register.coverUrl = this.coverUrl(register)
        }
        if (register.researchUrl) {
          register.researchUrl = this.researchUrl(register)
        }
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          post: register
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
  public insertOrUpdate = async (params: IPost) => {

    try {

      let postType = null

      // @INFO: Cargando imagen al servidor
      if (params.coverFile && params.coverFile !== '{}') {
        const defaulPath = this.default_cover_path
        const response_upload: any = await uploadService.uploadFile(params.coverFile, defaulPath)
        if (response_upload.status === 'error') return response_upload
        if (response_upload.hasOwnProperty('name')) params.coverUrl = response_upload.name
      }

      if (params.tags && typeof params.tags === 'string') params.tags = params.tags.split(',')
      if (params.tags && Array.isArray(params.tags)) {
        let tags = []
        await mapUtility.mapAsync(
          params.tags.map(async (t) => {
            const isObjectId = await ObjectID.isValid(t)
            if (!isObjectId) {
              const tagExists: any = await postCategoryService.findBy({query: QueryValues.ONE, where: [{field: 'name', value: t}]})
              if (tagExists.status === 'success') {
                tags.push(tagExists.postCategory._id)
              } else {
                const newTagResponse: any = await postCategoryService.insertOrUpdate({name: t})
                if (newTagResponse.status === 'success') {
                  tags.push(newTagResponse.postCategory._id)
                }
              }
            } else {
              tags.push(t)
            }
          })
        )
        params.tags = tags
      }

      if (params.tags && typeof params.tags === 'string') {
        params.tags = params.tags.split(',')
      }

      if (params.locations && typeof params.locations === 'string') {
        let splitLocations = params.locations.split(',')
        let newLocations = []
        splitLocations.map((sl) => {
          newLocations.push({
            postLocation: sl,
            viewCounter: 0
          })
        })
        params.locations = newLocations
      }

      // @INFO Reviso si viene video
      if(params.platform_video && params.url_video){
        params.video = {
          platform: params.platform_video,
          url: params.url_video
        }
      }

      // @INFO Reviso si viene archivo de articulo
      if(params.researchFile && params.researchFile !== '{}'){
        const defaulPath = this.default_cover_path
        const response_upload: any = await uploadService.uploadFile(params.researchFile, defaulPath)
        if (response_upload.status === 'error') return response_upload
        if (response_upload.hasOwnProperty('name')) params.researchUrl = response_upload.name
      }

      if (params.content && typeof params.content === 'string') {
        params.content = JSON.parse(params.content)
      }

      if (params.id) {
        const register: any = await Post.findOne({_id: params.id}).lean()
        if (!register) return responseUtility.buildResponseFailed('json', null, {error_key: 'post.post.not_found'})

        if (params.postType) {
          const postTypeResponse: any = await postTypeService.findBy({query: QueryValues.ONE, where: [{field: "_id", value: params.postType}]})
          if (postTypeResponse.status === 'error') return postTypeResponse
          postType = postTypeResponse.postType

          if (POST_DATE.includes(postType.name)) {
            if (!params.postDate) return responseUtility.buildResponseFailed('json', null, {error_key: 'post.post.post_date_required'})
          } else if (postType.name === 'event') {
            if (!params.eventDate) return responseUtility.buildResponseFailed('json', null, {error_key: 'post.post.event_date_required'})
          }
        }

        // @INFO: Actualizando ubicaciones de la publicación
        if (params.locations && params.locations.length > 0) {
          let oldLocations: IPostLocations[] = register.locations
          if (oldLocations && Array.isArray(oldLocations) && oldLocations.length > 0) {
            for await (const location of params.locations) {
              if (typeof location !== 'string') {
                if (!location.viewCounter) {
                  let findIndex = oldLocations.findIndex((ol) => location.postLocation.toString() === ol.postLocation.toString())
                  if (findIndex !== -1) {
                    location.viewCounter = (oldLocations[findIndex].viewCounter) ? oldLocations[findIndex].viewCounter : 0
                  }
                }
              }
            }
          }
        } else if (params.location) {
          // @INFO: Actualizando ubicación de la publicación
          params.locations = [...register.locations]
          if (params.locations && Array.isArray(params.locations) && params.locations.length > 0) {
            let findIndex = params.locations.findIndex((ol) => params.location.postLocation.toString() === ol.postLocation.toString())
            if (findIndex !== -1) {
              if (params.location.viewCounter === 0) {
                params.locations[findIndex].viewCounter = 0
              } else if (params.location.viewCounter) {
                params.locations[findIndex].viewCounter = (params.location.viewCounter) ? params.location.viewCounter : 0
              }
            }
          }
        }

        const response: any = await Post.findByIdAndUpdate(params.id, params, {
          useFindAndModify: false,
          new: true,
          lean: true,
        })
        await PostType.populate(response, {path: 'postType', select: 'id name'})
        await PostCategory.populate(response, {path: 'tags', select: 'id name'})
        await PostLocation.populate(response, {path: 'locations.postLocation', select: 'id name'})

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            post: {
              ...response,
              coverUrl: this.coverUrl(response),
              researchUrl: this.researchUrl(response)
            }
          }
        })

      } else {
        const postTypeResponse: any = await postTypeService.findBy({query: QueryValues.ONE, where: [{field: "_id", value: params.postType}]})
        if (postTypeResponse.status === 'error') return postTypeResponse
        postType = postTypeResponse.postType

        if (POST_DATE.includes(postType.name)) {
          if (!params.postDate) return responseUtility.buildResponseFailed('json', null, {error_key: 'post.post.post_date_required'})
        } else if (postType.name === 'event') {
          if (!params.eventDate) return responseUtility.buildResponseFailed('json', null, {error_key: 'post.post.event_date_required'})
        }

        const {_id} = await Post.create(params)
        const response: any = await Post.findOne({_id})
        .populate({path: 'postType', select: 'id name'})
        .populate({path: 'tags', select: 'id name'})
        .populate({path: 'locations.postLocation', select: 'id name'})
        .lean()

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            post: {
              ...response,
              coverUrl: this.coverUrl(response),
              researchUrl: this.researchUrl(response)
            }
          }
        })
      }

    } catch (e) {
      console.log('e',e )
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que convierte el valor del cover de una publicación a la URL donde se aloja el recurso
   * @param {config} Objeto con data del AcademicComponent
   */
  public coverUrl = ({ coverUrl }) => {
    return coverUrl && coverUrl !== ''
    ? `${customs['uploads']}/${this.default_cover_path}/${coverUrl}`
    : `${customs['uploads']}/${this.default_cover_path}/default.jpg`
  }

  /**
   * Metodo que convierte el valor del cover de una publicación a la URL donde se aloja el recurso
   * @param {config} Objeto con data del AcademicComponent
   */
  public researchUrl = ({ researchUrl }) => {
    return researchUrl && researchUrl !== ''
    ? `${customs['uploads']}/${this.default_cover_path}/${researchUrl}`
    : `${customs['uploads']}/${this.default_cover_path}/default.jpg`
  }

  /**
   * Metodo que permite hacer borrar un registro
   * @param params Filtros para eliminar
   * @returns
   */
  public delete = async (params: IPostDelete) => {
    try {
      const find: any = await Post.findOne({ _id: params.id })
      if (!find) return responseUtility.buildResponseFailed('json', null, { error_key: 'post.post.not_found' })

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
  public list = async (filters: IPostQuery = {}) => {

    const paging = (filters.pageNumber && filters.nPerPage) ? true : false

    const pageNumber= filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage= filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let select = 'id title subtitle content coverUrl postDate eventDate lifeSpan highlighted isActive startDate endDate externUrl user postType tags video researchUrl'
    if (filters.select) {
      select = filters.select
    }

    let where = {}

    if(filters.search){
      const search = filters.search
      where = {
        ...where,
        $or:[
          {title: { $regex: '.*' + search + '.*',$options: 'i' }},
          {subtitle: { $regex: '.*' + search + '.*',$options: 'i' }},
          {content: { $regex: '.*' + search + '.*',$options: 'i' }},
        ]
      }
    }

    if (filters.isActive === true) {
      where['isActive'] = true
    } else if (filters.isActive === false) {
      where['isActive'] = false
    }

    if (filters.postType && Array.isArray(filters.postType) && filters.postType.length > 0) {
      const categories = await PostType.find({name: {$in: filters.postType}}).select('id').lean()
      if (categories && categories.length > 0) {
        where['postType'] = {$in: categories.map((c) => c._id)}
      }
    }

    if (filters.postDate) {
      where['postDate'] = {$gte: new Date(filters.postDate)}
    }

    if (filters.eventDate) {
      where['eventDate'] = {$gte: new Date(filters.eventDate)}
    }

    if (filters.locations) {
      let locations = await PostLocation.find({'name': {$in: filters.locations}}).select('id')
      locations = locations.map((l) => l._id)
      where['locations.postLocation'] = {$in: locations}
    }

    let registers = []
    try {
      registers =  await Post.find(where)
      .select(select)
      .populate({path: 'postType', select: 'id name'})
      .populate({path: 'tags', select: 'id name'})
      .populate({path: 'locations.postLocation', select: 'id name'})
      .skip(paging ? (pageNumber > 0 ? ( ( pageNumber - 1 ) * nPerPage ) : 0) : null)
      .limit(paging ? nPerPage : null)
      .sort({created_at: -1})
      .lean()

      for await (const register of registers) {
        if (register.coverUrl) {
          register.coverUrl = this.coverUrl(register)
        }
        if (register.researchUrl) {
          register.researchUrl = this.researchUrl(register)
        }
      }
    } catch (e) {}

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        posts: [
          ...registers
        ],
        total_register: (paging) ? await Post.find(where).count() : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    })
  }

}

export const postService = new PostService();
export { PostService as DefaultAdminPostPostService };
