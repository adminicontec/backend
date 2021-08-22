// @import_dependencies_node Import libraries
import moment from 'moment'
// @end

// @import services
import { courseService } from '@scnode_app/services/default/admin/course/courseService'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { generalUtility } from '@scnode_core/utilities/generalUtility';
// @end

// @import models
import { Course, CourseScheduling, CourseSchedulingMode, CourseSchedulingType, Program } from '@scnode_app/models';
// @end

// @import types
import { IFetchCourses, IFetchCourse } from '@scnode_app/types/default/data/course/courseDataTypes'
// @end

class CourseDataService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor() { }

  /**
   * Metodo que permite consultar la información de un Course
   * @param params
   * @returns
   */
   public fetchCourse = async (params: IFetchCourse) => {

    try {

      let select = 'id schedulingMode program schedulingType schedulingStatus startDate endDate moodle_id hasCost priceCOP priceUSD discount startPublicationDate endPublicationDate enrollmentDeadline'

      let where = {}

      if (params.id) {
        where['_id'] = params.id
      } else if (params.slug) {
        where['_id'] = params.slug
      } else {
        return responseUtility.buildResponseFailed('json', null, {error_key: 'course.filter_to_search_required'})
      }

      let register = null
      try {
        register = await CourseScheduling.findOne(where)
        .select(select)
        .populate({ path: 'program', select: 'id name moodle_id code' })
        .populate({ path: 'schedulingMode', select: 'id name moodle_id' })
        .lean()

        if (register) {
          register['enrollment_enabled'] = false

          const schedulingExtraInfo: any = await Course.findOne({
            program: register.program._id
          })
          .lean()

          if (schedulingExtraInfo) {
            let extra_info = schedulingExtraInfo
            extra_info.coverUrl = courseService.coverUrl(extra_info)
            register['extra_info'] = extra_info
          }

          const today = moment()
          if (register.enrollmentDeadline) {
            const enrollmentDeadline = moment(register.enrollmentDeadline)
            if (today.format('YYYY-MM-DD') <= enrollmentDeadline.format('YYYY-MM-DD')) {
              register['enrollment_enabled'] = true
            }
          }
        }

      } catch (e) {}

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          course: register
        }
      })

    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que permite consultar las publicaciones
   * @param params Parametros que permiten consultar la data
   * @returns
   */
  public fetchCourses = async (params: IFetchCourses) => {

    try {
      const paging = (params.pageNumber && params.nPerPage) ? true : false

      const pageNumber = params.pageNumber ? (parseInt(params.pageNumber)) : 1
      const nPerPage = params.nPerPage ? (parseInt(params.nPerPage)) : 10

      const schedulingTypes = await CourseSchedulingType.find({name: {$in: ['Abierto']}})
      if (schedulingTypes.length === 0) {
        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            courses: [],
            total_register: 0,
            pageNumber: pageNumber,
            nPerPage: nPerPage
          }
        })
      }

      const schedulingTypesIds = schedulingTypes.reduce((accum, element) => {
        accum.push(element._id.toString())
        return accum
      }, [])

      let select = 'id schedulingMode program schedulingType schedulingStatus startDate endDate moodle_id hasCost priceCOP priceUSD discount startPublicationDate endPublicationDate enrollmentDeadline'
      if (params.select) {
        select = params.select
      }

      let where: any = {
        schedulingType: {$in: schedulingTypesIds}
      }

      if (params.search) {
        const search = params.search
        // where = {
        //   ...where,
        //   $or: [
        //     { name: { $regex: '.*' + search + '.*', $options: 'i' } },
        //     { fullname: { $regex: '.*' + search + '.*', $options: 'i' } },
        //     { displayname: { $regex: '.*' + search + '.*', $options: 'i' } },
        //     { description: { $regex: '.*' + search + '.*', $options: 'i' } },
        //   ]
        // }
        const programs = await Program.find({
          name: { $regex: '.*' + search + '.*', $options: 'i' }
        }).select('id')
        const program_ids = programs.reduce((accum, element) => {
          accum.push(element._id)
          return accum
        }, [])
        where['program'] = { $in: program_ids }
      }

      // @INFO: Filtro para Mode
      if (params.mode) {
        where['schedulingMode'] = params.mode
        // if (schedulingModesIds.includes(params.mode.toString())) {
        //   where['schedulingMode'] = params.mode
        // } else {
        //   where['schedulingMode'] = {$in: []}
        // }
      }

      // @Filtro para precio
      if (params.price) {
        if (params.price === 'free') {
          where['hasCost'] = false
        } else if (params.price === 'pay') {
          where['hasCost'] = true
        }
      }

      // Filtro para FEcha de inicio de curso
      if (params.startPublicationDate) {
        let direction = 'gte'
        let date = moment()
        if (params.startPublicationDate.date !== 'today') {
          date = moment(params.startPublicationDate.date)
        }
        if (params.startPublicationDate.direction) direction = params.startPublicationDate.direction
        where['startPublicationDate'] = { [`$${direction}`]: date.format('YYYY-MM-DD') }
      }

      if (params.endPublicationDate) {
        let direction = 'lte'
        let date = moment()
        if (params.endPublicationDate.date !== 'today') {
          date = moment(params.endPublicationDate.date)
        }
        if (params.endPublicationDate.direction) direction = params.endPublicationDate.direction
        where['endPublicationDate'] = { [`$${direction}`]: date.format('YYYY-MM-DD') }
      }

      let sort = null
      if (params.sort) {
        sort = {}
        sort[params.sort.field] = params.sort.direction
      }

      let registers = []

      try {
        registers = await CourseScheduling.find(where)
        .populate({ path: 'program', select: 'id name moodle_id code' })
        .populate({ path: 'schedulingMode', select: 'id name moodle_id' })
        .skip(paging ? (pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0) : null)
        .limit(paging ? nPerPage : null)
        .sort(sort)
        .lean()

        const program_ids = registers.reduce((accum, element) => {
          accum.push(element.program._id.toString())
          return accum
        }, [])

        if (program_ids.length > 0) {
          const schedulingExtraInfo: any = await Course.find({
            program: {$in: program_ids}
          })
          .lean()

          const extra_info_by_program = schedulingExtraInfo.reduce((accum, element) => {
            if (!accum[element.program]) {
              element.coverUrl = courseService.coverUrl(element)
              accum[element.program.toString()] = element
            }
            return accum
          }, {})

          for await (const register of registers) {
            if (extra_info_by_program[register.program._id.toString()]) {
              register['extra_info'] = extra_info_by_program[register.program._id.toString()]
            }
          }
        }

      } catch (e) { }

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          courses: [
            ...registers
          ],
          total_register: (paging) ? await Course.find(where).count() : 0,
          pageNumber: pageNumber,
          nPerPage: nPerPage
        }
      })

    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }


}

export const courseDataService = new CourseDataService();
export { CourseDataService as DefaultDataCourseCourseDataService };
