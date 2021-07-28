// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import {AcademicResourceConfigCategory} from '@scnode_app/models'
// @end

// @import types
import {IQueryFind, QueryValues} from '@scnode_app/types/default/global/queryTypes'
import {
  IAcademicResourceConfigCategory,
  IAcademicResourceConfigCategoryDelete,
  IAcademicResourceConfigCategoryQuery
} from '@scnode_app/types/default/admin/academicContent/academicResource/academicResourceConfigCategoryTypes'
// @end

class AcademicResourceConfigCategoryService {

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

      let select = 'id name description config'
      if (params.query === QueryValues.ALL) {
        const registers = await AcademicResourceConfigCategory.find(where).select(select)
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          categories: registers
        }})
      } else if (params.query === QueryValues.ONE) {
        const register = await AcademicResourceConfigCategory.findOne(where).select(select)
        if (!register) return responseUtility.buildResponseFailed('json', null, {error_key: 'academicResourceConfigCategory.not_found'})
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          category: register
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
	public insertOrUpdate = async (params: IAcademicResourceConfigCategory) => {
    try {

      if (params.id) {

        const category = await AcademicResourceConfigCategory.findOne({_id: params.id})
        if (!category) return responseUtility.buildResponseFailed('json', null, {error_key: 'academicResourceConfigCategory.not_found'})

        // @INFO: Validando nombre unico
        if (params.name) {
          const exist = await AcademicResourceConfigCategory.findOne({ name: params.name, _id: {$ne: params.id}})
          if (exist) return responseUtility.buildResponseFailed('json', null, { error_key: {key: 'academicResourceConfigCategory.insertOrUpdate.already_exists', params: {name: params.name}} })
        }

        let response = await AcademicResourceConfigCategory.findByIdAndUpdate(params.id, params, { useFindAndModify: false, new: true })

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            category: {
              _id: response._id,
              name: response.name,
              description: response.description,
              config: response.config,
            }
          }
        })

      } else {
        const exist = await AcademicResourceConfigCategory.findOne({ name: params.name })
        if (exist) return responseUtility.buildResponseFailed('json', null, { error_key: {key: 'academicResourceConfigCategory.insertOrUpdate.already_exists', params: {name: params.name}} })

        const response = await AcademicResourceConfigCategory.create(params)

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            category: {
              _id: response._id,
              name: response.name,
              description: response.description,
              config: response.config,
            }
          }
        })
      }

    } catch (e) {
      return responseUtility.buildResponseFailed('json', null, { error_key: 'academicResourceConfigCategory.insertOrUpdate.fail_action' })
    }
	}

	/**
	 * Metodo que permite hacer borrar un registro
	 * @param params Filtros para eliminar
	 * @returns
	 */
	public delete = async (params: IAcademicResourceConfigCategoryDelete) => {
		try {
			const find = await AcademicResourceConfigCategory.findOne({ _id: params.id })
			if (!find) return responseUtility.buildResponseFailed('json', null, { error_key: 'academicResourceConfigCategory.not_found' })

      await find.delete()

			return responseUtility.buildResponseSuccess('json', null)
		} catch (error) {
			return responseUtility.buildResponseFailed('json')
		}
	}

	/**
	 * Metodo que permite listar todos los resgistros
	 * @param [filters] Estructura de filtros para la consulta
	 * @returns
	 */
	public list = async (filters: IAcademicResourceConfigCategoryQuery = {}) => {

    const paging = (filters.pageNumber && filters.nPerPage) ? true : false
    const pageNumber= filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
		const nPerPage= filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let select = 'id name description config'
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
      registers =  await AcademicResourceConfigCategory.find(where)
      .select(select)
      .skip(paging ? (pageNumber > 0 ? ( ( pageNumber - 1 ) * nPerPage ) : 0) : null)
      .limit(paging ? nPerPage : null)
    } catch (e) {}

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        categories: [
          ...registers
        ],
        total_register: (paging) ? await AcademicResourceConfigCategory.find(where).countDocuments() : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    })
	}
}

export const academicResourceConfigCategoryService = new AcademicResourceConfigCategoryService();
export { AcademicResourceConfigCategoryService as DefaultAdminAcademicContentAcademicResourceAcademicResourceConfigCategoryService };
