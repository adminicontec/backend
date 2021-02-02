// @import_dependencies_node Import libraries
import moment from 'moment';
// @end

// @import services
import {userService} from '@scnode_app/services/default/admin/user/userService'
import {forumService} from '@scnode_app/services/default/admin/forum/forumService'
import {forumMessageService} from '@scnode_app/services/default/events/forum/forumMessageService'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import { Forum, ForumMessage } from '@scnode_app/models';
// @end

// @import types
import {QueryValues} from '@scnode_app/types/default/global/queryTypes'
import {IFetchMessagesByForum, IFetchForums} from '@scnode_app/types/default/data/forum/forumDataTypes'
// @end

class ForumDataService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite consultar los foros
   * @param params Parametros que permiten consultar la data
   * @returns
   */
  public fetchForums = async (params: IFetchForums) => {

    try {
      const paging = (params.pageNumber && params.nPerPage) ? true : false

      const pageNumber= params.pageNumber ? (parseInt(params.pageNumber)) : 1
      const nPerPage= params.nPerPage ? (parseInt(params.nPerPage)) : 10

      let select = 'id title description coverUrl postDate isActive tags locations'
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

      if (params.postDate) {
        where['postDate'] = {$gte: new Date(params.postDate)}
      }

      // TODO: Buscar foros por localización

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
            register.coverUrl = forumService.coverUrl(register)
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

    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que permite consultar los mensajes de un canal
   * @param params Objeto con los datos para generar la consulta
   * @returns
   */
  public fetchMessagesByForum = async (params: IFetchMessagesByForum) => {

    try {
      const paging = true

      const pageNumber = params.pageNumber ? (parseInt(params.pageNumber)) : 1
      const nPerPage   = params.nPerPage ? (parseInt(params.nPerPage)) : 10

      let user = null

      // @INFO: Validando usuario
      const user_exists: any = await userService.findBy({
        query: QueryValues.ONE,
        where: [{field: '_id', value: params.user}]
      })
      if (user_exists.status === 'error') return user_exists
      user = user_exists.user

      const dateFilter = params.dateFilter ? params.dateFilter : moment().format('YYYY-MM-DDTHH:mm:ssZ')

      // @INFO: Validando canal y la participación del usuario en este
      const forum = await Forum.findOne({
        _id: params.forum,
      }).select('id')
      if (!forum) return responseUtility.buildResponseFailed('json', null, {error_key: 'forum.forum.not_found'})

      // @INFO: Consultando los mensajes del canal desde el ultimo al mas antiguo
      let totalRegisters = 0

      let where = {
        forum: params.forum
      }

      if (paging) {
        totalRegisters = await ForumMessage.find(where).count()
      }

      where['message.date'] = {$lt: dateFilter}

      let messages: any = await ForumMessage.find(where)
      .select('id posted_by message')
      .populate({path: 'posted_by', select: 'id profile.name profile.lastName profile.avatarImageUrl'})
      .limit(paging ? nPerPage : null)
      .sort({'message.date': -1})
      .lean()

      messages = await forumMessageService.processForumMessagesData({
        messages,
        user
      })

      return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
        messages,
        total_register: totalRegisters,
        dateFilter: (messages.length > 0) ? messages[messages.length - 1].message.date : null,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }})
    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }
}

export const forumDataService = new ForumDataService();
export { ForumDataService as DefaultDataForumForumDataService };
