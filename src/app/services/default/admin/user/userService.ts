// @import_dependencies_node Import libraries
import bcrypt from "bcrypt-nodejs";
import moment from 'moment';
import * as XLSX from "xlsx";
const ObjectID = require('mongodb').ObjectID
// @end

// @import services
import { uploadService } from '@scnode_core/services/default/global/uploadService'
import { moodleUserService } from '@scnode_app/services/default/moodle/user/moodleUserService'
import { IMailMessageData, mailService } from '@scnode_app/services/default/general/mail/mailService';
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
import { IUser, IUserDelete, IUserQuery, IUserDateTimezone, IUserManyDelete } from '@scnode_app/types/default/admin/user/userTypes'
import { IMoodleUser, IMoodleUserQuery } from '@scnode_app/types/default/moodle/user/moodleUserTypes'
import { SendRegisterUserEmailParams } from '@scnode_app/types/default/admin/user/userTypes';
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

    const defaultCountryCode = '6058e1f00520a25777a0eb4d';
    const defaultCountryISO = 'CO';
    //@ts-ignore
    if (params.sendEmail === 'true') params.sendEmail = true
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

        // console.log("Ready to update");
        // console.log(params)
        try {
          const response: any = await User.findByIdAndUpdate(params.id, params, {
            useFindAndModify: false,
            new: true,
            lean: true,
          });

          // console.log("Search results for : " + params.id);
          // console.log(response);


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
            await this.sendRegisterUserEmail({
              emails: [paramsMoodleUser.email],
              paramsTemplate: {
                mailer: customs['mailer'],
                fullname: `${paramsMoodleUser.firstname} ${paramsMoodleUser.lastname}`,
                first_name: paramsMoodleUser.firstname,
                last_name: paramsMoodleUser.lastname,
                username: paramsMoodleUser.username,
                password: paramsMoodleUser.password,
                notification_source: `user_register_${response._id}`,
                amount_notifications: 1,
                sendWelcomEmail
              }
            })
          }

          return responseUtility.buildResponseSuccess('json', null, {
            additional_parameters: {
              user: {
                ...response,
                passwordUpdated: (params.passwordHash) ? true : false
              },
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
        // console.log("* * User.findOne * *");
        const exist = await User.findOne({ username: params.username })

        // console.log("If user Exists --> [" + params.username + "]");
        if (exist) return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'user.insertOrUpdate.already_exists', params: { data: `${params.username}|${params.email}` } } })

        // console.log("If Password --> ");
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
          console.log('params.moodle', params.moodle)
          if (!params.moodle || (params.moodle && params.moodle === 'on')) {
            console.log('entro a guardar en moodle')
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
                    if (respMoodleInsert?.status) return respMoodleInsert;
                    return responseUtility.buildResponseFailed('json', null, { error_key: 'moodle_user.insertOrUpdate.failed' })
                  }
                }
                else {
                  await this.delete({ id: _id })
                  if (respMoodleInsert?.status) return respMoodleInsert;
                  return responseUtility.buildResponseFailed('json', null, { error_key: 'moodle_user.insertOrUpdate.failed' })
                }
              }
              else {
                console.log("Moodle: user exists with name: " + JSON.stringify(respMoodleSearch.user.fullname));
              }
            }
          }

          const isCompanyUser = response?.roles?.find((role) => role.name === 'company_collaborator') ? true : false

          // @INFO: Se envia email de bienvenida
          if (params.sendEmail === true) {
            await this.sendRegisterUserEmail({
                emails: [response.email],
                paramsTemplate: {
                  mailer: customs['mailer'],
                  fullname: `${response.profile.first_name} ${response.profile.last_name}`,
                  first_name: response.profile.first_name,
                  last_name: response.profile.last_name,
                  username: response.username,
                  password: params.password,
                  notification_source: `user_register_${response._id}`,
                  amount_notifications: 1
                },
                isCompanyUser
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
  private sendRegisterUserEmail = async ({emails, paramsTemplate, resend = false, isCompanyUser = false}: SendRegisterUserEmailParams) => {

    try {
      const mailOptions: IMailMessageData = {
        emails,
        mailOptions: {
          subject: i18nUtility.__('mailer.welcome_user.subject'),
          html_template: {
            path_layout: 'icontec',
            path_template: isCompanyUser ? 'user/welcomeContactCompany' : 'user/welcomeUser',
            params: { ...paramsTemplate }
          },
          amount_notifications: (paramsTemplate.amount_notifications) ? paramsTemplate.amount_notifications : null,
        },
        notification_source: paramsTemplate.notification_source,
        resend_notification: resend
      }
      if (isCompanyUser) {
        mailOptions.mailOptions['attachments'] = [
          {
            filename: 'Instructivo Consulta y Descarga de Certificaciones.pptx',
            path: customs['mailer'].company_help_instructive
          }
        ]
      }

      const mail = await mailService.sendMail(mailOptions)

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
   * Metodo que permite hacer borrar un registro
   * @param params Filtros para eliminar
   * @returns
   */
  public deleteMany = async (params: IUserManyDelete) => {
    try {
      const where = {}
      if (params.username) {
        if (Array.isArray(params.username) && params.username.length > 0) {
          where['username'] = {$in: params.username}
        } else if (typeof params.username === 'string') {
          where['username'] = params.username
        }
      }

      if (Object.keys(where).length === 0) return responseUtility.buildResponseFailed('json', null, {error_key: 'user.delete_many.query_required'})

      // @ts-ignore
      const response = await User.delete(where)

      return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
        response
      }})
    } catch (error) {
      console.log('UserService - deleteMany', error)
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
      const roles = await Role.find({ name: { $in: filters.role_names } }).select('id')
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

    if (filters.username) {
      if (typeof filters.username === "string") {
        filters.username = filters.username.split(",");
      }
      where['username'] = {$in: filters.username}
    }

    if (filters.company) {
      where['company'] = filters.company
    } else if (filters.without_company && (filters.without_company === true || filters.without_company === 'true')) {
      where['company'] = { $exists: false }
    }

    let typeOfSort;
    if (filters.sort) {
      if (filters.sort == 'first_name') {
        typeOfSort = { 'profile.first_name': 1 };
      }
      if (filters.sort == 'last_name') {
        typeOfSort = { 'profile.last_name': 1 };
      }
      if (filters.sort == 'username') {
        typeOfSort = { 'username': 1 };
      }
    }

    console.log('SORT:');
    console.log(filters.sort);
    console.log(typeof filters.sort);

    let registers = []
    try {
      registers = await User.find(where)
        .select(select)
        .populate({ path: 'roles', select: 'id name description' })
        .populate({ path: 'profile.country', select: 'id name iso2 iso3' })
        .skip(paging ? (pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0) : null)
        .limit(paging ? nPerPage : null)
        .sort(typeOfSort ? typeOfSort : {})
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

  public createMultiple = async (file_xlsx: any) => {
    try {

      let buffer = Buffer.from(file_xlsx.data);
      const workbook = XLSX.read(buffer, { type: "buffer" });

      const sheet_name_list = workbook.SheetNames;
      // Lee la primer hoja del archivo

      const xlData: any = XLSX.utils.sheet_to_json(
        workbook.Sheets[sheet_name_list[0]]
      );

      let errors = [];
      let total_create = 0;

      for (const key in xlData) {
        let error_create = [];
        let user = null;

        if (!xlData[key].hasOwnProperty('roles')) {
          error_create.push(
            i18nUtility.i18nMessage('app_error_messages.users.createMultiple.no_role'),
          )
        }

        if (xlData[key].hasOwnProperty("username")) {
          user = await User.findOne({ username: xlData[key].username }).select("_id");
          if (user)
            error_create.push(
              i18nUtility.i18nMessage(
                "app_error_messages.users.createMultiple.already_exists",
                { field: 'nombre de usuario', value: xlData[key].username }
              )
            );
        }

        if (xlData[key].hasOwnProperty("doc_number")) {
          user = await User.findOne({ 'profile.doc_number': xlData[key].doc_number }).select("_id");
          if (user)
            error_create.push(
              i18nUtility.i18nMessage(
                "app_error_messages.users.createMultiple.already_exists",
                { field: 'numero de documento', value: xlData[key].doc_number }
              )
            );
        }

        let roles_list = [];
        if (xlData[key].hasOwnProperty("roles")) {
          let roleNames = xlData[key].roles.split(",");
          roleNames = roleNames.map((role) => role.trim());

          let roleList = await Role.find({ name: { $in: roleNames } }).select("id name");

          roleList.map((element) => {
            roles_list.push(element._id)
          }, [])
        }
        // Validar por RegExp el email
        let re = new RegExp('^[a-zA-Z0-9.!#$%&*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$')
        let email = xlData[key].email
        email = await email.trim()
        let emailValid = re.test(email)
        if (!emailValid) {
          error_create.push(
            i18nUtility.i18nMessage(
              "app_error_messages.users.createMultiple.invalid_email", { email })
          )
        }

        if (error_create.length === 0) {
          let user_data_object = {
            username: (xlData[key].username) ? xlData[key].username.toString().trim() : '',
            password: (xlData[key].password) ? xlData[key].password.toString().trim() : '',
            email: (xlData[key].email) ? xlData[key].email.toString().trim() : '',
            moodle: (xlData[key].moodle) ? xlData[key].moodle.toString().trim() : undefined,
            profile: {
              first_name: (xlData[key].first_name) ? xlData[key].first_name.toString().trim() : '',
              last_name: (xlData[key].last_name) ? xlData[key].last_name.toString().trim() : '',
              doc_number: (xlData[key].doc_number) ? xlData[key].doc_number.toString().trim() : '',
              position: (xlData[key].position) ? xlData[key].position.toString().trim() : undefined,
              dependence: (xlData[key].dependence) ? xlData[key].dependence.toString().trim() : undefined,
            },
            roles: xlData[key].roles ? roles_list : []
          }

          const response: any = await this.insertOrUpdate(
            user_data_object
          );
          if (response.status === "error") {
            error_create.push(response.message);
          } else {
            total_create++;
          }
        }
        if (error_create.length > 0)
          errors.push({
            row: parseInt(key) + 2, // Suma 2 porque la primera fila del archivo contiene los encabezados
            error: error_create,
          });
      }

      return responseUtility.buildResponseSuccess("json", null, {
        additional_parameters: {
          errors: errors,
          total_create: total_create,
        },
      });
    } catch (e) {
      return responseUtility.buildResponseFailed("json", null, {
        additional_parameters: {
          "message": e.message
        },
      });
    }
  }


  public syncMoodle = async (params: IUserQuery = {}) => {

    let userMoodle = [];

    try {

      for await (let username of params.username) {
        console.log(`Sync the user moodle Id to current user: ${username}`);

        const respUser: any = await this.findBy({ query: QueryValues.ONE, where: [{ field: 'username', value: username }] });
        if (respUser.status == 'error') {
          return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'user.not_found' } });
        }

        if (respUser.user.moodle_id) {

          userMoodle.push({
            action: 'moodleId exists! no updated is performed.',
            user:  respUser.user
          });
        }
        else {
          // get Moodle ID from Moodle User Endpoint
          console.log('→→→→→→→→→→→→→→→');
          console.log(respUser.user);
          console.log('→→→→→→→→→→→→→→→');

          var paramUserMoodle = { username: username };
          let respMoodleSearch: any = await moodleUserService.findBy(paramUserMoodle);

          // console.log('→→→→→→→→→→→→→→→');
          // console.log(respMoodleSearch);
          // console.log('→→→→→→→→→→→→→→→');

          if (respMoodleSearch.status == "success") {

            if (respMoodleSearch.user) {
              console.log(`Moodle ID: ${respMoodleSearch.user.id}`);

              // update Moodle ID on User (campus)

              let respUpdateUser: any = await this.insertOrUpdate({
                id: respUser.user._id,
                moodle_id: respMoodleSearch.user.id
              });

              console.log(respUpdateUser.user);

              userMoodle.push({
                action: 'update moodleId',
                user: respUpdateUser.user
              });
            }
            else {
              return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'moodle_user.not_found' } });
            }
          }
          else {
            return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'moodle_user.not_found' } });
          }
        }
      }
      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          userMoodle: userMoodle,
        }
      })

    }
    catch (e) {
      return responseUtility.buildResponseFailed("json");
    }

  }

}

export const userService = new UserService();
export { UserService as DefaultAdminUserUserService };
