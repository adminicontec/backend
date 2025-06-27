// @import_dependencies_node Import libraries
// @end

// @import services
import {academicResourceConfigService} from '@scnode_app/services/default/admin/academicContent/academicResource/academicResourceConfigService'
import {academicResourceCategoryService} from '@scnode_app/services/default/admin/academicContent/academicResource/academicResourceCategoryService'
import {academicResourceService} from '@scnode_app/services/default/admin/academicContent/academicResource/academicResourceService'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { i18nUtility } from '@scnode_core/utilities/i18nUtility';
// @end

// @import models
import {Survey, AcademicResourceConfig, AcademicResourceConfigCategory, CourseSchedulingMode} from '@scnode_app/models'
// @end

// @import types
import {IQueryFind, QueryValues} from '@scnode_app/types/default/global/queryTypes'
import {
  ISurvey,
  ISurveyGhost,
  ISurveyDelete,
  ISurveyQuery,
  SurveyCourseContentCustoms,
} from '@scnode_app/types/default/admin/academicContent/survey/surveyTypes'
// @end

class SurveyService {

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

      let select = 'id name description config status'
      if (params.query === QueryValues.ALL) {
        const registers = await Survey.find(where)
        .select(select)
        .populate({
          path: 'config.content',
          select: 'id academic_resource',
          populate: {
              path: 'academic_resource',
              select: 'id title description'
          }
        })
        .populate({path: 'config.academic_component', select: 'id name description'})
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          surveys: registers
        }})
      } else if (params.query === QueryValues.ONE) {
        const register = await Survey.findOne(where)
        .select(select)
        .populate({
          path: 'config.content',
          select: 'id academic_resource',
          populate: {
              path: 'academic_resource',
              select: 'id title description'
          }
        })
        .populate({path: 'config.academic_component', select: 'id name description'})
        if (!register) return responseUtility.buildResponseFailed('json', null, {error_key: 'survey.not_found'})
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          survey: register
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
    public insertOrUpdate = async (params: ISurvey) => {
      try {

        let content = null

        if (!params.hasOwnProperty('config')) params.config = {}

        // @INFO: Validando componente academico
        if (params.config && params.config.content) {
          const academic_resource_config_exists: any = await academicResourceConfigService.findBy({query: QueryValues.ONE, where: [{field: '_id', value: params.config.content}]})
          if (academic_resource_config_exists.status === 'error') return academic_resource_config_exists

          content = academic_resource_config_exists.academicResourceConfig
        }

        if (params.id) {

          const survey = await Survey.findOne({_id: params.id})
          if (!survey) return responseUtility.buildResponseFailed('json', null, {error_key: 'survey.not_found'})

          let update = {...params}

          // @INFO: Precargando valores que no vengan en el crud
          if (survey.config) {
            params.config = {...survey.config, ...params.config}
          }

          update['config'] = params.config

          let response = await Survey.findByIdAndUpdate(params.id, update, { useFindAndModify: false, new: true })
          await AcademicResourceConfig.populate(response, {
            path: 'config.content',
            select: 'id academic_resource',
            populate: {
              path: 'academic_resource',
              select: 'id title description'
            }
          })

          return responseUtility.buildResponseSuccess('json', null, {
            additional_parameters: {
              survey: {
                id: response._id,
                name: response.name,
                description: response.description,
                config: response.config,
                status: response.status,
              }
            }
          })

        } else {

          if (!content) return responseUtility.buildResponseFailed('json', null, {error_key: 'survey.insertOrUpdate.content_required'})

          const {id} = await Survey.create(params)
          const response = await Survey.findOne({_id: id})
          .populate({
            path: 'config.content',
            select: 'id academic_resource',
            populate: {
                path: 'academic_resource',
                select: 'id title description'
            }
          })
          .populate({path: 'config.academic_component', select: 'id name description'})

          return responseUtility.buildResponseSuccess('json', null, {
            additional_parameters: {
              survey: {
                id: response._id,
                name: response.name,
                description: response.description,
                config: response.config,
                status: response.status,
              }
            }
          })
        }
      } catch (e) {
        return responseUtility.buildResponseFailed('json')
      }
    }

    /**
     * Metodo que permite generar un simulacro fantasma
     * @param params Elementos a registrar
     * @returns
     */
    public createGhostSurvey = async (params: ISurveyGhost) => {

      try {
        let academicResource = null
        let academicResourceConfig = null
        let survey = null

        // @INFO: Validando categoria de recursos
        const academic_resource_category_exists: any = await academicResourceCategoryService.findBy({query: QueryValues.ONE, where: [{field: '_id', value: params.academic_resource_category}]})
        if (academic_resource_category_exists.status === 'error') return academic_resource_category_exists

        // @INFO: Consultando categoria de configuración
        const academic_resource_config_category = await AcademicResourceConfigCategory.findOne({name: "survey"}).select('id')
        if (!academic_resource_config_category) return responseUtility.buildResponseFailed('json')

        // @INFO: Generando recurso fantasma
        const academicResourceResponse = await academicResourceService.insertOrUpdate({
          title: 'Sin titulo',
          description: 'Sin descripción',
          academic_resource_category: params.academic_resource_category
        })
        if (academicResourceResponse.status === 'error') return academicResourceResponse
        academicResource = academicResourceResponse.academicResource

        // @INFO: Generando configuración de lanzamiento para el recurso
        const academicResourceConfigResponse = await academicResourceConfigService.insertOrUpdate({
          academic_resource: academicResourceResponse.academicResource.id,
          source: {
            config_category: academic_resource_config_category._id
          }
        })
        if (academicResourceConfigResponse.status === 'error') return academicResourceConfigResponse
        academicResourceConfig = academicResourceConfigResponse.academicResourceConfig

        // @INFO: Generando simulacro fantasma
        const surveyResponse = await this.insertOrUpdate({
          name: 'Sin titulo',
          config: {
            content: academicResourceConfig.id
          }
        })
        if (surveyResponse.status === 'error') return surveyResponse
        survey = surveyResponse.survey

        // @INFO: Retornar data de los 3 elementos
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          resource_data: {
            academicResource: academicResource.id,
            academicResourceConfig: academicResourceConfig.id,
            survey: survey.id,
          }
        }})

      } catch (e) {
        return responseUtility.buildResponseFailed('json')
      }
    }

    /**
	 * Metodo que permite hacer borrar un registro
	 * @param params Filtros para eliminar
	 * @returns
	 */
    public delete = async (params: ISurveyDelete) => {
      try {
			  const find = await Survey.findOne({ _id: params.id })
			  if (!find) return responseUtility.buildResponseFailed('json', null, { error_key: 'survey.not_found' })

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
    public list = async (filters: ISurveyQuery = {}) => {

      const paging = (filters.pageNumber && filters.nPerPage) ? true : false
      const pageNumber= filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
		  const nPerPage= filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

      let select = 'id name description config status'
		  if (filters.select) {
			  select = filters.select
      }

      let where: any = {}

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
        registers =  await Survey.find(where)
        .select(select)
        .populate({
          path: 'config.content',
          select: 'id config.course_modes config.course_modes_mixed academic_resource',
          populate: [
            {
              path: 'config.course_modes',
              select: 'id name description'
            },
            {
              path: 'academic_resource',
              select: 'id title description'
            }
          ]
        })
        .skip(paging ? (pageNumber > 0 ? ( ( pageNumber - 1 ) * nPerPage ) : 0) : null)
        .limit(paging ? nPerPage : null)
        .lean()

        for (const register of registers) {
          if (typeof register?.config?.content?.config?.course_modes === 'object') {
            const mode = await CourseSchedulingMode.findOne(register?.config?.content?.config?.course_modes).select('id name description')
            const idx = registers.findIndex((r) => r._id === register._id)
            if (idx >= 0) {
              registers[idx].config.content.config.course_modes = mode
            }
          }
        }


        for (const register of registers) {
          if (register?.status) {
            if (['enabled', 'disabled'].includes(register?.status)) {
              register['statusLabel'] = i18nUtility.__(`labels.survey_${register.status}`)
            }
            if (register?.config?.content?.config?.course_modes_mixed) {
              register.config.content.config.course_modes = {
                _id: register?.config?.content?.config?.course_modes_mixed,
                name: SurveyCourseContentCustoms[register?.config?.content?.config?.course_modes_mixed].label ?? '-'
              }
            }
          }
        }
      } catch (e) {}

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          surveys: [
            ...registers
          ],
          total_register: (paging) ? await Survey.find(where).countDocuments() : 0,
          pageNumber: pageNumber,
          nPerPage: nPerPage
        }
      })
    }
}

export const surveyService = new SurveyService();
export { SurveyService as DefaultAdminAcademicContentSurveySurveyService };
