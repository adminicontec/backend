// @import_dependencies_node Import libraries
import bcrypt from 'bcrypt-nodejs'
// @end

// @import services
import {userService} from '@scnode_app/services/default/admin/user/userService'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { mapUtility } from '@scnode_core/utilities/mapUtility';
import { jwtUtility } from '@scnode_core/utilities/jwtUtility'
// @end

// @import models
import {AppModule, Role, User} from '@scnode_app/models'
// @end

// @import types
import {LoginFields, UserFields} from '@scnode_app/types/default/data/secure/auth/authTypes'
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
	 * Metodo que permite loguear a un usuario dentro del sistema
	 * @param req Objeto de clase Express
	 * @param loginFields Estructura de tipo LoginFields con los datos necesarios para loguearse
	 * @returns
	 */
	public login = async (req, loginFields: LoginFields) => {
		const user_response: any = await this.validateLogin(loginFields)
		if (user_response.status === 'error') return user_response

    const response = await this.getUserData(req, user_response.user)

		return response
  }

  /**
	 * Metodo que permite validar el Login de un usuario
	 * @param {} Estructura de tipo LoginFields con los datos necesarios para loguearse
	 */
	private validateLogin = async ({ username, password }: LoginFields) => {
		try {
			const user_exist: any = await User.findOne({
				username: username
			}).select('username email passwordHash profile.first_name profile.last_name profile.avatarImageUrl profile.culture profile.screen_mode roles')
      .populate({
        path: 'roles',
        select: 'id name description homes',
        populate: {
          path: 'homes', select: 'id name description'
        }
      })

			if (!user_exist) return responseUtility.buildResponseFailed('json', null, {error_key: { key: 'auth.user_not_found' },})

			const compare = await new Promise((resolve, reject) => {
				bcrypt.compare(password, user_exist.passwordHash, (err, check) => {
					resolve(check)
				})
      })

			if (!compare) return responseUtility.buildResponseFailed('json', null, {error_key: 'auth.password_invalid'})

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
	private getUserData = async (req, user: UserFields) => {

    // @INFO: Consultando los permisos del usuario
    let modules_permissions = await this.getAppPermissions(user)

		// @INFO: Generando JWT
		const jwttoken = jwtUtility.createToken(user._id, jwtUtility.getJwtSecret(req), {
      locale: user.profile.culture,
      i18n_configuration: []
		})

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
				},
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

}

export const authService = new AuthService();
export { AuthService as DefaultDataSecureAuthAuthService };
