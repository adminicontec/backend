// @import_dependencies_node Import libraries
import bcrypt from "bcrypt-nodejs";
import moment from 'moment';
const ObjectID = require('mongodb').ObjectID
// @end

// @import services
import { uploadService } from '@scnode_core/services/default/global/uploadService'
import { moodleUserService } from '@scnode_app/services/default/moodle/user/moodleUserService'
import { mailService } from '@scnode_app/services/default/general/mail/mailService';
import { countryService } from '@scnode_app/services/default/admin/country/countryService'
// @end

// @import config
import { customs } from '@scnode_core/config/globals'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { i18nUtility } from "@scnode_core/utilities/i18nUtility";
import { generalUtility } from '@scnode_core/utilities/generalUtility';
// @end

// @import models
import { Country, Role, User, AppModulePermission } from '@scnode_app/models'
// @end

// @import types
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes'
import { IUser, IUserDelete, IUserQuery, IUserDateTimezone } from '@scnode_app/types/default/admin/user/userTypes'
import { IMoodleUser, IMoodleUserQuery } from '@scnode_app/types/default/moodle/user/moodleUserTypes'
import { utils } from "xlsx/types";
// @end
class UserService {

  private default_avatar_path = 'avatars'

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor() { }

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
          .populate({ path: 'roles', select: 'id name description' })
          .populate({ path: 'profile.country', select: 'id name iso2 iso3' })
          .select(select)
          .lean()

        for await (const register of registers) {
          if (register.profile) {
            register.profile.avatarImageUrl = this.avatarUrl(register)
            register.profile.avatar = register.profile.avatarImageUrl
          }
        }

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            users: registers
          }
        })
      } else if (params.query === QueryValues.ONE) {
        const register: any = await User.findOne(where)
          .populate({ path: 'roles', select: 'id name description' })
          .populate({ path: 'profile.country', select: 'id name iso2 iso3' })
          .select(select)
          .lean()
        if (!register) return responseUtility.buildResponseFailed('json', null, { error_key: 'user.not_found' })

        if (register.profile) {
          register.profile.avatarImageUrl = this.avatarUrl(register)
          register.profile.avatar = register.profile.avatarImageUrl
        }
        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            user: register
          }
        })
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

    const defaultCountryCode= '6058e1f00520a25777a0eb4d';
    const defaultCountryISO = 'CO';
    try {

      // TODO: Que va en los siguientes campos
      // 1. normalizedusername
      // 2. normalizedEmail
      // 3. securityStamp
      // 4. concurrencyStamp

      console.log("====================== USER SERVICE ====================== ");
      console.log("1.1. UserService.insertOrUpdate()--> ");
      console.log(params);

      let countryCode = '';

      for (const key in params) {
        if (Object.prototype.hasOwnProperty.call(params, key)) {
          const element = params[key];
          if (element === 'undefined' || element === 'null') {
            if (!params['$unset']) {
              params['$unset'] = {}
            }
            params['$unset'][key] = 1
            delete params[key];
          }
        }
      }

      if (!params.profile) {
        params.profile = {}
      } else if (params.profile && typeof params.profile === "string") {
        params.profile = JSON.parse(params.profile);
      }

      // @INFO: Almacenando en servidor la imagen adjunta
      if (params.avatar) {
        console.log("--> avatar");
        const defaulPath = this.default_avatar_path
        const response_upload: any = await uploadService.uploadFile(params.avatar, defaulPath)
        if (response_upload.status === 'error') return response_upload
        if (response_upload.hasOwnProperty('name')) params.profile.avatarImageUrl = response_upload.name
      }
      console.log("Roles --> ");
      if (!params.roles) {
        // params.roles = []
      } else if (typeof params.roles === "string") {
        params.roles = params.roles.split(",");
      }

      // TODO: Guardar los siguientes campos, debo proporcionar un usuario
      // createdBy
      // lastModifiedBy
      if (params.id) {
        let sendWelcomEmail = false;
        console.log(":: :: Update User ID --> " + params.id);
        let register: any = await User.findOne({ _id: params.id })
        if (!register) return responseUtility.buildResponseFailed('json', null, { error_key: 'user.not_found' })


        // @INFO: Validando campos unicos
        if (params.username) {
          const exist = await User.findOne({ name: params.username, _id: { $ne: params.id } })
          if (exist) return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'user.insertOrUpdate.already_exists', params: { data: `${params.username}` } } })
        }

        // @INFO: Si se proporciona la contraseña actual la verificamos para establecer si es correcta
        if (params.current_password) {
          const exist = await bcrypt.compareSync(params.current_password, register.passwordHash)
          if (!exist) return responseUtility.buildResponseFailed("json", null, { error_key: "user.current_password_invalid" });
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

        if (params.profile.country) {
          // Si el valor de Country no es hexadecimal, se consulta para modificar el Profile y UserMoodle
          if (!generalUtility.checkHexadecimalCode(params.profile.country)) {
            console.log("nombre de país: " + params.profile.country)
            const respCountry: any = await countryService.findBy({ query: QueryValues.ONE, where: [{ field: 'name', value: params.profile.country }] })
            if (respCountry.status != 'error') {
              params.profile.country = respCountry.country._id;
              countryCode = respCountry.country.iso2;
            }
            else {
              // valores predeterminados
              params.profile.country = defaultCountryCode;
              countryCode = defaultCountryISO;
            }
          }
          else {
            console.log("código de país: " + params.profile.country)
            const respCountry: any = await countryService.findBy({ query: QueryValues.ONE, where: [{ field: 'id', value: params.profile.country.toString() }] })
            if (respCountry.status != 'error') {
              console.log(respCountry)
              params.profile.country = respCountry.country._id;
              countryCode = respCountry.country.iso2;
            }
            else {
              // valores predeterminados
              params.profile.country = defaultCountryCode;
              countryCode = defaultCountryISO;
            }
          }
        }

        if (register.email !== params.email)
          sendWelcomEmail = true;

        console.log("Ready to update");
        console.log(params)
        try {
          const response: any = await User.findByIdAndUpdate(params.id, params, {
            useFindAndModify: false,
            new: true,
            lean: true,
          });

          await Role.populate(response, { path: 'roles', select: 'id name description' })
          await Country.populate(response, { path: 'profile.country', select: 'id name iso2 iso3' })
          if (response.profile) {
            response.profile.avatarImageUrl = this.avatarUrl(response)
            response.profile.avatar = response.profile.avatarImageUrl
          }

          // update usario existente en MOODLE
          console.log("Moodle: Actualizando Usuario --> " + response.moodle_id);

          var paramsMoodleUser: IMoodleUser = {
            id: response.moodle_id,
            city: params.profile.city,
            country: countryCode,
            documentNumber: params.profile.doc_number,
            email: params.email,
            username: params.username,
            password: params.password,
            phonenumber: params.phoneNumber,
            firstname: params.profile.first_name,
            lastname: params.profile.last_name,
            fecha_nacimiento: params.profile.birthDate,
            genero: params.profile.genre,
            email_2: params.profile.alternativeEmail,
            origen: params.profile.origen,
            regional: params.profile.regional,
            cargo: params.profile.currentPosition,
            profesion: params.profile.carreer,
            nivel_educativo: params.profile.educationalLevel,
            empresa: params.profile.company,
          }

          let respMoodleUpdate: any = await moodleUserService.update(paramsMoodleUser);
          console.log("------> update from Moodle: ");
          console.log(respMoodleUpdate);



          // @INFO: Se envia email de bienvenida
          if (params.sendEmail === true && sendWelcomEmail === true) {
            console.log("Sending email to " + paramsMoodleUser.email)
            await this.sendRegisterUserEmail([paramsMoodleUser.email], {
              mailer: customs['mailer'],
              fullname: `${paramsMoodleUser.firstname} ${paramsMoodleUser.lastname}`,
              first_name: paramsMoodleUser.firstname,
              last_name: paramsMoodleUser.lastname,
              username: paramsMoodleUser.username,
              password: paramsMoodleUser.password,
              notification_source: `user_register_${response._id}`,
              amount_notifications: 1,
              sendWelcomEmail
            })
          }

          return responseUtility.buildResponseSuccess('json', null, {
            additional_parameters: {
              user: {
                ...response,
              }
            }
          })
        }
        catch (e) {
          console.log("error on update");
          console.log(e);
          return responseUtility.buildResponseFailed('json')
        }

      }
      else {
        //#region INSERT NEW USER
        console.log("* * User.findOne * *");
        const exist = await User.findOne({ name: params.username })

        console.log("If user Exists --> [" + params.username + "]");
        if (exist) return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'user.insertOrUpdate.already_exists', params: { data: `${params.username}|${params.email}` } } })

        console.log("If Password --> ");
        if (!params.password) return responseUtility.buildResponseFailed("json", null, { error_key: "user.insertOrUpdate.password_required" });

        params.passwordHash = await this.hashPassword(params.password);

        console.log("User --> " + params.username + "[Country]:" + params.profile.country);
        try {
          let userParams = params;
          if (params.profile.country) {
            const respCountry: any = await countryService.findBy({ query: QueryValues.ONE, where: [{ field: 'name', value: params.profile.country }] })

            console.log("Resultados de País:");
            console.log(respCountry);

            userParams.profile.country = respCountry.country._id;
            countryCode = respCountry.country.iso2;
          }

          const { _id } = await User.create(userParams)

          console.log("Get created  User --> ");
          const response: any = await User.findOne({ _id })
            .populate({ path: 'roles', select: 'id name description' })
            .populate({ path: 'profile.country', select: 'id name iso2 iso3' })
            .lean()

          if (response.profile) {
            response.profile.avatarImageUrl = this.avatarUrl(response)
            response.profile.avatar = response.profile.avatarImageUrl
          }

          console.log("=================== VALIDACION USUARIO EN MOODLE =================== ");
          var paramUserMoodle = {
            username: params.username
          }
          let respMoodleSearch: any = await moodleUserService.findBy(paramUserMoodle);
          console.log("moodleUserService()  resp:");
          console.log(respMoodleSearch);
          if (respMoodleSearch.status == "success") {
            if (respMoodleSearch.user == null) {
              console.log("Moodle: user NO exists ");
              // [revisión[]
              var paramsMoodleUser: IMoodleUser = {
                city: params.profile.city,
                country: countryCode,
                documentNumber: params.profile.doc_number,
                email: params.email,
                username: params.username,
                password: params.password,
                phonenumber: params.phoneNumber,
                firstname: params.profile.first_name,
                lastname: params.profile.last_name,
                fecha_nacimiento: params.profile.birthDate,
                genero: params.profile.genre,
                email_2: params.profile.alternativeEmail,
                origen: params.profile.origen,
                regional: params.profile.regional,
                cargo: params.profile.currentPosition,
                profesion: params.profile.carreer,
                nivel_educativo: params.profile.educationalLevel,
                empresa: params.profile.company,
              }
              console.log(paramsMoodleUser);

              // crear nuevo uusario en MOODLE
              let respMoodleInsert: any = await moodleUserService.insert(paramsMoodleUser);
              console.log("Moodle: Usuario creado con Éxito.");
              console.log(respMoodleInsert);

              if (respMoodleInsert.status === 'success') {
                if (respMoodleInsert.user.id && respMoodleInsert.user.username) {
                  await User.findByIdAndUpdate(_id, { moodle_id: respMoodleInsert.user.id }, {
                    useFindAndModify: false,
                    new: true,
                    lean: true,
                  })
                  response.moodle_id = respMoodleInsert.user.id;
                }
                else {
                  await this.delete({ id: _id })
                  return responseUtility.buildResponseFailed('json', null, { error_key: 'moodle_user.insertOrUpdate.failed' })
                }
              }
              else {
                await this.delete({ id: _id })
                return responseUtility.buildResponseFailed('json', null, { error_key: 'moodle_user.insertOrUpdate.failed' })
              }
            }
            else {
              console.log("Moodle: user exists with name: " + JSON.stringify(respMoodleSearch.user.fullname));
            }
          }

          // @INFO: Se envia email de bienvenida
          if (params.sendEmail === true) {
            await this.sendRegisterUserEmail([response.email], {
              mailer: customs['mailer'],
              fullname: `${response.profile.first_name} ${response.profile.last_name}`,
              first_name: response.profile.first_name,
              last_name: response.profile.last_name,
              username: response.username,
              password: params.password,
              notification_source: `user_register_${response._id}`,
              amount_notifications: 1
            })
          }

          return responseUtility.buildResponseSuccess('json', null, {
            additional_parameters: {
              user: {
                ...response
              }
            }
          })
        }
        catch (error) {
          console.log(error);
        }
        //#endregion
      }
    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que permite enviar emails de bienvenida a los usuarios
   * @param emails Emails a los que se va a enviar
   * @param paramsTemplate Parametros para construir el email
   * @returns
   */
  private sendRegisterUserEmail = async (emails: Array<string>, paramsTemplate: any, resend = false) => {

    try {

      const mail = await mailService.sendMail({
        emails,
        mailOptions: {
          subject: i18nUtility.__('mailer.welcome_user.subject'),
          html_template: {
            path_layout: 'icontec',
            path_template: 'user/welcomeUser',
            params: { ...paramsTemplate }
          },
          amount_notifications: (paramsTemplate.amount_notifications) ? paramsTemplate.amount_notifications : null
        },
        notification_source: paramsTemplate.notification_source,
        resend_notification: resend
      })

      return mail

    } catch (e) {
      return responseUtility.buildResponseFailed('json', null)
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

    const pageNumber = filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage = filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let select = '-created_at -updated_at -__v'
    if (filters.select) {
      select = filters.select
    }

    let where = {}

    if (filters.search) {
      const search = filters.search
      where = {
        ...where,
        $or: [
          {
            username: {
              $regex: ".*" + search + ".*",
              $options: "i",
            },
          },
          {
            "profile.first_name": {
              $regex: ".*" + search + ".*",
              $options: "i",
            },
          },
          {
            "profile.last_name": {
              $regex: ".*" + search + ".*",
              $options: "i",
            },
          },
          {
            email: {
              $regex: ".*" + search + ".*",
              $options: "i",
            },
          },
        ],
      }
    }

    if (filters.roles) {
      if (typeof filters.roles === "string") {
        filters.roles = filters.roles.split(",");
      }

      where["roles"] = { $in: filters.roles };
    }

    if (filters.role_names) {
      if (typeof filters.role_names === "string") {
        filters.role_names = filters.role_names.split(",");
      }
      const roles = await Role.find({name: {$in: filters.role_names}}).select('id')
      if (roles) {
        const role_ids = roles.reduce((accum: any, element: any) => {
          accum.push(element._id)
          return accum
        }, [])
        if (role_ids.length > 0) {
          where["roles"] = { $in: role_ids };
        }
      }
    }

    if (filters.company) {
      where['company'] = filters.company
    } else if (filters.without_company && (filters.without_company === true || filters.without_company === 'true')) {
      where['company'] = {$exists: false}
    }

    let registers = []
    try {
      registers = await User.find(where)
        .select(select)
        .populate({ path: 'roles', select: 'id name description' })
        .populate({ path: 'profile.country', select: 'id name iso2 iso3' })
        .skip(paging ? (pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0) : null)
        .limit(paging ? nPerPage : null)
        .lean()

      for await (const register of registers) {
        if (register.profile) {
          register.profile.avatarImageUrl = this.avatarUrl(register)
          register.profile.avatar = register.profile.avatarImageUrl
        }
      }
    } catch (e) { }

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
   * Metodo que permite listar los usuarios con con el permiso is_teacher
   * @param [id] Id del usuario
   * @returns
   */
  public listTeachers = async (filters: IUserQuery = {}) => {
    try {
      // Consultando el ID de Permiso is_teacher
      let roles_ids = [];
      const permission_teacher = await AppModulePermission.findOne({ name: "config:is_teacher" }).select("_id");
      if (permission_teacher) {
        let roles = await Role.find({ app_module_permissions: { $in: permission_teacher._id } }).select("_id");
        if (roles && roles.length > 0) {
          roles_ids = roles.reduce((accum, element) => {
            accum.push(element._id)
            return accum
          }, [])

          filters.roles = roles_ids;
        }
      }

      if (!filters.roles) {
        filters.roles = []
      }

      return await this.list(filters);
    } catch (e) {
      return responseUtility.buildResponseFailed("json");
    }
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
      user = await User.findOne({ _id: params.user })
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
    timezone = timezone.replace('GMT', '')

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
