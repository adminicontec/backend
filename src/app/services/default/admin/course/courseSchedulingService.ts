// @import_dependencies_node Import libraries
const ObjectID = require('mongodb').ObjectID
import moment from 'moment'
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import {Course, CourseScheduling, CourseSchedulingMode, CourseSchedulingStatus, CourseSchedulingType, Program, Regional, User} from '@scnode_app/models'
// @end

// @import types
import {IQueryFind, QueryValues} from '@scnode_app/types/default/global/queryTypes'
import {ICourseScheduling, ICourseSchedulingDelete, ICourseSchedulingQuery} from '@scnode_app/types/default/admin/course/courseSchedulingTypes'
// @end

class CourseSchedulingService {

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

      let select = 'id schedulingStatus program schedulingType schedulingMode course startDate endDate teacher regional observations duration sessions'
      if (params.query === QueryValues.ALL) {
        const registers: any = await CourseScheduling.find(where)
        .populate({path: 'schedulingStatus', select: 'id name'})
        .populate({path: 'schedulingType', select: 'id name'})
        .populate({path: 'schedulingMode', select: 'id name'})
        .populate({path: 'program', select: 'id name'})
        .populate({path: 'course', select: 'id name'})
        .populate({path: 'teacher', select: 'id profile.first_name profile.last_name'})
        .populate({path: 'regional', select: 'id name'})
        .select(select)
        .lean()

        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          schedulings: registers
        }})
      } else if (params.query === QueryValues.ONE) {
        const register: any = await CourseScheduling.findOne(where)
        .populate({path: 'schedulingStatus', select: 'id name'})
        .populate({path: 'schedulingType', select: 'id name'})
        .populate({path: 'schedulingMode', select: 'id name'})
        .populate({path: 'program', select: 'id name'})
        .populate({path: 'course', select: 'id name'})
        .populate({path: 'teacher', select: 'id profile.first_name profile.last_name'})
        .populate({path: 'regional', select: 'id name'})
        .select(select)
        .lean()

        if (!register) return responseUtility.buildResponseFailed('json', null, {error_key: 'course_scheduling.not_found'})

        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          scheduling: register
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
  public insertOrUpdate = async (params: ICourseScheduling) => {

    try {

      if (params.id) {
        const register: any = await CourseScheduling.findOne({_id: params.id}).lean()
        if (!register) return responseUtility.buildResponseFailed('json', null, {error_key: 'course_scheduling.not_found'})

        const response: any = await CourseScheduling.findByIdAndUpdate(params.id, params, {
          useFindAndModify: false,
          new: true,
          lean: true,
        })
        await CourseSchedulingStatus.populate(response, {path: 'schedulingStatus', select: 'id name'})
        await CourseSchedulingType.populate(response, {path: 'schedulingType', select: 'id name'})
        await CourseSchedulingMode.populate(response, {path: 'schedulingMode', select: 'id name'})
        await Program.populate(response, {path: 'program', select: 'id name'})
        await Course.populate(response, {path: 'course', select: 'id name'})
        await User.populate(response, {path: 'teacher', select: 'id profile.first_name profile.last_name'})
        await Regional.populate(response, {path: 'regional', select: 'id name'})

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            scheduling: {
              ...response,
            }
          }
        })

      } else {

        const {_id} = await CourseScheduling.create(params)
        const response: any = await CourseScheduling.findOne({_id})
        .populate({path: 'schedulingStatus', select: 'id name'})
        .populate({path: 'schedulingType', select: 'id name'})
        .populate({path: 'schedulingMode', select: 'id name'})
        .populate({path: 'program', select: 'id name'})
        .populate({path: 'course', select: 'id name'})
        .populate({path: 'teacher', select: 'id profile.first_name profile.last_name'})
        .populate({path: 'regional', select: 'id name'})
        .lean()

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            scheduling: {
              ...response,
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
  public delete = async (params: ICourseSchedulingDelete) => {
    try {
      const find: any = await CourseScheduling.findOne({ _id: params.id })
      if (!find) return responseUtility.buildResponseFailed('json', null, { error_key: 'course_scheduling.not_found' })

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
  public list = async (filters: ICourseSchedulingQuery = {}) => {

    const paging = (filters.pageNumber && filters.nPerPage) ? true : false

    const pageNumber= filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage= filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let select = 'id schedulingStatus program schedulingType schedulingMode course startDate endDate teacher regional observations duration sessions'
    if (filters.select) {
      select = filters.select
    }

    let where = {}

    if(filters.search){
      const search = filters.search
      where = {
        ...where,
        $or:[
          {observations: { $regex: '.*' + search + '.*',$options: 'i' }}
        ]
      }
    }

    let registers = []
    try {
      registers =  await CourseScheduling.find(where)
      .select(select)
      .populate({path: 'schedulingStatus', select: 'id name'})
      .populate({path: 'schedulingType', select: 'id name'})
      .populate({path: 'schedulingMode', select: 'id name'})
      .populate({path: 'program', select: 'id name'})
      .populate({path: 'course', select: 'id name'})
      .populate({path: 'teacher', select: 'id profile.first_name profile.last_name'})
      .populate({path: 'regional', select: 'id name'})
      .skip(paging ? (pageNumber > 0 ? ( ( pageNumber - 1 ) * nPerPage ) : 0) : null)
      .limit(paging ? nPerPage : null)
      .sort({created_at: -1})
      .lean()

      for await (const register of registers) {
        if (register.startDate) register.startDate = moment.utc(register.startDate).format('YYYY-MM-DD')
        if (register.endDate) register.endDate = moment.utc(register.endDate).format('YYYY-MM-DD')
        if (register.teacher && register.teacher.profile) {
          register.teacher.fullname = `${register.teacher.profile.first_name} ${register.teacher.profile.last_name}`
        }
      }
    } catch (e) {}

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        schedulings: [
          ...registers
        ],
        total_register: (paging) ? await CourseScheduling.find(where).count() : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    })
  }

}

export const courseSchedulingService = new CourseSchedulingService();
export { CourseSchedulingService as DefaultAdminCourseCourseSchedulingService };
