// @import_dependencies_node Import libraries
import moment from 'moment';
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import {CourseSchedulingDetails, Enrollment, User} from '@scnode_app/models'
// @end

// @import types
import {IFetchEnrollementByUser} from '@scnode_app/types/default/data/enrolledCourse/enrolledCourseTypes'
// @end

class EnrolledCourseService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite listar todos los registros
   * @param [filters] Estructura de filtros para la consulta
   * @returns
   */
   public fetchEnrollmentByUser = async (params: IFetchEnrollementByUser) => {
    let registers = []
    let steps = []

    let added = {}

    try {
      steps.push('1')
      steps.push(params.user)
      const enrolled = await Enrollment.find({
        user: params.user
      }).select('id course_scheduling')
      .populate({ path: 'course_scheduling', select: 'id program startDate', populate: [
        {path: 'program', select: 'id name code moodle_id'}
      ] })
      .lean()
      steps.push('2')
      steps.push(enrolled)

      enrolled.map((e) => {
        if (e.course_scheduling && e.course_scheduling.program && e.course_scheduling.program) {
          if (!added[e.course_scheduling.program.moodle_id]) {
            registers.push({
              _id: e.course_scheduling.program.moodle_id,
              name: e.course_scheduling.program.name,
              startDate: e.course_scheduling.startDate
            })
            added[e.course_scheduling.program.moodle_id] = e.course_scheduling.program.moodle_id
          }
        }
      })
      steps.push('3')

      const courses = await CourseSchedulingDetails.find({
        teacher: params.user
      }).select('id course_scheduling')
      .populate({ path: 'course_scheduling', select: 'id program startDate', populate: [
        {path: 'program', select: 'id name code moodle_id'}
      ] })
      .lean()
      steps.push('4')
      steps.push(courses)

      courses.map((e) => {
        if (e.course_scheduling && e.course_scheduling.program && e.course_scheduling.program) {
          if (!added[e.course_scheduling.program.moodle_id]) {
            registers.push({
              _id: e.course_scheduling.program.moodle_id,
              name: e.course_scheduling.program.name,
              startDate: e.course_scheduling.startDate
            })
            added[e.course_scheduling.program.moodle_id] = e.course_scheduling.program.moodle_id
          }
        }
      })
      steps.push(5)

      registers.sort((a, b) => moment.utc(b.startDate).diff(moment.utc(a.startDate)))
    } catch (e) {
      steps.push('error')
    }
    steps.push('6')

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        current_courses: [
          ...registers
        ],
        history_courses: [],
        steps
      }
    })
  }
}

export const enrolledCourseService = new EnrolledCourseService();
export { EnrolledCourseService as DefaultDataEnrolledCourseEnrolledCourseService };
