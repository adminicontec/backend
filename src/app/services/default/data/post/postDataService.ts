// @import_dependencies_node Import libraries
import moment from 'moment'
// @end

// @import services
import {postService} from '@scnode_app/services/default/admin/post/postService'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import { Post, PostCategory, PostLocation, PostType } from '@scnode_app/models';
// @end

// @import types
import {QueryValues} from '@scnode_app/types/default/global/queryTypes'
import {IFetchPosts, IFetchPost} from '@scnode_app/types/default/data/post/postDataTypes'
// @end
class PostDataService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite consultar la categorias de una publicación
   * @param params
   * @returns
   */
   public fetchCategories = async (params: IFetchPost) => {

    try {

      let categories = await PostCategory.find()
      .select('id name')
      .lean()

      return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
        categories: categories
      }})

    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que permite consultar la información de un Post
   * @param params
   * @returns
   */
  public fetchPost = async (params: IFetchPost) => {

    try {

      let select = 'id title subtitle content coverUrl postDate eventDate lifeSpan highlighted isActive startDate endDate externUrl user postType tags authors video researchUrl'

      let where = {}

      if (params.id) {
        where['_id'] = params.id
      } else if (params.slug) {
        where['title'] = params.slug
      } else {
        return responseUtility.buildResponseFailed('json', null, {error_key: 'post.post.filter_to_search_required'})
      }

      let register = null
      try {
        register =  await Post.findOne(where)
        .select(select)
        .populate({path: 'postType', select: 'id name'})
        .populate({path: 'tags', select: 'id name'})
        .populate({path: 'locations.postLocation', select: 'id name'})
        .lean()

        if (register && register.coverUrl) {
          register.coverUrl = postService.coverUrl(register)
        }
        if (register && register.researchUrl) {
          register.researchUrl = postService.researchUrl(register)
        }
      } catch (e) {}

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          post: register
        }
      })

    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que permite consultar las publicaciones
   * @param params Parametros que permiten consultar la data
   * @returns
   */
  public fetchPosts = async (params: IFetchPosts) => {

    try {
      const paging = (params.pageNumber && params.nPerPage) ? true : false

      const pageNumber= params.pageNumber ? (parseInt(params.pageNumber)) : 1
      const nPerPage= params.nPerPage ? (parseInt(params.nPerPage)) : 10

      let select = 'id title subtitle content coverUrl postDate eventDate lifeSpan highlighted isActive startDate endDate externUrl user postType tags authors video researchUrl'
      if (params.select) {
        select = params.select
      }

      let where = {}

      if(params.search){
        const search = params.search
        where = {
          ...where,
          $or:[
            {name: { $regex: '.*' + search + '.*',$options: 'i' }},
            {description: { $regex: '.*' + search + '.*',$options: 'i' }},
          ]
        }
      }

      if (typeof params.isActive === 'undefined' || params.isActive === true) {
        where['isActive'] = true
      }

      if (params.postType && Array.isArray(params.postType) && params.postType.length > 0) {
        const categories = await PostType.find({name: {$in: params.postType}}).select('id').lean()
        if (categories && categories.length > 0) {
          where['postType'] = {$in: categories.map((c) => c._id)}
        }
      }

      if (params.postDate) {
        let direction = 'lte'
        let date = moment.utc()
        if (params.postDate.date !== 'today') {
          date = moment.utc(params.postDate.date)
        }
        if (params.postDate.direction) direction = params.postDate.direction
        where['postDate'] = {[`$${direction}`]: date.format('YYYY-MM-DD')}
      }

      if (params.eventDate) {
        let direction = 'lte'
        let date = moment.utc()
        if (params.eventDate.date !== 'today') {
          date = moment.utc(params.eventDate.date)
        }
        if (params.eventDate.direction) direction = params.eventDate.direction
        where['eventDate'] = {[`$${direction}`]: date.format('YYYY-MM-DD')}
      }

      if (params.locations) {
        let locations = await PostLocation.find({'name': {$in: params.locations}}).select('id')
        locations = locations.map((l) => l._id)
        where['locations.postLocation'] = {$in: locations}
      }

      if (params.tags && Array.isArray(params.tags) && params.tags.length > 0) {
        where['tags'] = {$in: params.tags}
      }

      let sort = null
      if (params.sort) {
        sort = {}
        sort[params.sort.field] = params.sort.direction
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
        .sort(sort)
        .lean()

        for await (const register of registers) {
          if (register.coverUrl) {
            register.coverUrl = postService.coverUrl(register)
          }
          if (register.researchUrl) {
            register.researchUrl = postService.researchUrl(register)
          }
          if (register.title) {
            register.slug = encodeURI(register.title)
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

    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }


}

export const postDataService = new PostDataService();
export { PostDataService as DefaultDataPostPostDataService };
