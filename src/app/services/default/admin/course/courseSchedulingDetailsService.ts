// @import_dependencies_node Import libraries
const ObjectID = require('mongodb').ObjectID
import moment from 'moment'
// @end

// @import services
import { courseSchedulingNotificationsService } from '@scnode_app/services/default/admin/course/courseSchedulingNotificationsService';
import { moodleEnrollmentService } from '../../moodle/enrollment/moodleEnrollmentService';
import {courseSchedulingService} from '@scnode_app/services/default/admin/course/courseSchedulingService'
// @end

// @import config
import { customs } from '@scnode_core/config/globals'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { generalUtility } from '@scnode_core/utilities/generalUtility';
// @end

// @import models
import { CourseSchedulingSection, CourseSchedulingDetails, Course, CourseScheduling, CourseSchedulingMode, CourseSchedulingStatus, CourseSchedulingType, Modular, Program, Regional, User } from '@scnode_app/models'
// @end

// @import types
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes'
import { ICourseSchedulingDetail, ICourseSchedulingDetailDelete, ICourseSchedulingDetailQuery } from '@scnode_app/types/default/admin/course/courseSchedulingDetailsTypes'
// @end

class CourseSchedulingDetailsService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor() { }

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

      let select = 'id course_scheduling course schedulingMode startDate endDate teacher number_of_sessions sessions duration'
      if (params.query === QueryValues.ALL) {
        const registers: any = await CourseSchedulingDetails.find(where)
          .populate({ path: 'course_scheduling', select: 'id moodle_id' })
          .populate({ path: 'course', select: 'id name code moodle_id' })
          .populate({ path: 'schedulingMode', select: 'id name moodle_id' })
          .populate({ path: 'teacher', select: 'id profile.first_name profile.last_name' })
          .select(select)
          .lean()

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            schedulings: registers
          }
        })
      } else if (params.query === QueryValues.ONE) {
        const register: any = await CourseSchedulingDetails.findOne(where)
          .populate({ path: 'course_scheduling', select: 'id moodle_id' })
          .populate({ path: 'course', select: 'id name code moodle_id' })
          .populate({ path: 'schedulingMode', select: 'id name moodle_id' })
          .populate({ path: 'teacher', select: 'id profile.first_name profile.last_name' })
          .select(select)
          .lean()

        if (!register) return responseUtility.buildResponseFailed('json', null, { error_key: 'course_scheduling.details.not_found' })

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            scheduling: register
          }
        })
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
  public insertOrUpdate = async (params: ICourseSchedulingDetail) => {

    try {
      if (params.course && typeof params.course !== "string" && params.course.hasOwnProperty('value')) {

        const courseArr = params.course.label.toString().split('|')
        if (courseArr[0] && courseArr[1]) {
          const courseLocal = await CourseSchedulingSection.findOne({
            moodle_id: params.course.value,
            code: courseArr[0].trim(),
          }).select('id').lean()
          if (courseLocal) {
            await CourseSchedulingSection.findByIdAndUpdate(courseLocal._id, {
              name: courseArr[1].trim(),
            }, { useFindAndModify: false, new: true })
            params.course = courseLocal._id
          } else {
            const newCourseLocal = await CourseSchedulingSection.create({
              name: courseArr[1].trim(),
              moodle_id: params.course.value,
              code: courseArr[0].trim(),
            })
            if (newCourseLocal) {
              params.course = newCourseLocal._id
            }
          }
        }
      }

      if (params.schedulingMode && typeof params.schedulingMode !== "string" && params.schedulingMode.hasOwnProperty('value')) {
        const schedulingModeLocal = await CourseSchedulingMode.findOne({
          moodle_id: params.schedulingMode.value
        }).select('id').lean()
        if (schedulingModeLocal) {
          params.schedulingMode = schedulingModeLocal._id
        } else {
          const newSchedulingModeLocal = await CourseSchedulingMode.create({
            name: params.schedulingMode.label,
            moodle_id: params.schedulingMode.value
          })
          if (newSchedulingModeLocal) {
            params.schedulingMode = newSchedulingModeLocal._id
          }
        }
      }

      if (params.id) {
        const register: any = await CourseSchedulingDetails.findOne({ _id: params.id }).lean()
        .populate({ path: 'teacher', select: 'id profile.first_name profile.last_name moodle_id email' })
        .populate({path: 'course', select: 'id name code'})
        if (!register) return responseUtility.buildResponseFailed('json', null, { error_key: 'course_scheduling.details.not_found' })

        const changes = this.validateChanges(params, register)

        const response: any = await CourseSchedulingDetails.findByIdAndUpdate(params.id, params, {
          useFindAndModify: false,
          new: true,
          lean: true,
        })

        await CourseScheduling.populate(response, {
          path: 'course_scheduling', select: 'id metadata program startDate endDate schedulingStatus moodle_id client city schedulingMode duration schedulingType amountParticipants regional account_executive', populate: [
            {path: 'city', select: 'id name'},
            {path: 'schedulingStatus', select: 'id name'},
            {path: 'schedulingMode', select: 'id name'},
            {path: 'schedulingType', select: 'id name'},
            {path: 'regional', select: 'id name'},
            {path: 'program', select: 'id name'},
            {path: 'client', select: 'id name'},
            {path: 'account_executive', select: 'id profile.first_name profile.last_name moodle_id email' }
          ]})
        await CourseSchedulingSection.populate(response, { path: 'course', select: 'id name moodle_id' })
        await CourseSchedulingMode.populate(response, { path: 'schedulingMode', select: 'id name moodle_id' })
        await User.populate(response, { path: 'teacher', select: 'id profile.first_name profile.last_name moodle_id email' })

        if (register.teacher.moodle_id !== response.teacher.moodle_id) {
          let respMoodle3: any = await moodleEnrollmentService.update({
            roleid: 4,
            courseid: response.course_scheduling.moodle_id,
            olduserid: register.teacher.moodle_id,
            newuserid: response.teacher.moodle_id
          });
        }

        if ((params.sendEmail === true || params.sendEmail === 'true') && (response && response.course_scheduling && response.course_scheduling.schedulingStatus  && response.course_scheduling.schedulingStatus.name === 'Confirmado')) {
          if ((register.teacher && register.teacher._id && params.teacher) && register.teacher._id.toString() !== params.teacher.toString()) {
            // @INFO: Notificación al docente asignado
            await courseSchedulingService.checkEnrollmentTeachers(response.course_scheduling, response.teacher._id, null)
            // @INFO: Notificación al docente cuando este fue cambiado
            await courseSchedulingService.sendUnenrollmentUserEmail(register.teacher.email, {
              mailer: customs['mailer'],
              first_name: register.teacher.profile.first_name,
              course_name: register.course.name,
              course_code: register.course.code,
              program: {
                _id: response.course_scheduling.program._id,
                course_scheduling_id: response.course_scheduling._id,
                service_id: (response.course_scheduling?.metadata?.service_id) ? response.course_scheduling?.metadata?.service_id : '-',
                name: response.course_scheduling.program.name,
                observations: response.course_scheduling.observations,
                client: (response.course_scheduling.client?.name) ? response.course_scheduling.client?.name : '-',
                city: (response.course_scheduling.city && response.course_scheduling.city.name) ? response.course_scheduling.city.name : '-',
                scheduling_mode: (response.course_scheduling.schedulingMode && response.course_scheduling.schedulingMode.name) ? response.course_scheduling.schedulingMode.name : '-',
                duration: (response.course_scheduling?.duration) ? generalUtility.getDurationFormated(response.course_scheduling?.duration, 'large') : '-',
                scheduling_type: (response.course_scheduling?.schedulingType?.name) ? response.course_scheduling?.schedulingType?.name : '-',
                amountParticipants: (response.course_scheduling?.amountParticipants) ? response.course_scheduling?.amountParticipants : '-',
                regional: (response.course_scheduling?.regional?.name) ? response.course_scheduling?.regional?.name : '-',
                account_executive: (response.course_scheduling?.account_executive?.profile?.first_name) ? `${response.course_scheduling?.account_executive?.profile?.first_name} ${response.course_scheduling?.account_executive?.profile?.last_name}` : '-',
              },
              type: 'teacher',
              notification_source: `course_teacher_remove_${register.teacher._id}_${response._id}`,
              // amount_notifications: 1
            })
          }

          if (changes.length > 0) {
            // @INFO Notificar al auxiliar logisto del servicio
            await courseSchedulingNotificationsService.sendNotificationOfServiceToAssistant(response.course_scheduling._id, 'modify', true);
            await courseSchedulingService.sendServiceSchedulingUpdated(response.course_scheduling, changes, {
              course: response.course,
              courseSchedulingDetail: register,
            })
          }
        }

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            scheduling: {
              ...response,
            }
          }
        })

      } else {

        const { _id } = await CourseSchedulingDetails.create(params)
        const response: any = await CourseSchedulingDetails.findOne({ _id })
          .populate({ path: 'course_scheduling', select: 'id metadata program startDate endDate schedulingStatus moodle_id client city schedulingMode duration schedulingType amountParticipants regional account_executive', populate: [
            {path: 'city', select: 'id name'},
            {path: 'schedulingStatus', select: 'id name'},
            {path: 'schedulingMode', select: 'id name'},
            {path: 'schedulingType', select: 'id name'},
            {path: 'regional', select: 'id name'},
            {path: 'program', select: 'id name'},
            {path: 'client', select: 'id name'},
            {path: 'account_executive', select: 'id profile.first_name profile.last_name moodle_id email' }
          ] })
          .populate({ path: 'course', select: 'id name moodle_id' })
          .populate({ path: 'schedulingMode', select: 'id name moodle_id' })
          .populate({path: 'teacher', select: 'id profile.first_name profile.last_name moodle_id email'})
          .lean()

        // asignación del rol: Teacher en Moodle (sin permisos)
        let respMoodle3: any = await moodleEnrollmentService.insert({
          roleid: 4,
          courseid: response.course_scheduling.moodle_id,
          userid: response.teacher.moodle_id
        });
        console.log('respMoodle3', respMoodle3)

        if ((params.sendEmail === true || params.sendEmail === 'true') && (response && response.course_scheduling && response.course_scheduling.schedulingStatus  && response.course_scheduling.schedulingStatus.name === 'Confirmado')) {
          await courseSchedulingService.checkEnrollmentTeachers(response.course_scheduling, response.teacher._id, 1)
          // await courseSchedulingService.sendEnrollmentUserEmail([response.teacher.email], {
          //   mailer: customs['mailer'],
          //   first_name: response.teacher.profile.first_name,
          //   course_name: response.course_scheduling.program.name,
          //   course_start: moment.utc(response.course_scheduling.startDate).format('YYYY-MM-DD'),
          //   course_end: moment.utc(response.course_scheduling.endDate).format('YYYY-MM-DD'),
          //   type: 'teacher',
          //   notification_source: `course_start_${response.teacher._id}_${response._id}`,
          //   amount_notifications: 1
          // })
        }

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            scheduling: {
              ...response,
            }
          }
        })
      }

    } catch (e) {
      console.log('error', e)
      return responseUtility.buildResponseFailed('json')
    }
  }

  private validateChanges = (params: ICourseSchedulingDetail, register: typeof CourseSchedulingDetails) => {
    const changes = []

    if ((register.startDate && params.startDate) && `${params.startDate}T00:00:00.000Z` !== register.startDate.toISOString()) {
      changes.push({
        message: `<div>La fecha de inicio del curso ha cambiado de ${moment(register.startDate.toISOString().replace('T00:00:00.000Z', '')).format('YYYY-MM-DD')} a ${params.startDate}</div>`
      })
    }
    if ((register.endDate && params.endDate) && `${params.endDate}T00:00:00.000Z` !== register.endDate.toISOString()) {
      changes.push({
        message: `<div>La fecha de fin del curso ha cambiado de ${moment(register.endDate.toISOString().replace('T00:00:00.000Z', '')).format('YYYY-MM-DD')} a ${params.endDate}</div>`
      })
    }
    if ((register.duration && params.duration) && params.duration !== register.duration) {
      changes.push({
        message: `<div>La duración del curso ha cambiado de ${generalUtility.getDurationFormated(register.duration)} a ${generalUtility.getDurationFormated(params.duration)}</div>`
      })
    }

    let sessionsChange =  []
    if (params.sessions) {
      sessionsChange = params.sessions.filter((session) => session.hasChanges === 'on')
    }

    if (
      ((register.number_of_sessions && params.number_of_sessions) && params.number_of_sessions.toString() !== register.number_of_sessions.toString()) ||
      sessionsChange.length > 0
    ) {
      let message = `Las siguientes sesiones han sido modificadas:<ul>`
      params.sessions.map((session) => {
        if (session.hasChanges === 'on') {
          message += `<li>Fecha de inicio: ${moment(session.startDate).format('DD/MM/YYYY hh:mm a')}<br>Duración: ${generalUtility.getDurationFormated(session.duration)}</li>`
        }
      })
      message += `</ul>`
      changes.push({
        message
      })
    }

    return changes
  }

  /**
   * Metodo que permite hacer borrar un registro
   * @param params Filtros para eliminar
   * @returns
   */
  public delete = async (params: ICourseSchedulingDetailDelete) => {
    try {
      const find: any = await CourseSchedulingDetails.findOne({ _id: params.id })
      if (!find) return responseUtility.buildResponseFailed('json', null, { error_key: 'course_scheduling.details.not_found' })

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
  public list = async (filters: ICourseSchedulingDetailQuery = {}) => {

    const paging = (filters.pageNumber && filters.nPerPage) ? true : false

    const pageNumber = filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage = filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let select = 'id course_scheduling course schedulingMode startDate endDate teacher number_of_sessions sessions duration'
    if (filters.select) {
      select = filters.select
    }

    let where = {}

    if (filters.course_scheduling) {
      where['course_scheduling'] = filters.course_scheduling
    }

    // if(filters.search){
    //   const search = filters.search
    //   where = {
    //     ...where,
    //     $or:[
    //       {observations: { $regex: '.*' + search + '.*',$options: 'i' }}
    //     ]
    //   }
    // }

    let registers = []
    try {
      registers = await CourseSchedulingDetails.find(where)
        .select(select)
        .populate({ path: 'course_scheduling', select: 'id moodle_id' })
        .populate({ path: 'course', select: 'id name code moodle_id' })
        .populate({ path: 'schedulingMode', select: 'id name moodle_id' })
        .populate({ path: 'teacher', select: 'id profile.first_name profile.last_name' })
        .skip(paging ? (pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0) : null)
        .limit(paging ? nPerPage : null)
        // .sort({ created_at: -1 })
        .lean()

      for await (const register of registers) {
        if (register.startDate) register.startDate = moment.utc(register.startDate).format('YYYY-MM-DD')
        if (register.endDate) register.endDate = moment.utc(register.endDate).format('YYYY-MM-DD')
        if (register.teacher && register.teacher.profile) {
          register.teacher.fullname = `${register.teacher.profile.first_name} ${register.teacher.profile.last_name}`
        }
        register.duration_formated = 0
        if (register.sessions && register.sessions.length > 0) {
          let total = 0
          register.sessions.map((session) => {
            total += session.duration
          })
          register.duration_formated = generalUtility.getDurationFormated(total)
        } else if (register.duration) {
          register.duration_formated = generalUtility.getDurationFormated(register.duration)
        }
      }
    } catch (e) { }

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        schedulings: [
          ...registers
        ],
        total_register: (paging) ? await CourseSchedulingDetails.find(where).count() : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    })
  }

}

export const courseSchedulingDetailsService = new CourseSchedulingDetailsService();
export { CourseSchedulingDetailsService as DefaultAdminCourseCourseSchedulingDetailsService };
