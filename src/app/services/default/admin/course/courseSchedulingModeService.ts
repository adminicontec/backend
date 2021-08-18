// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import {CourseSchedulingMode} from '@scnode_app/models'
// @end

// @import types
import {IQueryFind, QueryValues} from '@scnode_app/types/default/global/queryTypes'
import {ICourseSchedulingMode, ICourseSchedulingModeDelete, ICourseSchedulingModeQuery} from '@scnode_app/types/default/admin/course/courseSchedulingModeTypes'
// @end

class CourseSchedulingModeService {

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

      let select = 'id name description'
      if (params.query === QueryValues.ALL) {
        const registers = await CourseSchedulingMode.find(where).select(select)
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          courseSchedulingModes: registers
        }})
      } else if (params.query === QueryValues.ONE) {
        const register = await CourseSchedulingMode.findOne(where).select(select)
        if (!register) return responseUtility.buildResponseFailed('json', null, {error_key: 'course_scheduling.mode.not_found'})
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          courseSchedulingMode: register
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
  public insertOrUpdate = async (params: ICourseSchedulingMode) => {

    try {
      if (params.id) {
        const register = await CourseSchedulingMode.findOne({_id: params.id})
        if (!register) return responseUtility.buildResponseFailed('json', null, {error_key: 'course_scheduling.mode.not_found'})

        // @INFO: Validando nombre unico
        if (params.name) {
          const exist = await CourseSchedulingMode.findOne({ name: params.name, _id: {$ne: params.id}})
          if (exist) return responseUtility.buildResponseFailed('json', null, { error_key: {key: 'course_scheduling.mode.insertOrUpdate.already_exists', params: {name: params.name}} })
        }

        const response: any = await CourseSchedulingMode.findByIdAndUpdate(params.id, params, { useFindAndModify: false, new: true })

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            courseSchedulingMode: {
              _id: response._id,
              name: response.name,
              description: response.description,
            }
          }
        })

      } else {
        const exist = await CourseSchedulingMode.findOne({ name: params.name })
        if (exist) return responseUtility.buildResponseFailed('json', null, { error_key: {key: 'course_scheduling.mode.insertOrUpdate.already_exists', params: {name: params.name}} })

        const response: any = await CourseSchedulingMode.create(params)

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            courseSchedulingMode: {
              _id: response._id,
              name: response.name,
              description: response.description,
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
  public delete = async (params: ICourseSchedulingModeDelete) => {
    try {
      const find: any = await CourseSchedulingMode.findOne({ _id: params.id })
      if (!find) return responseUtility.buildResponseFailed('json', null, { error_key: 'course_scheduling.mode.not_found' })

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
  public list = async (filters: ICourseSchedulingModeQuery = {}) => {

    const paging = (filters.pageNumber && filters.nPerPage) ? true : false

    const pageNumber= filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage= filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let select = 'id name description'
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

    if (filters.moodle_id && (filters.moodle_id === true || filters.moodle_id === 'true')) {
      where['moodle_id'] = {$exists: true}
    }

    let registers = []
    try {
      registers =  await CourseSchedulingMode.find(where)
      .select(select)
      .skip(paging ? (pageNumber > 0 ? ( ( pageNumber - 1 ) * nPerPage ) : 0) : null)
      .limit(paging ? nPerPage : null)
    } catch (e) {}

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        courseSchedulingModes: [
          ...registers
        ],
        total_register: (paging) ? await CourseSchedulingMode.find(where).count() : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    })
  }

}

export const courseSchedulingModeService = new CourseSchedulingModeService();
export { CourseSchedulingModeService as DefaultAdminCourseCourseSchedulingModeService };
