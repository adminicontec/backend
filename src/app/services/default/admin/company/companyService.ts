// @import_dependencies_node Import libraries
const ObjectID = require('mongodb').ObjectID
// @end

// @import services
import { uploadService } from '@scnode_core/services/default/global/uploadService'
import { userService } from '@scnode_app/services/default/admin/user/userService';
// @end

// @import config
import { customs } from '@scnode_core/config/globals'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { generalUtility } from '@scnode_core/utilities/generalUtility'
// @end

// @import models
import {Company} from '@scnode_app/models'
// @end

// @import types
import {IQueryFind, QueryValues} from '@scnode_app/types/default/global/queryTypes'
import {
  ICompany,
  ICompanyDelete,
  ICompanyQuery,
  ICompanyUsers
} from '@scnode_app/types/default/admin/company/companyTypes'
// @end

class CompanyService {

  private default_logo_path = 'companies/logos'
  private default_background_path = 'companies/backgrounds'

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

      let select = 'id slug name description logo background'
      if (params.query === QueryValues.ALL) {
        const registers: any = await Company.find(where)
        .select(select)
        .lean()

        for await (const register of registers) {
          if (register.logo) {
            register.logo = this.logoUrl(register)
          }
          if (register.background) {
            register.background = this.backgroundUrl(register)
          }
        }

        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          companies: registers
        }})
      } else if (params.query === QueryValues.ONE) {
        const register: any = await Company.findOne(where)
        .select(select)
        .lean()

        if (!register) return responseUtility.buildResponseFailed('json', null, {error_key: 'company.not_found'})

        if (register && register.logo) {
          register.logo = this.logoUrl(register)
        }
        if (register && register.background) {
          register.background = this.backgroundUrl(register)
        }

        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          company: register
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
  public insertOrUpdate = async (params: ICompany) => {

    try {

      // @INFO: Cargando imagen al servidor
      if (params.logoFile && params.logoFile.name) {
        const defaulPath = this.default_logo_path
        const response_upload: any = await uploadService.uploadFile(params.logoFile, defaulPath)
        if (response_upload.status === 'error') return response_upload
        if (response_upload.hasOwnProperty('name')) params.logo = response_upload.name
      } else if (params.logoFileClear === 'true') {
        params.logo = null
      }

      // @INFO: Cargando imagen al servidor
      if (params.backgroundFile && params.backgroundFile.name) {
        const defaulPath = this.default_background_path
        const response_upload: any = await uploadService.uploadFile(params.backgroundFile, defaulPath)
        if (response_upload.status === 'error') return response_upload
        if (response_upload.hasOwnProperty('name')) params.background = response_upload.name
      } else if (params.backgroundFile === 'true') {
        params.background = null
      }

      if (params.id) {
        const register: any = await Company.findOne({_id: params.id}).lean()
        if (!register) return responseUtility.buildResponseFailed('json', null, {error_key: 'company.not_found'})

        if (params.hasOwnProperty('name')) {
          params['slug'] = generalUtility.generateSlug(params.name)
          const exists = await Company.findOne({ slug: params.slug, _id: { $ne: params.id } }).select('id').lean()
          if (exists) return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'company.insertOrUpdate.already_exists', params: { name: params['name'] }, }, })
        }

        const response: any = await Company.findByIdAndUpdate(params.id, params, {
          useFindAndModify: false,
          new: true,
          lean: true,
        })

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            company: {
              ...response,
              logo: this.logoUrl(response),
              background: this.backgroundUrl(response),
            }
          }
        })

      } else {

        // @INFO: Generando slug unico
        params['slug'] = generalUtility.generateSlug(params.name)

        // @INFO: Validando Slug unico
        const exists = await Company.findOne({ slug: params.slug }).select('id').lean()

        if (exists) return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'company.insertOrUpdate.already_exists', params: { name: params['name'] }, }, })

        const {_id} = await Company.create(params)
        const response: any = await Company.findOne({_id})
        .lean()

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            company: {
              ...response,
              logo: this.logoUrl(response),
              background: this.backgroundUrl(response),
            }
          }
        })
      }

    } catch (e) {
      console.log('e', e)
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que convierte el valor del logo de una compañia a la URL donde se aloja el recurso
   * @param {config} Objeto con data de la Compañia
   */
  public logoUrl = ({ logo }) => {
    return logo && logo !== ''
    ? `${customs['uploads']}/${this.default_logo_path}/${logo}`
    : `${customs['uploads']}/${this.default_logo_path}/default.jpg`
  }

  /**
   * Metodo que convierte el valor del background de una compañia a la URL donde se aloja el recurso
   * @param {config} Objeto con data de la Compañia
   */
   public backgroundUrl = ({ background }) => {
    return background && background !== ''
    ? `${customs['uploads']}/${this.default_background_path}/${background}`
    : `${customs['uploads']}/${this.default_background_path}/default.jpg`
  }

  /**
   * Metodo que permite hacer borrar un registro
   * @param params Filtros para eliminar
   * @returns
   */
  public delete = async (params: ICompanyDelete) => {
    try {
      const find: any = await Company.findOne({ _id: params.id })
      if (!find) return responseUtility.buildResponseFailed('json', null, { error_key: 'company.not_found' })

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
  public list = async (filters: ICompanyQuery = {}) => {

    const paging = (filters.pageNumber && filters.nPerPage) ? true : false

    const pageNumber= filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage= filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let select = 'id slug name description logo background'
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
      registers =  await Company.find(where)
      .select(select)
      .skip(paging ? (pageNumber > 0 ? ( ( pageNumber - 1 ) * nPerPage ) : 0) : null)
      .limit(paging ? nPerPage : null)
      //.sort({created_at: -1})
      .sort({ name: 1 })
      .lean()

      for await (const register of registers) {
        if (register.logo) {
          register.logo = this.logoUrl(register)
        }
        if (register.background) {
          register.background = this.backgroundUrl(register)
        }
      }
    } catch (e) {}

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        companies: [
          ...registers
        ],
        total_register: (paging) ? await Company.find(where).count() : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    })
  }

  /**
   * Metodo que permite listar los usuarios de una compañia
   * @param
   * @returns
   */
  public companyUsers = async (params: ICompanyUsers) => {

    const companyUsersResponse: any = await userService.list({
      role_names: 'company_collaborator',
      company: params.company,
      pageNumber: params.pageNumber,
      nPerPage: params.nPerPage
    })

    let response = {
      company_users: companyUsersResponse
    }

    if (params.searchUsersAvailable) {
      const usersAvalaibleResponse: any = await userService.list({
        role_names: 'company_collaborator',
        without_company: true,
        // sort: 'first_name'
      })
      response['users_available'] = usersAvalaibleResponse
    }


    return responseUtility.buildResponseSuccess('json', null, {additional_parameters: response})
  }
}

export const companyService = new CompanyService();
export { CompanyService as DefaultAdminCompanyCompanyService };
