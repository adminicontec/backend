// @import_services Import Services
import { DefaultPluginsSeederSeederService } from "@scnode_core/services/default/plugins/seeder/seederService";
// @end

// @import_models Import models
// @end

// @import services
import {appModulePermissionService} from '@scnode_app/services/default/admin/secure/appModule/appModulePermissionService'
import {appModuleService} from '@scnode_app/services/default/admin/secure/appModule/appModuleService'
import {roleService} from '@scnode_app/services/default/admin/secure/roleService'
import {userService} from '@scnode_app/services/default/admin/user/userService'
import {countryService} from '@scnode_app/services/default/admin/country/countryService'

import {postTypeService} from '@scnode_app/services/default/admin/post/postTypeService'
import {postLocationService} from '@scnode_app/services/default/admin/post/postLocationService'
// @end

// @import_utilitites Import utilities
// @end

// @import_types Import types
import {QueryValues} from '@scnode_app/types/default/global/queryTypes'
// @end

class InitSeeder extends DefaultPluginsSeederSeederService {

  /**
   * Metodo que contiene la logica del seeder
   * @return Booleano que identifica si se pudo o no ejecutar el Seeder
   */
  public run = async () => {
    // @seeder_logic Add seeder logic

    // @INFO: Agregando ciudades
    let country_ids = await this.addCountries()

    // @INFO: Agregando modulos y permisos
    let {module_ids, module_permission_ids} = await this.addAppModulesAndPermissions()

    // @INFO: Agregando roles
    let role_ids = await this.addRoles(module_permission_ids)

    // @INFO: Agregando usuarios
    let user_ids = await this.addUsers(role_ids)

    // @INFO: Agregando tipos de publicaciones
    let post_type_ids = await this.addPostTypes()

    // @INFO: Agregando tipos de ubicaciones
    let post_location_ids = await this.addPostLocations()

    // TODO: Agregar PostCategories


    return false; // Always return true | false
  }

  // @add_more_methods

  /**
   * Metodo que permite agregar ciudades
   * @returns
   */
  private addCountries = async () => {
    let country_ids = {}
    const countries = [
      {name: 'Colombia', iso2: 'CO'}
    ]

    for await (const country of countries) {
      const exists: any = await countryService.findBy({
        query: QueryValues.ONE,
        where: [{field: 'name', value: country.name}]
      })
      if (exists.status === 'success') country['id'] = exists.country._id

      const response: any = await countryService.insertOrUpdate(country)
      if (response.status === 'success') {
        country_ids[country.name] = response.country._id
      }
    }
    return country_ids
  }

  /**
   * Metodo que permite agregar modulos y permisos
   * @returns
   */
  private addAppModulesAndPermissions = async () => {

    let module_ids = {}
    let module_permission_ids = {}

    const modules = [
      {name: 'module:posts', description: 'Módulo que permite administrar las publicaciones', permissions: [
        {name: 'permission:posts_create', description: 'Crear publicaciones'},
        {name: 'permission:posts_update', description: 'Editar publicaciones'},
        {name: 'permission:posts_delete', description: 'Eliminar publicaciones'},
        {name: 'permission:posts_list', description: 'Ver publicaciones'},
      ]},
      {name: 'module:users', description: 'Módulo que permite administrar los usuarios', permissions: [
        {name: 'permission:users_create', description: 'Crear usuarios'},
        {name: 'permission:users_update', description: 'Editar usuarios'},
        {name: 'permission:users_delete', description: 'Eliminar usuarios'},
        {name: 'permission:users_list', description: 'Ver usuarios'},
      ]},
      {name: 'module:roles', description: 'Módulo que permite administrar los roles', permissions: [
        {name: 'permission:roles_create', description: 'Crear roles'},
        {name: 'permission:roles_update', description: 'Editar roles'},
        {name: 'permission:roles_delete', description: 'Eliminar roles'},
        {name: 'permission:roles_list', description: 'Ver roles'},
      ]},
      {name: 'module:modules', description: 'Módulo que permite administrar los modulos', permissions: [
        {name: 'permission:modules_create', description: 'Crear modulos'},
        {name: 'permission:modules_update', description: 'Editar modulos'},
        {name: 'permission:modules_delete', description: 'Eliminar modulos'},
        {name: 'permission:modules_list', description: 'Ver modulos'},
      ]},
      {name: 'module:countries', description: 'Módulo que permite administrar las ciudades', permissions: [
        {name: 'permission:countries_create', description: 'Crear ciudades'},
        {name: 'permission:countries_update', description: 'Editar ciudades'},
        {name: 'permission:countries_delete', description: 'Eliminar ciudades'},
        {name: 'permission:countries_list', description: 'Ver ciudades'},
      ]},
    ]

    for await (const m of modules) {
      let permissions = []

      for await (const p of m.permissions) {
        const exists: any = await appModulePermissionService.findBy({
          query: QueryValues.ONE,
          where: [{field: 'name', value: p.name}]
        })
        if (exists.status === 'success') p['id'] = exists.appModulePermission._id

        const response: any = await appModulePermissionService.insertOrUpdate(p)
        if (response.status === 'success') {
          permissions.push(response.appModulePermission._id)
          module_permission_ids[p.name] = response.appModulePermission._id
        }
      }

      m['app_module_permissions'] = permissions;

      const exists: any = await appModuleService.findBy({
        query: QueryValues.ONE,
        where: [{field: 'name', value: m.name}]
      })
      if (exists.status === 'success') m['id'] = exists.appModule._id

      const module:any = await appModuleService.insertOrUpdate(m)
      if (module.status === 'success') {
        module_ids[m.name] = module.appModule._id
      }
    }

    return {
      module_ids,
      module_permission_ids
    }
  }

  /**
   * Metodo quer permite agregar roles
   * @param module_permission_ids
   * @returns
   */
  private addRoles = async (module_permission_ids) => {

    let roles_ids = {}
    const roles = [
      {
        name: 'admin',
        description: 'Administrador del sistema',
        app_module_permissions: [
          module_permission_ids['permission:posts_create'],
          module_permission_ids['permission:posts_update'],
          module_permission_ids['permission:posts_delete'],
          module_permission_ids['permission:posts_list'],
          module_permission_ids['permission:users_create'],
          module_permission_ids['permission:users_update'],
          module_permission_ids['permission:users_delete'],
          module_permission_ids['permission:users_list'],
          module_permission_ids['permission:roles_create'],
          module_permission_ids['permission:roles_update'],
          module_permission_ids['permission:roles_delete'],
          module_permission_ids['permission:roles_list'],
          module_permission_ids['permission:modules_create'],
          module_permission_ids['permission:modules_update'],
          module_permission_ids['permission:modules_delete'],
          module_permission_ids['permission:modules_list'],
          module_permission_ids['permission:countries_create'],
          module_permission_ids['permission:countries_update'],
          module_permission_ids['permission:countries_delete'],
          module_permission_ids['permission:countries_list'],
        ]
      }
    ]

    for await (const role of roles) {
      const exists: any = await roleService.findBy({
        query: QueryValues.ONE,
        where: [{field: 'name', value: role.name}]
      })
      if (exists.status === 'success') {
        role['id'] = exists.role._id
        roles_ids[`${role['name']}`] = exists.role._id
      }

      const role_response:any = await roleService.insertOrUpdate(role)
      if (role_response.status === 'success') {
        const roleRegister = role_response.role
        roles_ids[`${role['name']}`] = roleRegister._id
      }
    }
    return roles_ids
  }

  /**
   * Metodo que permite agregar usuarios
   * @param role_ids
   * @returns
   */
  private addUsers = async (role_ids) => {

    let user_ids = {}
    const users = [
      {
        userName: 'useradmin',
        password: '123456',
        email: 'useradmin@example.com',
        profile: {
          name: 'User',
          lastName: 'Admin'
        },
        roles: [
          role_ids['admin']
        ]
      }
    ]
    for await (const user of users) {
      const exists: any = await userService.findBy({
        query: QueryValues.ONE,
        where: [{field: 'userName', value: user.userName}]
      })
      if (exists.status === 'success') user['id'] = exists.user._id

      const user_response:any = await userService.insertOrUpdate(user)
      if (user_response.status === 'success') {
        user_ids[user.userName] = user_response.user._id
      }
    }
    return user_ids
  }

  /**
   * Metodo que permite agregar tipos de publicaciones
   * @returns
   */
  private addPostTypes = async () => {

    let post_type_ids = {}
    const post_types = [
      {name: 'news'},{name: 'events'}
    ]
    for await (const postType of post_types) {
      const exists: any = await postTypeService.findBy({
        query: QueryValues.ONE,
        where: [{field: 'name', value: postType.name}]
      })
      if (exists.status === 'success') postType['id'] = exists.postType._id

      const response:any = await postTypeService.insertOrUpdate(postType)
      if (response.status === 'success') {
        post_type_ids[postType.name] = response.postType._id
      }
    }
    return post_type_ids
  }

  /**
   * Metodo que permite agregar tipos de publicaciones
   * @returns
   */
  private addPostLocations = async () => {

    let post_location_ids = {}
    const post_locations = [
      {name: 'student'},{name: 'teacher'},{name: 'guest'},
    ]
    for await (const postLocation of post_locations) {
      const exists: any = await postLocationService.findBy({
        query: QueryValues.ONE,
        where: [{field: 'name', value: postLocation.name}]
      })
      if (exists.status === 'success') postLocation['id'] = exists.postLocation._id

      const response:any = await postLocationService.insertOrUpdate(postLocation)
      if (response.status === 'success') {
        post_location_ids[postLocation.name] = response.postLocation._id
      }
    }
    return post_location_ids
  }
  // @end
}

export const initSeeder = new InitSeeder();
export { InitSeeder };
