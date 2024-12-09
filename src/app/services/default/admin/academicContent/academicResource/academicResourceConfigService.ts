// @import_dependencies_node Import libraries
const ObjectID = require('mongodb').ObjectID
// @end

// @import services
import {academicResourceService} from '@scnode_app/services/default/admin/academicContent/academicResource/academicResourceService'
import {academicResourceConfigCategoryService} from '@scnode_app/services/default/admin/academicContent/academicResource/academicResourceConfigCategoryService'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import {AcademicResourceConfig} from '@scnode_app/models'
// @end

// @import types
import {IQueryFind, QueryValues} from '@scnode_app/types/default/global/queryTypes'
import {
  IAcademicResourceConfig,
  IAcademicResourceConfigDelete,
  IAcademicResourceConfigQuery,
} from '@scnode_app/types/default/admin/academicContent/academicResource/academicResourceConfigTypes'
// @end

class AcademicResourceConfigService {

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

      let select = 'id academic_resource source config'
      if (params.query === QueryValues.ALL) {
        const registers = await AcademicResourceConfig.find(where)
        .select(select)
        .populate({
          path: 'academic_resource',
          select: 'title academic_resource_category',
          populate: {
              path: 'academic_resource_category', select: 'id name config'
          }
        })
        .populate({path: 'source.config_category', select: 'name config'})
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          academicResourceConfigs: registers
        }})
      } else if (params.query === QueryValues.ONE) {
        const register = await AcademicResourceConfig.findOne(where)
        .select(select)
        .populate({
          path: 'academic_resource',
          select: 'title academic_resource_category',
          populate: {
              path: 'academic_resource_category', select: 'id name config'
          }
        })
        .populate({path: 'source.config_category', select: 'name config'})
        if (!register) return responseUtility.buildResponseFailed('json', null, {error_key: 'academicResourceConfig.not_found'})
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          academicResourceConfig: register
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
  public insertOrUpdate = async (params: IAcademicResourceConfig) => {
    try {

      let category;
      let academic_resource;

      if (!params.hasOwnProperty('config')) params.config = {}
      if (params.config && params.config.hasOwnProperty('course_modes') && params.config.course_modes === "") {
        delete params.config.course_modes
      }

      if (params.config?.course_modes === 'characterization-survey') {
        params.config.is_characterization_survey = true
      } else if (params.config?.course_modes) {
        params.config.is_characterization_survey = false
        params.config.course_modes = ObjectID(params.config.course_modes)
      }

      // @INFO: Validando el recurso
      if (params.academic_resource) {
        const academic_resource_exists: any = await academicResourceService.findBy({query: QueryValues.ONE, where: [{field: '_id', value: params.academic_resource}]})
        if (academic_resource_exists.status === 'error') return academic_resource_exists

        academic_resource = academic_resource_exists.academicResource
      }

      // @INFO: Validando Categoria
      if (params.source && params.source.config_category) {
        const category_exists: any = await academicResourceConfigCategoryService.findBy({query: QueryValues.ONE, where: [{field: '_id', value: params.source.config_category}]})
        if (category_exists.status === 'error') return category_exists

        category = category_exists.category
      }

      if (!category) return responseUtility.buildResponseFailed('json', null, {error_key: 'academicResourceConfig.category_invalid'})

      if (params.id) {

        const academic_resource_config = await AcademicResourceConfig.findOne({_id: params.id})
        if (!academic_resource_config) return responseUtility.buildResponseFailed('json', null, {error_key: 'academicResourceConfig.not_found'})

        let update = {...params}

        // @INFO: Precargando valores que no vengan en el crud
        if (academic_resource_config.config) {
          params.config = {...academic_resource_config.config, ...params.config}
          update['config'] = params.config
        }

        let response = await AcademicResourceConfig.findByIdAndUpdate(params.id, update, { useFindAndModify: false, new: true })

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            academicResourceConfig: {
              id: response._id,
              academic_resource: response.academic_resource,
              source: response.source,
              config: response.config
            }
          }
        })

      } else {

        const response = await AcademicResourceConfig.create(params)

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            academicResourceConfig: {
              id: response._id,
              academic_resource: response.academic_resource,
              source: response.source,
              config: response.config
            }
          }
        })
      }

    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
	 * Metodo que permite hacer borrar un registro
	 * @param params Filtros para eliminar
	 * @returns
	 */
  public delete = async (params: IAcademicResourceConfigDelete) => {
    try {
			const find = await AcademicResourceConfig.findOne({ _id: params.id })
			if (!find) return responseUtility.buildResponseFailed('json', null, { error_key: 'academicResourceConfig.not_found' })

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
  public list = async (filters: IAcademicResourceConfigQuery = {}) => {
    const paging = (filters.pageNumber && filters.nPerPage) ? true : false
    const pageNumber= filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
		const nPerPage= filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let select = 'id academic_resource source config'

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
      registers =  await AcademicResourceConfig.find(where)
      .select(select)
      .populate({path: 'academic_resource', select: 'title academic_resource_category'})
      .populate({path: 'source.config_category', select: 'name'})
      .skip(paging ? (pageNumber > 0 ? ( ( pageNumber - 1 ) * nPerPage ) : 0) : null)
      .limit(paging ? nPerPage : null)
    } catch (e) {}

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        academic_resource_configs: [
          ...registers
        ],
        total_register: (paging) ? await AcademicResourceConfig.find(where).countDocuments() : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    })
  }
}

export const academicResourceConfigService = new AcademicResourceConfigService();
export { AcademicResourceConfigService as DefaultAdminAcademicContentAcademicResourceAcademicResourceConfigService };
