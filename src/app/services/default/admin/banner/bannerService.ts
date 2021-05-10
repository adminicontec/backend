// @import_dependencies_node Import libraries
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
import {Banner} from '@scnode_app/models'
// @end

// @import types
import {IQueryFind, QueryValues} from '@scnode_app/types/default/global/queryTypes'
import {IBanner, IBannerDelete, IBannerQuery} from '@scnode_app/types/default/admin/banner/bannerTypes'
// @end

class BannerService {

  private default_cover_path = 'banners'

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

      let select = 'id title content coverUrl isActive'
      if (params.query === QueryValues.ALL) {
        const registers: any = await Banner.find(where)
        .select(select)
        .lean()

        for await (const register of registers) {
          if (register.coverUrl) {
            register.coverUrl = this.coverUrl(register)
          }
        }

        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          banners: registers
        }})
      } else if (params.query === QueryValues.ONE) {
        const register: any = await Banner.findOne(where)
        .select(select)
        .lean()

        if (register.coverUrl) {
          register.coverUrl = this.coverUrl(register)
        }

        if (!register) return responseUtility.buildResponseFailed('json', null, {error_key: 'banner.not_found'})
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          banner: register
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
  public insertOrUpdate = async (params: IBanner) => {

    try {

      // @INFO: Cargando imagen al servidor

      if (params.coverFile) {
        const defaulPath = this.default_cover_path
        const response_upload: any = await uploadService.uploadFile(params.coverFile, defaulPath)
        if (response_upload.status === 'error') return response_upload
        if (response_upload.hasOwnProperty('name')) params.coverUrl = response_upload.name
      }

      // if (params.content && typeof params.content === 'string') {
      //   params.content = JSON.parse(params.content)
      // }

      if (params.id) {
        const register: any = await Banner.findOne({_id: params.id}).lean()
        if (!register) return responseUtility.buildResponseFailed('json', null, {error_key: 'banner.not_found'})

        const response: any = await Banner.findByIdAndUpdate(params.id, params, {
          useFindAndModify: false,
          new: true,
          lean: true,
        })

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            banner: {
              ...response,
              coverUrl: this.coverUrl(response),
            }
          }
        })

      } else {
        const {_id} = await Banner.create(params)
        const response: any = await Banner.findOne({_id})
        .lean()

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            banner: {
              ...response,
              coverUrl: this.coverUrl(response),
            }
          }
        })
      }

    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que convierte el valor del cover de un banner a la URL donde se aloja el recurso
   * @param {config} Objeto con data del Banner
   */
  public coverUrl = ({ coverUrl }) => {
    return coverUrl && coverUrl !== ''
    ? `${customs['uploads']}/${this.default_cover_path}/${coverUrl}`
    : `${customs['uploads']}/${this.default_cover_path}/default.jpg`
  }

  /**
   * Metodo que permite borrar un registro
   * @param params Filtros para eliminar
   * @returns
   */
  public delete = async (params: IBannerDelete) => {
    try {
      const find: any = await Banner.findOne({ _id: params.id })
      if (!find) return responseUtility.buildResponseFailed('json', null, { error_key: 'banner.not_found' })

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
  public list = async (filters: IBannerQuery = {}) => {

    const paging = (filters.pageNumber && filters.nPerPage) ? true : false

    const pageNumber= filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage= filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let select = 'id title content coverUrl isActive'
    if (filters.select) {
      select = filters.select
    }

    let where = {}

    if(filters.search){
      const search = filters.search
      where = {
        ...where,
        $or:[
          {title: { $regex: '.*' + search + '.*',$options: 'i' }},
          {content: { $regex: '.*' + search + '.*',$options: 'i' }},
        ]
      }
    }

    if (typeof filters.isActive === 'undefined' || filters.isActive === true) {
      where['isActive'] = true
    }

    let registers = []
    try {
      registers =  await Banner.find(where)
      .select(select)
      .skip(paging ? (pageNumber > 0 ? ( ( pageNumber - 1 ) * nPerPage ) : 0) : null)
      .limit(paging ? nPerPage : null)
      .sort({created_at: -1})
      .lean()

      for await (const register of registers) {
        if (register.coverUrl) {
          register.coverUrl = this.coverUrl(register)
        }
      }
    } catch (e) {}

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        banners: [
          ...registers
        ],
        total_register: (paging) ? await Banner.find(where).count() : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    })
  }

}

export const bannerService = new BannerService();
export { BannerService as DefaultAdminBannerBannerService };
