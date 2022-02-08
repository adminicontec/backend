// @import_dependencies_node Import libraries
import moment from 'moment'
const ObjectID = require('mongodb').ObjectID
// @end

// @import services
import { courseService } from '@scnode_app/services/default/admin/course/courseService'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { generalUtility } from '@scnode_core/utilities/generalUtility';
// @end

// @import models
import { CourseScheduling, CourseSchedulingDetails, Course, Enrollment } from '@scnode_app/models'
// @end

// @import types
import {IFetchCourseSchedulingByProgram, IFetchCourseSchedulingExtend} from '@scnode_app/types/default/data/course/courseSchedulingDataTypes'
// @end

class CourseSchedulingDataService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite consultar las publicaciones
   * @param params Parametros que permiten consultar la data
   * @returns
   */
  public fetchCourseSchedulingByProgram = async (params: IFetchCourseSchedulingByProgram) => {

    try {
      let select = 'id metadata schedulingMode modular program schedulingType schedulingStatus startDate endDate regional city country amountParticipants observations client duration in_design moodle_id attachments attachments_student'

      let where = {
        moodle_id: params.moodle_id
      }

      const register: any = await CourseScheduling.findOne(where)
        .populate({ path: 'metadata.user', select: 'id profile.first_name profile.last_name' })
        .populate({ path: 'schedulingMode', select: 'id name moodle_id' })
        .populate({ path: 'modular', select: 'id name' })
        .populate({ path: 'program', select: 'id name moodle_id code' })
        .populate({ path: 'schedulingType', select: 'id name' })
        .populate({ path: 'schedulingStatus', select: 'id name' })
        .populate({ path: 'regional', select: 'id name' })
        .populate({ path: 'city', select: 'id name' })
        .populate({ path: 'country', select: 'id name' })
        .populate({ path: 'client', select: 'id name'})
        // .populate({path: 'course', select: 'id name'})
        // .populate({path: 'teacher', select: 'id profile.first_name profile.last_name'})
        .select(select)
        .lean()
        // console.log('register', register)

      if (!register) return responseUtility.buildResponseFailed('json', null, { error_key: 'course_scheduling.not_found' })

      const schedulingExtraInfo: any = await Course.findOne({
        program: register.program._id
      })
      .lean()

      if (schedulingExtraInfo) {
        let extra_info = schedulingExtraInfo
        extra_info.coverUrl = courseService.coverUrl(extra_info)
        register['extra_info'] = extra_info
      }

      let total_scheduling = 0
      let scheduling = []
      let courses = []

      let selectDetails = 'id course_scheduling course schedulingMode startDate endDate teacher number_of_sessions sessions duration'

      let sessions_where = {
        course_scheduling: register._id
      }

      if (params.only_user_logged && params.user) {
        sessions_where['teacher'] = params.user
      }

      if (params.sessionStartDate) {
        let direction = 'lte'
        let date = moment.utc()
        if (params.sessionStartDate.date !== 'today') {
          date = moment.utc(params.sessionStartDate.date)
        }
        if (params.sessionStartDate.direction) direction = params.sessionStartDate.direction
        if (register.schedulingMode) {
          if (register.schedulingMode.name === 'Virtual') {
            sessions_where['$and'] = [
              {$or: [
                {'startDate': {[`$gte`]: date.format('YYYY-MM-DD')}},
                {$and: [
                  {'startDate': {[`$lte`]: date.format('YYYY-MM-DD')}},
                  {'endDate': {[`$gte`]: date.format('YYYY-MM-DD')}},
                ]}
              ]}
            ]
          } else {
            sessions_where['sessions.startDate'] = {[`$${direction}`]: date.format('YYYY-MM-DD')}

            selectDetails = selectDetails.split(' ').map((string) => {
              if (string === 'sessions') string = 'sessions.$'
              return string
            }).join(' ')
          }
        }
      }

      const detailSessions = await CourseSchedulingDetails.find(sessions_where)
        .select(selectDetails)
        .populate({ path: 'course_scheduling', select: 'id moodle_id' })
        .populate({ path: 'course', select: 'id name code moodle_id' })
        .populate({ path: 'schedulingMode', select: 'id name moodle_id' })
        .populate({ path: 'teacher', select: 'id profile.first_name profile.last_name' })
        .select(select)
        .lean()

      let session_count = 0

      detailSessions.map((element, index) => {
        let duration_scheduling = parseInt(element.duration)
        let first_session = true

        let course = {
          course_code: (element.course && element.course.code) ? element.course.code : '',
          course_name: (element.course && element.course.name) ? element.course.name : '',
          course_duration: (duration_scheduling) ? generalUtility.getDurationFormated(duration_scheduling) : '0h',
        }

        courses.push(course)

        if (element.sessions.length === 0) {
          total_scheduling += parseInt(element.duration)

          let item = {
            client: (register.client?.name) ? register.client.name : '-',
            city: (register.city && register.city.name) ? register.city.name : '-',
            scheduling_mode: (register.schedulingMode && register.schedulingMode.name) ? register.schedulingMode.name : '-',
            course_code: (element.course && element.course.code) ? element.course.code : '',
            course_name: (element.course && element.course.name) ? element.course.name : '',
            course_duration: (duration_scheduling) ? generalUtility.getDurationFormated(duration_scheduling) : '0h',
            course_row_span: 0,
            consecutive: index + 1,
            teacher_name: `${element.teacher.profile.first_name} ${element.teacher.profile.last_name}`,
            start_date: (element.startDate) ? moment.utc(element.startDate).format('DD/MM/YYYY') : '',
            end_date: (element.endDate) ? moment.utc(element.endDate).format('DD/MM/YYYY') : '',
            duration: (element.duration) ? generalUtility.getDurationFormated(element.duration) : '0h',
            schedule: '-',
          }

          scheduling.push(item)
        } else {
          element.sessions.map((session) => {
            total_scheduling += parseInt(session.duration)

            let row_content = {
              client: (register.client?.name) ? register.client?.name : '',
              city: (register.city && register.city.name) ? register.city.name : '',
              scheduling_mode: (register.schedulingMode && register.schedulingMode.name) ? register.schedulingMode.name : '',
              course_code: (element.course && element.course.code) ? element.course.code : '',
              course_name: (element.course && element.course.name) ? element.course.name : '',
              course_duration: (duration_scheduling) ? generalUtility.getDurationFormated(duration_scheduling) : '0h',
              course_row_span: (element.sessions.length > 0) ? element.sessions.length : 0,
            }

            let schedule = ''
            if (session.startDate && session.duration) {
              let endDate = moment(session.startDate).add(session.duration, 'seconds')
              schedule += `${moment(session.startDate).format('hh:mm a')} a ${moment(endDate).format('hh:mm a')}`
            }
            let session_data = {
              consecutive: session_count + 1,
              teacher_name: `${element.teacher.profile.first_name} ${element.teacher.profile.last_name}`,
              start_date: (session.startDate) ? moment.utc(session.startDate).format('DD/MM/YYYY') : '',
              duration: (session.duration) ? generalUtility.getDurationFormated(session.duration) : '0h',
              schedule: schedule,
            }
            let item = {}
            // if (first_session) {
              item = { ...item, ...row_content, ...session_data }
            // } else {
              // item = { ...item, ...session_data }
            // }
            session_count++
            first_session = false
            scheduling.push(item)
          })
        }

      })

      return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
        program: {
          name: (register.program && register.program.name) ? register.program.name : '',
          extra_info: (register.extra_info) ? register.extra_info : null
        },
        courses,
        scheduling,
      }})
    } catch (error) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que permite listar todos los registros
   * @param [filters] Estructura de filtros para la consulta
   * @returns
   */
  public fetchCourseSchedulingExtend = async (params: IFetchCourseSchedulingExtend) => {

    const paging = (params.pageNumber && params.nPerPage) ? true : false

    const pageNumber = params.pageNumber ? (parseInt(params.pageNumber)) : 1
    const nPerPage = params.nPerPage ? (parseInt(params.nPerPage)) : 10

    let select = 'id metadata schedulingMode schedulingModeDetails modular program schedulingType schedulingStatus startDate endDate regional regional_transversal city country amountParticipants observations client duration in_design moodle_id hasCost priceCOP priceUSD discount startPublicationDate endPublicationDate enrollmentDeadline endDiscountDate account_executive certificate_clients certificate_students certificate english_certificate scope english_scope certificate_icon_1 certificate_icon_2 certificate_icon_3 attachments attachments_student'
    if (params.select) {
      select = params.select
    }

    let where: object[] = []

    if (params.company) where.push({$match: {client: ObjectID(params.company)}})
    if (params.start_date) where.push({$match: {startDate: {$gte: new Date(params.start_date)}}})
    if (params.end_date) where.push({$match: {endDate: {$lte: new Date(params.end_date)}}})

    let registers = []
    try {
      if (where.length) {
        const pagination = []
        if (paging) {
          if (pageNumber > 0) {
            pagination.push({
              $skip: (pageNumber - 1) * nPerPage
            })
          }
          pagination.push({
            $limit: nPerPage
          })
        }
        pagination.push({
          $sort: { startDate: -1 }
        })

        registers = await CourseScheduling.aggregate(where.concat(pagination))
        await CourseScheduling.populate(registers, [
          { path: 'metadata.user', select: 'id profile.first_name profile.last_name' },
          { path: 'schedulingMode', select: 'id name moodle_id' },
          { path: 'modular', select: 'id name' },
          { path: 'program', select: 'id name moodle_id code' },
          { path: 'schedulingType', select: 'id name' },
          { path: 'schedulingStatus', select: 'id name' },
          { path: 'regional', select: 'id name' },
          { path: 'city', select: 'id name' },
          { path: 'country', select: 'id name' },
          {path: 'account_executive', select: 'id profile.first_name profile.last_name'},
          { path: 'client', select: 'id name'}
        ])
      } else {
        registers = await CourseScheduling.find({})
        .select(select)
        .populate({ path: 'metadata.user', select: 'id profile.first_name profile.last_name' })
        .populate({ path: 'schedulingMode', select: 'id name moodle_id' })
        .populate({ path: 'modular', select: 'id name' })
        .populate({ path: 'program', select: 'id name moodle_id code' })
        .populate({ path: 'schedulingType', select: 'id name' })
        .populate({ path: 'schedulingStatus', select: 'id name' })
        .populate({ path: 'regional', select: 'id name' })
        .populate({ path: 'city', select: 'id name' })
        .populate({ path: 'country', select: 'id name' })
        // .populate({path: 'course', select: 'id name'})
        .populate({path: 'account_executive', select: 'id profile.first_name profile.last_name'})
        .populate({path: 'client', select: 'id name'})
        .skip(paging ? (pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0) : null)
        .limit(paging ? nPerPage : null)
        .sort({ startDate: -1 })
        .lean()
      }

      let participants = {}

      const course_scheduling_ids = registers.reduce((accum, element) => {
        accum.push(element._id)
        return accum
      }, [])

      if (course_scheduling_ids.length > 0) {
        const participantByCourseScheduling = await Enrollment.find({
          course_scheduling: {$in: course_scheduling_ids}
        })

        for (const iterator of participantByCourseScheduling) {
          if (iterator.course_scheduling) {
            if (!participants[iterator.course_scheduling.toString()]) {
              participants[iterator.course_scheduling.toString()] = []
            }
            participants[iterator.course_scheduling.toString()].push(iterator)
          }
        }
      }

      for await (const register of registers) {
        if (register.startDate) register.startDate = moment.utc(register.startDate).format('YYYY-MM-DD')
        if (register.endDate) register.endDate = moment.utc(register.endDate).format('YYYY-MM-DD')
        register.duration = (register.duration) ? generalUtility.getDurationFormated(register.duration) : '0h'
        register.participants = (participants[register._id.toString()]) ? participants[register._id.toString()].length : 0
      }
    } catch (e) {}

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        schedulings: [
          ...registers
        ],
        total_register: (paging) ? (where.length ? (await CourseScheduling.aggregate(where)).length : await CourseScheduling.find({}).count()) : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    })
  }
}

export const courseSchedulingDataService = new CourseSchedulingDataService();
export { CourseSchedulingDataService as DefaultDataCourseCourseSchedulingDataService };
