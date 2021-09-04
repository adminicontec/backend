// @import_dependencies_node Import libraries
const ObjectID = require('mongodb').ObjectID
import moment from 'moment'
// @end

// @import services
import { moodleCourseService } from '@scnode_app/services/default/moodle/course/moodleCourseService'
import { mailService } from "@scnode_app/services/default/general/mail/mailService";
// @end

// @import config
import { customs } from '@scnode_core/config/globals'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { generalUtility } from '@scnode_core/utilities/generalUtility';
import { i18nUtility } from "@scnode_core/utilities/i18nUtility";
import { htmlPdfUtility } from '@scnode_core/utilities/pdf/htmlPdfUtility'
// @end

// @import models
import { City, Country, Course, CourseScheduling, CourseSchedulingDetails, CourseSchedulingMode, CourseSchedulingStatus, CourseSchedulingType, Enrollment, Modular, Program, Regional, User } from '@scnode_app/models'
// @end

// @import types
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes'
import {
  ICourseScheduling,
  ICourseSchedulingDelete,
  ICourseSchedulingQuery,
  ICourseSchedulingReport
} from '@scnode_app/types/default/admin/course/courseSchedulingTypes'
// @end

class CourseSchedulingService {

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

      let select = 'id metadata schedulingMode modular program schedulingType schedulingStatus startDate endDate regional city country amountParticipants observations client duration in_design moodle_id hasCost priceCOP priceUSD discount startPublicationDate endPublicationDate enrollmentDeadline'
      if (params.query === QueryValues.ALL) {
        const registers: any = await CourseScheduling.find(where)
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
          // .populate({path: 'teacher', select: 'id profile.first_name profile.last_name'})
          .select(select)
          .lean()

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            schedulings: registers
          }
        })
      } else if (params.query === QueryValues.ONE) {
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
          // .populate({path: 'course', select: 'id name'})
          // .populate({path: 'teacher', select: 'id profile.first_name profile.last_name'})
          .select(select)
          .lean()

        if (!register) return responseUtility.buildResponseFailed('json', null, { error_key: 'course_scheduling.not_found' })

        if (register.metadata) {
          if (register.metadata.user) {
            register.metadata.user.fullname = `${register.metadata.user.profile.first_name} ${register.metadata.user.profile.last_name}`
          }
        }

        let total_scheduling = 0

        const detailSessions = await CourseSchedulingDetails.find({
          course_scheduling: register._id
        }).select('duration sessions')

        detailSessions.map((element) => {
          if (element.sessions.length === 0) {
            total_scheduling += parseInt(element.duration)
          } else {
            element.sessions.map((session) => {
              total_scheduling += parseInt(session.duration)
            })
          }
        })

        register.total_scheduling = total_scheduling

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
  public insertOrUpdate = async (params: ICourseScheduling) => {

    try {
      const user: any = await User.findOne({ _id: params.user }).select('id short_key')

      if (typeof params.in_design === "string") {
        if (params.in_design === "0") params.in_design = false
        if (params.in_design === "1") params.in_design = true
      }

      if (params.hasCost && typeof params.hasCost === 'string') params.hasCost = (params.hasCost === 'true') ? true : false

      if (params.schedulingMode && typeof params.schedulingMode !== "string" && params.schedulingMode.hasOwnProperty('value')) {
        params.schedulingMode = await this.saveLocalSchedulingMode(params.schedulingMode)
      }

      if (params.program && typeof params.program !== "string" && params.program.hasOwnProperty('value')) {
        params.program = await this.saveLocalProgram(params.program)
      }

      if (params.city) {
        const isObjectID = await ObjectID.isValid(params.city);

        if (!isObjectID) {
          const cityExists = await City.findOne({ name: params.city }).select('id').lean()
          if (!cityExists) {
            const response = await City.create({ name: params.city });
            params.city = response._id;
          } else {
            params.city = cityExists._id;
          }
        }
      }

      if (params.country === '') delete params.country

      if (params.id) {
        const register: any = await CourseScheduling.findOne({ _id: params.id }).lean()
        if (!register) return responseUtility.buildResponseFailed('json', null, { error_key: 'course_scheduling.not_found' })


        if (params.hasCost) {
          let hasParamsCost = false
          if (params.priceCOP) hasParamsCost = true
          if (params.priceUSD) hasParamsCost = true
          if (register.priceCOP) hasParamsCost = true
          if (register.priceUSD) hasParamsCost = true

          if (!hasParamsCost) return responseUtility.buildResponseFailed('json', null, {error_key: 'course.insertOrUpdate.cost_required'})
        } else {
          params.priceCOP = 0
          params.priceUSD = 0
        }

        const response: any = await CourseScheduling.findByIdAndUpdate(params.id, params, {
          useFindAndModify: false,
          new: true,
          lean: true,
        })
        await CourseSchedulingMode.populate(response, { path: 'schedulingMode', select: 'id name moodle_id' })
        await Modular.populate(response, { path: 'modular', select: 'id name' })
        await Program.populate(response, { path: 'program', select: 'id name moodle_id code' })
        await CourseSchedulingType.populate(response, { path: 'schedulingType', select: 'id name' })
        await CourseSchedulingStatus.populate(response, { path: 'schedulingStatus', select: 'id name' })
        await Regional.populate(response, { path: 'regional', select: 'id name' })
        await City.populate(response, { path: 'city', select: 'id name' })
        await Country.populate(response, { path: 'country', select: 'id name' })
        // await Course.populate(response, {path: 'course', select: 'id name'})
        // await User.populate(response, {path: 'teacher', select: 'id profile.first_name profile.last_name'})

        if ((params.sendEmail === true || params.sendEmail === 'true') && (response && response.schedulingStatus && response.schedulingStatus.name === 'Confirmado')) {
          await this.checkEnrollmentUsers(response)
          await this.checkEnrollmentTeachers(response)
        }

        var moodleCity = '';
        if (response.city) { moodleCity = response.city.name; }
        /*
        const moodleResponse: any = await moodleCourseService.update({
          //"id": `${response.program.code}_${service_id}`,
          "fullName": `${response.program.name}`,
          "masterId": `${response.program.moodle_id}`,
          "categoryId": `${response.regional.moodle_id}`,
          "startDate": `${response.startDate}`,
          "endDate": `${response.endDate}`,
          "customClassHours": `${generalUtility.getDurationFormatedForCertificate(params.duration)}`,
          "city": `${moodleCity}`,
          "country": `${response.country.name}`
        })

        if (moodleResponse.status === 'success') {

        }*/

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            scheduling: {
              ...response,
            }
          }
        })

      } else {

        if (params.hasCost && (params.hasCost === true) || (params.hasCost === 'true')) {
          let hasParamsCost = false
          if (params.priceCOP) hasParamsCost = true
          if (params.priceUSD) hasParamsCost = true

          if (!hasParamsCost) return responseUtility.buildResponseFailed('json', null, {error_key: 'course.insertOrUpdate.cost_required'})
        } else {
          params.priceCOP = 0
          params.priceUSD = 0
        }

        let service_id = ''

        if (user.short_key) {
          service_id += `${user.short_key}`
        }

        if (params.regional) {
          const regional = await Regional.findOne({ _id: params.regional }).select('id short_key')
          if (regional && regional.short_key) {
            service_id += `${regional.short_key}`
          }
        }

        const currentDate = moment()
        service_id += `${currentDate.format('YYMMDD')}`


        let countRegisters = await CourseScheduling.count()
        countRegisters += 1

        service_id += `${generalUtility.formatNumberWithZero(countRegisters, 4)}`

        params.metadata = {
          user: params.user,
          date: moment().format('YYYY-MM-DD'),
          service_id,
          year: moment().format('YYYY')
        }

        const { _id } = await CourseScheduling.create(params)
        const response: any = await CourseScheduling.findOne({ _id })
          .populate({ path: 'schedulingMode', select: 'id name moodle_id' })
          .populate({ path: 'modular', select: 'id name' })
          .populate({ path: 'program', select: 'id name moodle_id code' })
          .populate({ path: 'schedulingType', select: 'id name' })
          .populate({ path: 'schedulingStatus', select: 'id name' })
          .populate({ path: 'regional', select: 'id name moodle_id' })
          .populate({ path: 'city', select: 'id name' })
          .populate({ path: 'country', select: 'id name' })
          // .populate({path: 'course', select: 'id name'})
          // .populate({path: 'teacher', select: 'id profile.first_name profile.last_name'})
          .lean()

        var moodleCity = '';
        if (response.city) { moodleCity = response.city.name; }

        const moodleResponse: any = await moodleCourseService.createFromMaster({
          "shortName": `${response.program.code}_${service_id}`,
          "fullName": `${response.program.name}`,
          "masterId": `${response.program.moodle_id}`,
          "categoryId": `${response.regional.moodle_id}`,
          "startDate": `${response.startDate}`,
          "endDate": `${response.endDate}`,
          "customClassHours": `${generalUtility.getDurationFormatedForCertificate(params.duration)}`,
          "city": `${moodleCity}`,
          "country": `${response.country.name}`
        })

        if (moodleResponse.status === 'success') {
          if (moodleResponse.course && moodleResponse.course.id) {
            await CourseScheduling.findByIdAndUpdate(_id, { moodle_id: moodleResponse.course.id }, {
              useFindAndModify: false,
              new: true,
              lean: true,
            })

            if ((params.sendEmail === true || params.sendEmail === 'true') && (response && response.schedulingStatus && response.schedulingStatus.name === 'Confirmado')) {
              await this.checkEnrollmentUsers(response)
              await this.checkEnrollmentTeachers(response)
            }
          } else {
            await this.delete({ id: _id })
            return responseUtility.buildResponseFailed('json', null, { error_key: 'course_scheduling.insertOrUpdate.failed' })
          }
        } else {
          await this.delete({ id: _id })
          return responseUtility.buildResponseFailed('json', null, { error_key: 'course_scheduling.insertOrUpdate.failed' })
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
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que permite identificar si una modalidad ya fue creado de forma local
   * @param program Objeto de la modalidad
   * @returns
   */
  public saveLocalSchedulingMode = async (schedulingMode: {value: string | number, label: string}) => {
    let newSchedulingMode = null
    const schedulingModeLocal = await CourseSchedulingMode.findOne({
      moodle_id: schedulingMode.value
    }).select('id').lean()
    if (schedulingModeLocal) {
      newSchedulingMode = schedulingModeLocal._id
    } else {
      const newSchedulingModeLocal = await CourseSchedulingMode.create({
        name: schedulingMode.label,
        moodle_id: schedulingMode.value,
        short_key: schedulingMode.label.substr(0, 1)
      })
      if (newSchedulingModeLocal) {
        newSchedulingMode = newSchedulingModeLocal._id
      }
    }
    return newSchedulingMode
  }

  /**
   * Metodo que permite identificar si un programa ya fue creado de forma local
   * @param program Objeto del programa
   * @returns
   */
  public saveLocalProgram = async (program: {value: string | number, label: string}) => {

    let newProgram = null
    const programArr = program.label.toString().split('|')
    if (programArr[0] && programArr[1]) {
      const programLocal = await Program.findOne({
        moodle_id: program.value
      }).select('id').lean()
      if (programLocal) {
        newProgram = programLocal._id
      } else {
        const newprogramLocal = await Program.create({
          name: programArr[1].trim(),
          moodle_id: program.value,
          code: programArr[0].trim(),
        })
        if (newprogramLocal) {
          newProgram = newprogramLocal._id
        }
      }
    }
    return newProgram
  }

  /**
   * Metodo que permite buscar los usuarios matriculados y enviar un mensaje de bienvenida
   * @param courseScheduling Programa
   */
  private checkEnrollmentUsers = async (courseScheduling) => {

    const userEnrolled = await Enrollment.find({
      courseID: courseScheduling.moodle_id
    }).select('id user')
      .populate({ path: 'user', select: 'id email profile.first_name profile.last_name' })
      .lean()

    for await (const enrolled of userEnrolled) {
      await this.sendEnrollmentUserEmail([enrolled.user.email], {
        mailer: customs['mailer'],
        first_name: enrolled.user.profile.first_name,
        course_name: courseScheduling.program.name,
        course_start: moment.utc(courseScheduling.startDate).format('YYYY-MM-DD'),
        course_end: moment.utc(courseScheduling.endDate).format('YYYY-MM-DD'),
        type: 'student',
        notification_source: `course_start_${enrolled.user._id}_${courseScheduling._id}`,
        amount_notifications: 1
      })
    }
  }

  private checkEnrollmentTeachers = async (courseScheduling) => {
    const courses = await CourseSchedulingDetails.find({
      course_scheduling: courseScheduling._id
    }).select('id teacher')
      .populate({ path: 'teacher', select: 'id email profile.first_name profile.last_name' })
      .lean()

    for await (const course of courses) {
      await this.sendEnrollmentUserEmail([course.teacher.email], {
        mailer: customs['mailer'],
        first_name: course.teacher.profile.first_name,
        course_name: courseScheduling.program.name,
        course_start: moment.utc(courseScheduling.startDate).format('YYYY-MM-DD'),
        course_end: moment.utc(courseScheduling.endDate).format('YYYY-MM-DD'),
        type: 'teacher',
        notification_source: `course_start_${course.teacher._id}_${course._id}`,
        amount_notifications: 1
      })
    }
  }

  /**
   * Metodo que permite enviar emails de bienvenida a los usuarios
   * @param emails Emails a los que se va a enviar
   * @param paramsTemplate Parametros para construir el email
   * @returns
   */
  public sendEnrollmentUserEmail = async (emails: Array<string>, paramsTemplate: any) => {

    try {
      let path_template = 'user/enrollmentUser'
      if (paramsTemplate.type && paramsTemplate.type === 'teacher') {
        path_template = 'user/enrollmentTeacher'
      }

      const mail = await mailService.sendMail({
        emails,
        mailOptions: {
          subject: i18nUtility.__('mailer.enrollment_user.subject'),
          html_template: {
            path_layout: 'icontec',
            path_template: path_template,
            params: { ...paramsTemplate }
          },
          amount_notifications: (paramsTemplate.amount_notifications) ? paramsTemplate.amount_notifications : null
        },
        notification_source: paramsTemplate.notification_source
      })

      return mail

    } catch (e) {
      return responseUtility.buildResponseFailed('json', null)
    }
  }

  /**
   * Metodo que permite enviar email de desmatriculación a un usuario
   * @param email Email al usuario que desmatricula
   * @param paramsTemplate Parametros para construir el email
   */
  public sendUnenrollmentUserEmail = async (email: string, paramsTemplate: any) => {
    try {
      let path_template = 'user/unenrollmentUser'

      const mail = await mailService.sendMail({
        emails: [email],
        mailOptions: {
          subject: i18nUtility.__('mailer.unenrollment_user.subject'),
          html_template: {
            path_layout: 'icontec',
            path_template: path_template,
            params: { ...paramsTemplate }
          },
          amount_notifications: (paramsTemplate.amount_notifications) ? paramsTemplate.amount_notifications : null
        },
        notification_source: paramsTemplate.notification_source
      })

      return mail

    } catch (e) {
      return responseUtility.buildResponseFailed('json', null)
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

    const pageNumber = filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage = filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let select = 'id metadata schedulingMode modular program schedulingType schedulingStatus startDate endDate regional city country amountParticipants observations client duration in_design moodle_id hasCost priceCOP priceUSD discount startPublicationDate endPublicationDate enrollmentDeadline'
    if (filters.select) {
      select = filters.select
    }

    let where = {}

    if (filters.search) {
      const search = filters.search
      where = {
        ...where,
        $or: [
          { observations: { $regex: '.*' + search + '.*', $options: 'i' } }
        ]
      }
    }

    if (filters.service_id) {
      where['metadata.service_id'] = {$regex: '.*' + filters.service_id + '.*', $options: 'i'}
    }

    if (filters.course_scheduling_code) {
      const programs = await Program.find({ code: { $regex: '.*' + filters.course_scheduling_code + '.*', $options: 'i' } }).select('id')
      const program_ids = programs.reduce((accum, element) => {
        accum.push(element._id)
        return accum
      }, [])
      where['program'] = { $in: program_ids }
    }

    if (filters.schedulingType) where['schedulingType'] = filters.schedulingType
    if (filters.schedulingStatus) where['schedulingStatus'] = filters.schedulingStatus
    if (filters.schedulingMode) where['schedulingMode'] = filters.schedulingMode
    if (filters.regional) where['regional'] = filters.regional
    if (filters.client) where['client'] = {$regex: '.*' + filters.client + '.*', $options: 'i'}


    // if (filters.user) {
      // where['metadata.user'] = filters.user
    // }

    let registers = []
    try {
      registers = await CourseScheduling.find(where)
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
        // .populate({path: 'teacher', select: 'id profile.first_name profile.last_name'})
        .skip(paging ? (pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0) : null)
        .limit(paging ? nPerPage : null)
        // .sort({ created_at: -1 })
        .lean()

      for await (const register of registers) {
        if (register.startDate) register.startDate = moment.utc(register.startDate).format('YYYY-MM-DD')
        if (register.endDate) register.endDate = moment.utc(register.endDate).format('YYYY-MM-DD')
        if (register.metadata) {
          if (register.metadata.user) {
            register.metadata.user.fullname = `${register.metadata.user.profile.first_name} ${register.metadata.user.profile.last_name}`
          }
        }
        // if (register.teacher && register.teacher.profile) {
        //   register.teacher.fullname = `${register.teacher.profile.first_name} ${register.teacher.profile.last_name}`
        // }
      }
    } catch (e) { }

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

  /**
   * Metodo que permite generar un reporte en PDF
   * @param params
   * @returns
   */
  public generatePdfReport = async (params: ICourseSchedulingReport) => {

    try {
      let select = 'id metadata schedulingMode modular program schedulingType schedulingStatus startDate endDate regional city country amountParticipants observations client duration in_design moodle_id'

      let where = {
        _id: params.course_scheduling
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
        // .populate({path: 'course', select: 'id name'})
        // .populate({path: 'teacher', select: 'id profile.first_name profile.last_name'})
        .select(select)
        .lean()

      if (!register) return responseUtility.buildResponseFailed('json', null, { error_key: 'course_scheduling.not_found' })

      let total_scheduling = 0
      let courses = []

      const detailSessions = await CourseSchedulingDetails.find({
        course_scheduling: register._id
      }).select('id course_scheduling course schedulingMode startDate endDate teacher number_of_sessions sessions duration')
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

        if (element.sessions.length === 0) {
          total_scheduling += parseInt(element.duration)

          let item = {
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

          courses.push(item)
        } else {
          element.sessions.map((session) => {
            total_scheduling += parseInt(session.duration)

            let row_content = {
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
            if (first_session) {
              item = { ...item, ...row_content, ...session_data }
            } else {
              item = { ...item, ...session_data }
            }
            session_count++
            first_session = false
            courses.push(item)
          })
        }

      })

      let scheduling_free = register.duration
      if (total_scheduling < register.duration) {
        scheduling_free = register.duration - total_scheduling
      } else if (total_scheduling >= register.duration) {
        scheduling_free = 0
      }

      let path = '/admin/course/courseSchedulingReport'
      if (['Virtual'].includes(register.schedulingMode.name)) {
        path = '/admin/course/courseSchedulingVirtualReport'
      }

      const responsePdf = await htmlPdfUtility.generatePdf({
        from: 'file',
        file: {
          path,
          type: 'hbs',
          context: {
            program_name: (register.program && register.program.name) ? register.program.name : '',
            service_id: (register.metadata && register.metadata.service_id) ? register.metadata.service_id : '',
            regional_name: (register.regional && register.regional.name) ? register.regional.name : '',
            cliente_name: (register.client) ? register.client : '',
            schedule_mode: (register.schedulingMode && register.schedulingMode.name) ? register.schedulingMode.name : '',
            service_city: (register.city && register.city.name) ? register.city.name : '',
            courses: courses,
            total_scheduling: (total_scheduling) ? generalUtility.getDurationFormated(total_scheduling) : '0h',
            scheduling_free: (scheduling_free) ? generalUtility.getDurationFormated(scheduling_free) : '0h',
            observations: (register.observations) ? register.observations : '',
          }
        },
        to_file: {
          file: {
            name: `${register.metadata.service_id}_${register.program.code}.pdf`,
          },
          path: 'admin/course/courseSchedulingReport'
        },
        options: {
          // orientation: "landscape",
          format: "Tabloid",
          border: {
            top: "15mm",            // default is 0, units: mm, cm, in, px
            right: "15mm",
            bottom: "12mm",
            left: "15mm"
          },
          "footer": {
            "height": "10mm",
            "contents": {
              // first: 'Cover page',
              // 2: 'Second page', // Any page number is working. 1-based index
              default: '<div style="font-size:0.8rem"><span >{{page}}</span>/<span>{{pages}}</span></div>', // fallback value
              // last: 'Last Page'
            }
          }
        },
      })

      if (responsePdf.status === 'error') return responsePdf

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          path: responsePdf.path
        }
      })
    } catch (error) {
      return responseUtility.buildResponseFailed('json')
    }
  }

}

export const courseSchedulingService = new CourseSchedulingService();
export { CourseSchedulingService as DefaultAdminCourseCourseSchedulingService };
