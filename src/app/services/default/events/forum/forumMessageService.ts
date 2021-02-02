// @import_dependencies_node Import libraries
import moment from 'moment';
// @end

// @import services
import {userService} from '@scnode_app/services/default/admin/user/userService'
import { uploadService } from '@scnode_core/services/default/global/uploadService'
import { forumService } from '@scnode_app/services/default/admin/forum/forumService';
// @end

// @import config
import { customs } from '@scnode_core/config/globals'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import { ForumMessage } from '@scnode_app/models';
// @end

// @import types
import {QueryValues} from '@scnode_app/types/default/global/queryTypes'
import {ISendMessage, IForumMessage, IForumMessagesData, IForumMessageDelete, IForumMessageData} from '@scnode_app/types/default/events/forum/forumMessageTypes'
// @end

class ForumMessageService {

  private default_path = 'forums/attached'

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite agregar un nuevo mensaje a un foro
   * @param params Objeto con los parametros necesarios para generar el mensaje
   * @returns
   */
  public sendMessage = async (params: ISendMessage) => {

    try {

      let user = null
      let forum = null

      // @INFO: Validando foro
      const forum_exists: any = await forumService.findBy({
        query: QueryValues.ONE,
        where: [{field: '_id', value: params.forum}]
      })
      if (forum_exists.status === 'error') return forum_exists
      forum = forum_exists.forum

      // @INFO: Validando usuario
      const user_exists: any = await userService.findBy({
        query: QueryValues.ONE,
        where: [{field: '_id', value: params.user}]
      })
      if (user_exists.status === 'error') return user_exists
      user = user_exists.user

      let message: IForumMessage = {
        text: (params.message) ? params.message : null,
        attached: null,
        date: moment().format('YYYY-MM-DD HH:mm:ss'),
      }

      // @INFO: Cargando el archivo adjunto si esta presente
      if (params.attachment) {
        const defaulPath = this.default_path
        const response_upload: any = await uploadService.uploadFile(params.attachment, defaulPath)
        if (response_upload.status === 'error') return response_upload
        if (response_upload.hasOwnProperty('name')) message.attached = response_upload.name
      }

      if (message.text === null && message.attached === null) return responseUtility.buildResponseFailed('json', null, {error_key: 'forum.message.invalid'})

      const {_id} = await ForumMessage.create({
        forum: params.forum,
        message,
        posted_by: user._id
      })
      const response: any = await ForumMessage.findOne({_id})
      .select('id posted_by message')
      .populate({path: 'posted_by', select: 'id profile.first_name profile.last_name profile.avatarImageUrl'})
      .lean()

      let messageProcess = await this.processForumMessagesData({
        user,
        messages: response
      })

      // @INFO: Generando emision de socket
      if (params.socket_emit && response) {
        // TODO: Implementar socket util
        // socketUtility.emit('channel:new_message', messageProcess[0],`channel:${params.talk_channel}`)
      }

      return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
        message: messageProcess
      }})

    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que permite procesar la información de los mensajes y prepararla para su consumo
   * @param params Objeto con los parametros de los mensajes
   * @returns
   */
  public processForumMessagesData = async (params: IForumMessagesData) => {
    let usersProcessed = []

    if (Array.isArray(params.messages)) {
      let messages = []
      for await (let message of params.messages) {
        message = await this.processTalkChannelMessageData(message, params.user, usersProcessed)
        messages.push(message)
      }
      return messages
    } else {
      let message = await this.processTalkChannelMessageData(params.messages, params.user, usersProcessed)
      return message
    }
  }

  /**
   * Metodo que permite procesar la información de un mensaje
   * @param params Objeto con los parametros del mensaje
   * @param user Usuario con sesión iniciada
   * @param usersProcessed Array de usuarios procesados
   * @returns
   */
  private processTalkChannelMessageData = async (params: IForumMessageData, user: any, usersProcessed: Array<any>) => {

    if (params.posted_by && params.posted_by.profile && !usersProcessed.includes(params.posted_by._id)) {
      usersProcessed.push(params.posted_by._id)
      params.posted_by.profile.avatarImageUrl = await userService.avatarUrl(params.posted_by)
    }

    if (params.message) {
      if (params.message.attached) {
        params.message.attached = await this.attachedUrl(params.message)
      }
      if (params.message.date) {
        const newDate = await userService.getDateByUserTimezone({
          date: params.message.date,
          user
        })
        params.message.dateFormated = newDate.format('hh:mm a | DD MMMM')
      }
    }
    return params
  }

  /**
   * Metodo que convierte el valor del adjunto de un mensaje a la URL donde se aloja el recurso
   * @param {attached} Objeto con data del mensaje
   */
  public attachedUrl = ({ attached }: IForumMessage) => {
    return attached && attached !== ''
    ? `${customs['uploads']}/${this.default_path}/${attached}`
    : null
  }

  // TODO: Editar un mensaje (solo es posible si es el dueño del mensaje)

  /**
   * Metodo que permite eliminar un mensaje
   * @param params Objeto con los datos necesarios para eliminar el mensaje
   * @returns
   */
  public delete = async (params: IForumMessageDelete) => {

    try {
      const find: any = await ForumMessage.findOne({ _id: params.id })
      if (!find) return responseUtility.buildResponseFailed('json', null, { error_key: 'forum.message.not_found' })

      if (find.posted_by.toString() !== params.user.toString()) return responseUtility.buildResponseFailed('json', null, { error_key: 'forum.message.delete.only_my_messages' })

      await find.delete()

      return responseUtility.buildResponseSuccess('json', null)
    } catch (error) {
      return responseUtility.buildResponseFailed('json', null, { error_key: 'forum.message.delete.fail_action' })
    }
  }
}

export const forumMessageService = new ForumMessageService();
export { ForumMessageService as DefaultEventsForumForumMessageService };
