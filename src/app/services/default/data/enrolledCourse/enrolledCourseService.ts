// @import_dependencies_node Import libraries
import moment from 'moment';
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import {Enrollment} from '@scnode_app/models'
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
    try {
      const enrolled = await Enrollment.find({
        user: params.user
      }).select('id course_scheduling')
      .populate({ path: 'course_scheduling', select: 'id program startDate', populate: [
        {path: 'program', select: 'id name code moodle_id'}
      ] })
      .lean()

      enrolled.map((e) => {
        registers.push({
          _id: e.course_scheduling.program.moodle_id,
          name: e.course_scheduling.program.name,
          startDate: e.course_scheduling.startDate
        })
      })

      registers.sort((a, b) => moment.utc(b.startDate).diff(moment.utc(a.startDate)))
    } catch (e) { }

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        current_courses: [
          ...registers
        ],
        history_courses: []
      }
    })
  }
}

export const enrolledCourseService = new EnrolledCourseService();
export { EnrolledCourseService as DefaultDataEnrolledCourseEnrolledCourseService };
