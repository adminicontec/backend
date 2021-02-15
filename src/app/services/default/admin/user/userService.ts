// @import_dependencies_node Import libraries
import bcrypt from "bcrypt-nodejs";
import moment from 'moment';
const ObjectID = require('mongodb').ObjectID
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
import {Country, Role, User} from '@scnode_app/models'
// @end

// @import types
import {IQueryFind, QueryValues} from '@scnode_app/types/default/global/queryTypes'
import {IUser, IUserDelete, IUserQuery, IUserDateTimezone} from '@scnode_app/types/default/admin/user/userTypes'
// @end
class UserService {

  private default_avatar_path = 'avatars'

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

      let select = '-created_at -updated_at -__v'
      if (params.query === QueryValues.ALL) {
        const registers: any = await User.find(where)
        .populate({path: 'roles', select: 'id name description'})
        .populate({path: 'profile.country', select: 'id name iso2 iso3'})
        .select(select)
        .lean()

        for await (const register of registers) {
          if (register.profile) {
            register.profile.avatarImageUrl = this.avatarUrl(register)
          }
        }

        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          users: registers
        }})
      } else if (params.query === QueryValues.ONE) {
        const register: any = await User.findOne(where)
        .populate({path: 'roles', select: 'id name description'})
        .populate({path: 'profile.country', select: 'id name iso2 iso3'})
        .select(select)
        .lean()
        if (!register) return responseUtility.buildResponseFailed('json', null, {error_key: 'user.not_found'})

        if (register.profile) {
          register.profile.avatarImageUrl = this.avatarUrl(register)
        }
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          user: register
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
  public insertOrUpdate = async (params: IUser) => {

    try {

      // TODO: Que va en los siguientes campos
      // 1. normalizedusername
      // 2. normalizedEmail
      // 3. securityStamp
      // 4. concurrencyStamp

      if (!params.profile) params.profile = {}

      // @INFO: Almacenando en servidor la imagen adjunta
      if (params.avatar) {
        const defaulPath = this.default_avatar_path
        const response_upload: any = await uploadService.uploadFile(params.avatar, defaulPath)
        if (response_upload.status === 'error') return response_upload
        if (response_upload.hasOwnProperty('name')) params.profile.avatarImageUrl = response_upload.name
      }

      // TODO: Guardar los siguientes campos, debo proporcionar un usuario
      // createdBy
      // lastModifiedBy

      if (params.id) {
        let register: any = await User.findOne({_id: params.id})
        if (!register) return responseUtility.buildResponseFailed('json', null, {error_key: 'user.not_found'})

        // @INFO: Validando campos unicos
        if (params.username && params.email) {
          const exist = await User.findOne({
            $or: [
              {username: params.username},
              {email: params.email},
            ],
            _id: {$ne: params.id}
           })
           if (exist) return responseUtility.buildResponseFailed('json', null, { error_key: {key: 'user.insertOrUpdate.already_exists', params: {data: `${params.username}|${params.email}`}} })
        } else if (params.username) {
          const exist = await User.findOne({ username: params.username, _id: {$ne: params.id}})
          if (exist) return responseUtility.buildResponseFailed('json', null, { error_key: {key: 'user.insertOrUpdate.already_exists', params: {data: params.username}} })
        } else if (params.email) {
          const exist = await User.findOne({ email: params.email, _id: {$ne: params.id}})
          if (exist) return responseUtility.buildResponseFailed('json', null, { error_key: {key: 'user.insertOrUpdate.already_exists', params: {data: params.email}} })
        }

        if (params.password && params.password !== "") {
          params.passwordHash = await this.hashPassword(params.password);
        }

        if (params.profile) {
          params.profile = {
            ...register.profile,
            ...params.profile
          }
        }

        if (params.curriculum_vitae) {
          params.curriculum_vitae = {
            ...register.curriculum_vitae,
            ...params.curriculum_vitae
          }
        }

        const response: any = await User.findByIdAndUpdate(params.id, params, {
          useFindAndModify: false,
          new: true,
          lean: true,
        })
        await Role.populate(response, {path: 'roles', select: 'id name description'})
        await Country.populate(response, {path: 'profile.country', select: 'id name iso2 iso3'})

        if (response.profile) {
          response.profile.avatarImageUrl = this.avatarUrl(response)
        }

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            user: {
              ...response,
            }
          }
        })

      } else {
        const exist = await User.findOne({
          $or: [
            {username: params.username},
            {email: params.email},
          ]
         })
        if (exist) return responseUtility.buildResponseFailed('json', null, { error_key: {key: 'user.insertOrUpdate.already_exists', params: {data: `${params.username}|${params.email}`}} })

        if (!params.password) return responseUtility.buildResponseFailed("json", null, {error_key: "user.insertOrUpdate.password_required"});

        params.passwordHash = await this.hashPassword(params.password);

        const {_id} = await User.create(params)
        const response: any = await User.findOne({_id})
        .populate({path: 'roles', select: 'id name description'})
        .populate({path: 'profile.country', select: 'id name iso2 iso3'})
        .lean()

        if (response.profile) {
          response.profile.avatarImageUrl = this.avatarUrl(response)
        }

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            user: {
              ...response
            }
          }
        })
      }

    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que encripta el password del usuario
   * @param password Contraseña
   * @returns
   */
  private hashPassword = async (password) => {
    const hash = await new Promise((resolve, reject) => {
      bcrypt.hash(password, null, null, (err, hash) => {
        if (err) reject(err);
        resolve(hash);
      });
    });
    return hash.toString();
  };

  /**
   * Metodo que convierte el valor del cover de una publicación a la URL donde se aloja el recurso
   * @param {config} Objeto con data del AcademicComponent
   */
  public avatarUrl = ({ profile }) => {
    return profile && profile.avatarImageUrl && profile.avatarImageUrl !== ''
    ? `${customs['uploads']}/${this.default_avatar_path}/${profile.avatarImageUrl}`
    : `${customs['uploads']}/${this.default_avatar_path}/default.jpg`
  }

  /**
   * Metodo que permite hacer borrar un registro
   * @param params Filtros para eliminar
   * @returns
   */
  public delete = async (params: IUserDelete) => {
    try {
      const find: any = await User.findOne({ _id: params.id })
      if (!find) return responseUtility.buildResponseFailed('json', null, { error_key: 'user.not_found' })

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
  public list = async (filters: IUserQuery = {}) => {

    const paging = (filters.pageNumber && filters.nPerPage) ? true : false

    const pageNumber= filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage= filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let select = '-created_at -updated_at -__v'
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
      registers =  await User.find(where)
      .select(select)
      .populate({path: 'roles', select: 'id name description'})
      .populate({path: 'profile.country', select: 'id name iso2 iso3'})
      .skip(paging ? (pageNumber > 0 ? ( ( pageNumber - 1 ) * nPerPage ) : 0) : null)
      .limit(paging ? nPerPage : null)

      for await (const register of registers) {
        if (register.profile) {
          register.profile.avatarImageUrl = this.avatarUrl(register)
        }
      }
    } catch (e) {}

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        users: [
          ...registers
        ],
        total_register: (paging) ? await User.find(where).count() : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    })
  }

  /**
	 * Metodo que permite convertir una fecha segun el timezone del usuario
	 * @param data Información a convertir
	 * @returns
	 */
	public getDateByUserTimezone = async (params: IUserDateTimezone) => {
    let user = null

    const userIsObjectId = await ObjectID.isValid(params.user)
    if (typeof params.user === 'string' || userIsObjectId) {
      user = await User.findOne({_id: params.user})
      .select('id profile.timezone profile.culture')
      .lean()
      // if (!user) return responseUtility.buildResponseFailed('json', null, {error_key: 'user.not_found'})
    } else {
      user = params.user
    }

    if (user && user.profile && user.profile.culture) {
      moment.locale(user.profile.culture)
    }

    let timezone = 'GMT-5'
    if (user && user.profile && user.profile.timezone) {
      timezone = user.profile.timezone
    }
    timezone = timezone.replace('GMT','')

    let momentDate = null
    if (params.date) {
      momentDate = moment.utc(params.date).utcOffset(parseInt(timezone))
    } else {
      momentDate = moment.utc().utcOffset(parseInt(timezone))
    }

    return moment.utc(momentDate.format('YYYY-MM-DD HH:mm:ss'))
  }

}

export const userService = new UserService();
export { UserService as DefaultAdminUserUserService };
