// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import {AcademicResourceCategory} from '@scnode_app/models'
// @end

// @import types
import {IQueryFind, QueryValues} from '@scnode_app/types/default/global/queryTypes'
import {
  IAcademicResourceCategory,
  IAcademicResourceCategoryDelete,
  IAcademicResourceCategoryQuery,
} from '@scnode_app/types/default/admin/academicContent/academicResource/academicResourceCategoryTypes'
// @end

class AcademicResourceCategoryService {

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
        const registers = await AcademicResourceCategory.find(where).select(select)
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          categories: registers
        }})
      } else if (params.query === QueryValues.ONE) {
        const register = await AcademicResourceCategory.findOne(where).select(select)
        if (!register) return responseUtility.buildResponseFailed('json', null, {error_key: 'academicResourceCategory.not_found'})
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
	public insertOrUpdate = async (params: IAcademicResourceCategory) => {

    try {

      if (params.id) {

        const category = await AcademicResourceCategory.findOne({_id: params.id})
        if (!category) return responseUtility.buildResponseFailed('json', null, {error_key: 'academicResourceCategory.not_found'})

        // @INFO: Validando nombre unico
        if (params.name) {
          const exist = await AcademicResourceCategory.findOne({ name: params.name, _id: {$ne: params.id}})
          if (exist) return responseUtility.buildResponseFailed('json', null, { error_key: {key: 'academicResourceCategory.insertOrUpdate.already_exists', params: {name: params.name}} })
        }

        let response = await AcademicResourceCategory.findByIdAndUpdate(params.id, params, { useFindAndModify: false, new: true })

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
        const exist = await AcademicResourceCategory.findOne({ name: params.name })
        if (exist) return responseUtility.buildResponseFailed('json', null, { error_key: {key: 'academicResourceCategory.insertOrUpdate.already_exists', params: {name: params.name}} })

        const response = await AcademicResourceCategory.create(params)

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
      return responseUtility.buildResponseFailed('json', null, { error_key: 'academicResourceCategory.insertOrUpdate.fail_action' })
    }
	}

	/**
	 * Metodo que permite hacer borrar un registro
	 * @param params Filtros para eliminar
	 * @returns
	 */
	public delete = async (params: IAcademicResourceCategoryDelete) => {
		try {
			const find = await AcademicResourceCategory.findOne({ _id: params.id })
			if (!find) return responseUtility.buildResponseFailed('json', null, { error_key: 'academicResourceCategory.not_found' })

      await find.delete()

			return responseUtility.buildResponseSuccess('json')
		} catch (error) {
			return responseUtility.buildResponseFailed('json')
		}
	}

	/**
	 * Metodo que permite listar todos los resgistros
	 * @param [filters] Estructura de filtros para la consulta
	 * @returns
	 */
	public list = async (filters: IAcademicResourceCategoryQuery = {}) => {

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
      registers =  await AcademicResourceCategory.find(where)
      .select(select)
      .skip(paging ? (pageNumber > 0 ? ( ( pageNumber - 1 ) * nPerPage ) : 0) : null)
      .limit(paging ? nPerPage : null)
    } catch (e) {}

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        categories: [
          ...registers
        ],
        total_register: (paging) ? await AcademicResourceCategory.find(where).countDocuments() : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    })
	}
}

export const academicResourceCategoryService = new AcademicResourceCategoryService();
export { AcademicResourceCategoryService as DefaultAdminAcademicContentAcademicResourceAcademicResourceCategoryService };
