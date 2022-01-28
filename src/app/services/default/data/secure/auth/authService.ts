// @import_dependencies_node Import libraries
import bcrypt from 'bcrypt-nodejs'
// @end

// @import services
import {userService} from '@scnode_app/services/default/admin/user/userService'
import {mailService} from '@scnode_app/services/default/general/mail/mailService'
import { companyService } from '@scnode_app/services/default/admin/company/companyService';
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { mapUtility } from '@scnode_core/utilities/mapUtility';
import { jwtUtility } from '@scnode_core/utilities/jwtUtility'
import { generalUtility } from '@scnode_core/utilities/generalUtility'
import { i18nUtility } from '@scnode_core/utilities/i18nUtility'
// @end

// @import models
import {AppModule, Role, User, LoginToken, AcademicResourceCategory, QuestionCategory, AcademicResourceConfigCategory, AttachedCategory} from '@scnode_app/models'
// @end

// @import types
import {LoginFields, UserFields, IGenerateTokenFromDestination, ILoginTokenData, IValidateTokenGenerated, IChangeRecoveredPassword} from '@scnode_app/types/default/data/secure/auth/authTypes'
// @end


class AuthService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Query que consulta un usuario para login
   * @param query Objeto con la Query para consultar a base de datos
   * @returns
   */
   private findUserToLoginQuery = async (query) => {

    const user_exist = await User.findOne(query).select(
      'username email passwordHash profile.first_name profile.last_name profile.avatarImageUrl profile.culture profile.screen_mode roles moodle_id company'
    )
    .populate({
      path: 'roles',
      select: 'id name description homes',
      populate: {
        path: 'homes', select: 'id name description'
      }
    })
    .populate({path: 'company', select: 'id name description logo background'})
    if (!user_exist) return responseUtility.buildResponseFailed('json', null, {error_key: { key: 'auth.user_not_found' },})

    return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
      userData: user_exist
    }})
  }

  /**
	 * Metodo que permite loguear a un usuario dentro del sistema
	 * @param req Objeto de clase Express
	 * @param loginFields Estructura de tipo LoginFields con los datos necesarios para loguearse
	 * @returns
	 */
	public login = async (req, loginFields: LoginFields) => {
		const user_response: any = await this.validateLogin(loginFields)
		if (user_response.status === 'error') return user_response

    const response = await this.getUserData(req, user_response.user, {username: loginFields.username, password: loginFields.password})

		return response
  }

  /**
	 * Metodo que permite validar el Login de un usuario
	 * @param {} Estructura de tipo LoginFields con los datos necesarios para loguearse
	 */
	private validateLogin = async ({ username, password }: LoginFields) => {
		try {

      const userDataResponse: any = await this.findUserToLoginQuery({
        username: username
      })
      if (userDataResponse.status === 'error') return userDataResponse

      const user_exist = userDataResponse.userData

			const compare = await new Promise((resolve, reject) => {
				bcrypt.compare(password, user_exist.passwordHash, (err, check) => {
					resolve(check)
				})
      })

			if (!compare) return responseUtility.buildResponseFailed('json', null, {error_key: 'auth.password_invalid'})

      // @INFO: Actualizando la fecha de inicio de sesión del usuario
      user_exist.last_login = new Date()
      user_exist.save()


			return responseUtility.buildResponseSuccess('json', null, {
				additional_parameters: { user: user_exist },
			})
		} catch (e) {
			return responseUtility.buildResponseFailed('json')
		}
	}

	/**
	 * Metodo que permite obtener la información de usuario
	 * @param req
	 * @param user Estructura de tipo UserFields con los datos necesarios para loguearse
	 */
	private getUserData = async (req, user: UserFields, tokenCustom?: any) => {

    // @INFO: Consultando los permisos del usuario
    let modules_permissions = await this.getAppPermissions(user)

		// @INFO: Generando JWT
    let tokenData = {
      locale: user.profile.culture,
      i18n_configuration: [],
		}
    if (tokenCustom) {
      tokenData = {
        ...tokenData,
        ...tokenCustom
      }
    }

		const jwttoken = jwtUtility.createToken(user._id, jwtUtility.getJwtSecret(req), tokenData)

    // @INFO: Consultando categorias de recursos academicos
    const academicResourceCategories = await AcademicResourceCategory.find().select('id name description config')

    // @INFO: Consultando categorias de recursos academicos
    const academicResourceConfigCategories = await AcademicResourceConfigCategory.find().select('id name description config')

    // @INFO: Consultando categorias de preguntas
    const questionCategories = await QuestionCategory.find().select('id name description config')

    // @INFO: Consultando categorias de preguntas
    const attachedCategories = await AttachedCategory.find().select('id name description config')

    // @INFO: Consultando los homes segun el tipo de usuario
    let home = null
    if (user.roles) {
      await mapUtility.mapAsync(
        user.roles.map(async (r) => {
          if (r.homes && !home) {
            await mapUtility.mapAsync(
              r.homes.map((h) => {
                home = h
              })
            )
          }
        })
      )
    }

    let company: any = user?.company
    if (company?.logo) company.logo = companyService.logoUrl(company)
    if (company?.background) company.background = companyService.backgroundUrl(company)

		return responseUtility.buildResponseSuccess('json', null, {
			additional_parameters: {
				user: {
					id: user._id,
					username: user.username,
					profile: user.profile,
					permissions: modules_permissions,
          avatar: userService.avatarUrl(user),
					screen_mode: user.profile.screen_mode,
          home,
          moodle: {
            ...tokenCustom,
            moodle_id: user.moodle_id
          },
          company: company
				},
        academicResourceCategories: academicResourceCategories,
        academicResourceConfigCategories: academicResourceConfigCategories,
        questionCategories: questionCategories,
        attachedCategories,
				locale: (user.profile && user.profile.culture) ? user.profile.culture : null,
				token: jwttoken,
			},
		})
  }

  /**
	 * Metodo que retorna los permisos de un usuario
	 * @param user Objeto de clase User
	 * @returns
	 */
	private getAppPermissions = async (user) => {
    const modules_permissions = {}

		if (user.roles) {
			const roles = await Role.find({ _id: { $in: user.roles } })
      .select('app_module_permissions')
      .populate('app_module_permissions')

			const permissions_ids = []
			const permissions_data = {}
			await mapUtility.mapAsync(
				roles.map((role: any) => {
					role.app_module_permissions.map((amp: any) => {
						permissions_ids.push(amp._id)
						permissions_data[amp._id] = { _id: amp._id, name: amp.name }
					})
				})
			)
			const app_modules = await AppModule.find({
				app_module_permissions: { $in: permissions_ids },
			}).select('name app_module_permissions')

			for (let i in permissions_data) {
				app_modules.filter((app_module: any) => {
					if (app_module.app_module_permissions.includes(permissions_data[i]._id)) {
						permissions_data[i].module_name = app_module.name
					}
				})
			}

			for (let k in permissions_data) {
				if (!modules_permissions.hasOwnProperty(permissions_data[k].module_name)) {
					modules_permissions[permissions_data[k].module_name] = []
				}
				modules_permissions[permissions_data[k].module_name].push(permissions_data[k].name)
			}
		}
		return modules_permissions
	}

  /**
   * Metodo que permite generar token de autentificacion hacia un destino
   * @param params Información necesaria para la autentificacion
   * @returns
   */
  public generateTokenFromDestination = async (params: IGenerateTokenFromDestination) => {

    let user = null
    let userQuery = {}
    let item = null

    if (!params.destination) return responseUtility.buildResponseFailed('json', null, {error_key: 'secure.tokenFromDestination.destination_required'})
    if (!["email", "sms"].includes(params.destination)) return responseUtility.buildResponseFailed('json', null, {error_key: 'secure.tokenFromDestination.destination_invalid'})

    // @INFO: Validar usuario
    if (params.destination === 'email') {
      if (!params.email) return responseUtility.buildResponseFailed('json', null, {error_key: 'secure.tokenFromDestination.email_required'})

      userQuery['email'] = params.email
      item = params.email
    } else if (params.destination === 'sms') {
      if (!params.cell_phone) return responseUtility.buildResponseFailed('json', null, {error_key: 'secure.tokenFromDestination.cell_phone_required'})

      userQuery['phoneNumber'] = params.cell_phone
      item = params.cell_phone
    }

    const validateUser = await User.findOne(userQuery)
    .populate({ path: 'profile.country', select: 'code_call' })
    if (!validateUser) return responseUtility.buildResponseFailed('json', null, { error_key: {key: 'secure.tokenFromDestination.user_not_found', params: {item: item}} })

    user = validateUser

    const tokenGeneratedResponse = await this.buildLoginToken(
      user,
      {
        token_type: 'destination',
      },
      null,
      params.destination === 'sms' ? 4 : 6
    )

    // @INFO: Envianto token de autenticación por email
    if (params.destination === 'email') {
      const mailResponse = await mailService.sendMail({
        emails: [user.email],
        mailOptions: {
          subject: i18nUtility.i18nMessage(params.subject),
          html_template: {
            path_template: 'secure/authenticationEmail',
            // path_layout: '',
            params: {
              token: tokenGeneratedResponse.token,
            }
          }
        },
        notification_source: 'authentication_service'
      })

      if (mailResponse.status === 'error') return mailResponse
    }

    //   if (params.destination === 'sms') {

    //       const config: SmsOptions = {
    //           driver: "labsmobile", // Metodo de envió del email.
    //           number: params.cell_phone, // Número telefónico del destinatario
    //           country_code, // Código del país del destinatario (Ex. 57, 51)
    //           message: `Hemos generado el siguiente token de autenticación: ${tokenGenerated.token_generated} para validar tu identidad, tiene un tiempo de expiración de 15 minutos `, // Mensaje de texto que se va a enviar
    //       }

    //       const response_sms = await smsUtility.sendSms(config)
    //       if (response_sms.status === 'error') return response_sms
    //   }

    return responseUtility.buildResponseSuccess('json')
  }

  /**
   * Metodo que permite generar el cambio de contraseña
   * @param req
   * @param params
   * @returns
   */
  public changeRecoveredPassword = async (req, params: IChangeRecoveredPassword) => {

    // @INFO: Validar token
    const tokenResponse: any = await this.validateTokenGenerated({ token: params.token }, false)
    if (tokenResponse.status === 'error') return tokenResponse

    //@INFO: Modificando contraseña del usuario
    const responseUser = await userService.insertOrUpdate({
        id: tokenResponse.user._id,
        password: params.password,
    })
    if (responseUser.status === 'error') return responseUser

    //@INFO: Obteniendo data del usuario
    const response = await this.getUserData(req, tokenResponse.user)

    return response
  }

  /**
	 * Metodo que permite validar si un token generado es valido
	 * @param data Información para el inicio de sesión
	 * @returns
	 */
  private validateTokenGenerated = async (data: IValidateTokenGenerated, preserveToken?: boolean) => {

    try {
      const token = await LoginToken.findOne({ token: data.token })
      if (!token) return responseUtility.buildResponseFailed('json', null, {error_key: 'secure.tokenFromDestination.not_found',})

      const date = new Date()
      if (token.expedition_date < date) return responseUtility.buildResponseFailed('json', null, {error_key: 'secure.tokenFromDestination.token_expired'})

      if (!preserveToken) {
        token.delete()
      }

      const userDataResponse: any = await this.findUserToLoginQuery({ _id: token.user_id })
      if (userDataResponse.status === 'error') return userDataResponse

      const user = userDataResponse.userData

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          user: user,
          token_generated: token
        }
      })

    } catch (e) {
      return responseUtility.buildResponseFailed('json', null)
    }
  }

  /**
	 * Metodo que permite construir el token segun la configuración
	 * @param user Usuario al cual se esta generando el token
	 * @param alliance_id Identificador de la alianza
	 * @param [options] Opciones del token
	 * @param [duration]
	 * @returns
	 */
   private buildLoginToken = async (user, options: ILoginTokenData = null, duration: number = 15, token_length: number = 32) => {

    let durationDefault = (duration) ? duration : 15

    const string_generated = generalUtility.buildRandomChain({
      characters: token_length,
      numbers: 1,
      symbols: 0,
      uppercase: 0,
      lowercase: token_length === 32 ? 1 : 0
    })

    const date = new Date()
    date.setMinutes(date.getMinutes() + durationDefault)

    let tokenData = {
      token: string_generated,
      expedition_date: date,
      token_type: 'external'
    }

    if (options) {
      tokenData = {
        ...tokenData,
        ...options
      }
    }

    const response = await LoginToken.findOneAndUpdate(
      { user_id: user._id, token_type: tokenData.token_type },
      tokenData,
      { upsert: true, new: true, useFindAndModify: false }
    )

    return response
}

}

export const authService = new AuthService();
export { AuthService as DefaultDataSecureAuthAuthService };
