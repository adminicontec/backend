// @import_dependencies_node Import libraries
import * as XLSX from "xlsx";
const ObjectID = require('mongodb').ObjectID
import moment from 'moment'
// @end

// @import services
import { moodleCourseService } from '@scnode_app/services/default/moodle/course/moodleCourseService'
import { mailService } from "@scnode_app/services/default/general/mail/mailService";
import { uploadService } from '@scnode_core/services/default/global/uploadService'
// @end

// @import config
import { customs } from '@scnode_core/config/globals'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { generalUtility } from '@scnode_core/utilities/generalUtility';
import { i18nUtility } from "@scnode_core/utilities/i18nUtility";
import { htmlPdfUtility } from '@scnode_core/utilities/pdf/htmlPdfUtility'
import { xlsxUtility } from '@scnode_core/utilities/xlsx/xlsxUtility'
// @end

// @import models
import { City, Company, Country, Course, CourseScheduling, CourseSchedulingDetails, CourseSchedulingMode, CourseSchedulingStatus, CourseSchedulingType, Enrollment, Modular, Program, Regional, Role, User } from '@scnode_app/models'
// @end

// @import types
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes'
import {
  ICourseScheduling,
  ICourseSchedulingDelete,
  ICourseSchedulingQuery,
  ICourseSchedulingReport,
  ICourseSchedulingReportData
} from '@scnode_app/types/default/admin/course/courseSchedulingTypes'
import { Console } from "console";
// @end

class CourseSchedulingService {

  private default_icon_path = 'certificate/icons';

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

      let select = 'id metadata schedulingMode schedulingModeDetails modular program schedulingType schedulingStatus startDate endDate regional regional_transversal city country amountParticipants observations client duration in_design moodle_id hasCost priceCOP priceUSD discount startPublicationDate endPublicationDate enrollmentDeadline endDiscountDate account_executive certificate_clients certificate_students certificate english_certificate scope english_scope certificate_icon_1 certificate_icon_2 certificate_icon_3'
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
          .populate({path: 'account_executive', select: 'id profile.first_name profile.last_name'})
          .populate({path: 'client', select: 'id name'})
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
          .populate({path: 'account_executive', select: 'id profile.first_name profile.last_name'})
          .populate({path: 'client', select: 'id name'})
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

        if (register.certificate_icon_1) {
          register.certificate_icon_1 = this.getIconUrl(register.certificate_icon_1)
        }

        if (register.certificate_icon_2) {
          register.certificate_icon_2 = this.getIconUrl(register.certificate_icon_2)
        }

        if (register.certificate_icon_3) {
          register.certificate_icon_3 = this.getIconUrl(register.certificate_icon_3)
        }

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
  public insertOrUpdate = async (params: ICourseScheduling, files?: any) => {

    let steps = [];
    try {
      const user: any = await User.findOne({ _id: params.user }).select('id short_key')
      steps.push('1')
      if (typeof params.in_design === "string") {
        if (params.in_design === "0") params.in_design = false
        if (params.in_design === "1") params.in_design = true
      }
      steps.push('2')
      if (params.hasCost && Array.isArray(params.hasCost)) delete params.hasCost;
      if (params.hasCost && typeof params.hasCost === 'string') params.hasCost = (params.hasCost === 'true') ? true : false

      if (params.schedulingMode && typeof params.schedulingMode !== "string" && params.schedulingMode.hasOwnProperty('value')) {
        params.schedulingMode = await this.saveLocalSchedulingMode(params.schedulingMode, params.schedulingModeDetails)
      }
      steps.push('3')

      if (params.program && typeof params.program !== "string" && params.program.hasOwnProperty('value')) {
        params.program = await this.saveLocalProgram(params.program)
      }
      steps.push('4')

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
      steps.push('5')
      if (params.country === '') delete params.country

      steps.push('6')
      steps.push(params)

      if (files && files.icon_1_file && typeof files.icon_1_file === 'object') {
        const response_upload: any = await uploadService.uploadFile(files.icon_1_file, this.default_icon_path);
        if (response_upload.status === 'error') return response_upload;
        if (response_upload.hasOwnProperty('name')) params.certificate_icon_1 = response_upload.name
      }

      if (files && files.icon_2_file && typeof files.icon_2_file === 'object') {
        const response_upload: any = await uploadService.uploadFile(files.icon_2_file, this.default_icon_path);
        if (response_upload.status === 'error') return response_upload;
        if (response_upload.hasOwnProperty('name')) params.certificate_icon_2 = response_upload.name
      }

      if (files && files.icon_3_file && typeof files.icon_3_file === 'object') {
        const response_upload: any = await uploadService.uploadFile(files.icon_3_file, this.default_icon_path);
        if (response_upload.status === 'error') return response_upload;
        if (response_upload.hasOwnProperty('name')) params.certificate_icon_3 = response_upload.name
      }

      if (params.id) {
        let visibleAtMoodle = 0;
        const register: any = await CourseScheduling.findOne({ _id: params.id })
          .populate({ path: 'schedulingStatus', select: 'id name' })
          .lean()
        if (!register) return responseUtility.buildResponseFailed('json', null, { error_key: 'course_scheduling.not_found' })
        const prevSchedulingStatus = (register && register.schedulingStatus && register.schedulingStatus.name) ? register.schedulingStatus.name : null
        const changes = this.validateChanges(params, register)

        if (params.hasCost) {
          let hasParamsCost = false
          if (params.priceCOP) hasParamsCost = true
          if (params.priceUSD) hasParamsCost = true
          if (register.priceCOP) hasParamsCost = true
          if (register.priceUSD) hasParamsCost = true

          if (!hasParamsCost) return responseUtility.buildResponseFailed('json', null, { error_key: 'course.insertOrUpdate.cost_required' })
        } else {
          params.priceCOP = 0
          params.priceUSD = 0
        }
        if (!params.discount || params.discount && params.discount === 0) params.endDiscountDate = null;

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
        await Regional.populate(response, { path: 'regional', select: 'id name moodle_id' })
        await User.populate(response, {path: 'account_executive', select: 'id profile.first_name profile.last_name email'})
        await City.populate(response, { path: 'city', select: 'id name' })
        await Country.populate(response, { path: 'country', select: 'id name' })
        await User.populate(response, { path: 'metadata.user', select: 'id profile.first_name profile.last_name email' })
        await Company.populate(response, { path: 'client', select: 'id name'})
        // await Course.populate(response, {path: 'course', select: 'id name'})
        // await User.populate(response, {path: 'teacher', select: 'id profile.first_name profile.last_name'})

        if (params.sendEmail === true || params.sendEmail === 'true') {
          if (response && response.schedulingStatus && response.schedulingStatus.name === 'Confirmado') {
            // if (response && response.schedulingStatus && response.schedulingStatus.name === 'Confirmado' && prevSchedulingStatus === 'Programado') {
            await this.checkEnrollmentUsers(response)
            await this.checkEnrollmentTeachers(response)
            await this.serviceSchedulingNotification(response)
            visibleAtMoodle = 1;
          }
          if (response && response.schedulingStatus && response.schedulingStatus.name === 'Confirmado' && prevSchedulingStatus === 'Confirmado') {
            if (changes.length > 0) {
              await this.sendServiceSchedulingUpdated(response, changes);
            }
            visibleAtMoodle = 1;
          }
          if (response && response.schedulingStatus && response.schedulingStatus.name === 'Cancelado' && prevSchedulingStatus === 'Confirmado') {
            await this.serviceSchedulingCancelled(response)
            visibleAtMoodle = 1;
          }
        }

        let regional = null;
        if (response) {
          if (response.regional && response.regional.moodle_id) {
            regional = response.regional.moodle_id;
          } else if (response.regional_transversal) {
            regional = response.regional_transversal;
          }
        }

        var moodleCity = '';
        if (response.city) { moodleCity = response.city.name; }
        console.log("update Program on moodle:");

        const moodleResponse: any = await moodleCourseService.update({
          "id": `${response.moodle_id}`,
          "categoryId": `${regional}`,
          "startDate": `${response.startDate}`,
          "endDate": `${response.endDate}`,
          "customClassHours": `${generalUtility.getDurationFormatedForCertificate(params.duration)}`,
          "city": `${moodleCity}`,
          "country": `${response.country.name}`,
          "visible": visibleAtMoodle
        });

        if (moodleResponse.status === 'success') {
          console.log("update Programa Success!");
        }
        else {
          console.log("Error!");
        }

        if (response.certificate_icon_1) {
          response.certificate_icon_1 = this.getIconUrl(response.certificate_icon_1)
        }

        if (response.certificate_icon_2) {
          response.certificate_icon_2 = this.getIconUrl(response.certificate_icon_2)
        }

        if (response.certificate_icon_3) {
          response.certificate_icon_3 = this.getIconUrl(response.certificate_icon_3)
        }

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            scheduling: {
              ...response,
            }
          }
        })

      } else {
        steps.push('7')
        if (params.hasCost && (params.hasCost === true) || (params.hasCost === 'true')) {
          let hasParamsCost = false
          if (params.priceCOP) hasParamsCost = true
          if (params.priceUSD) hasParamsCost = true

          if (!hasParamsCost) return responseUtility.buildResponseFailed('json', null, { error_key: 'course.insertOrUpdate.cost_required' })
        } else {
          params.priceCOP = 0
          params.priceUSD = 0
        }
        steps.push('8')
        if (!params.discount || params.discount && params.discount === 0) params.endDiscountDate = null;

        let service_id = ''
        steps.push('9')
        if (user.short_key) {
          service_id += `${user.short_key}`
        }
        steps.push('10')
        if (params.regional) {
          const regional = await Regional.findOne({ _id: params.regional }).select('id short_key')
          if (regional && regional.short_key) {
            service_id += `${regional.short_key}`
          }
        }
        steps.push('11')
        const currentDate = moment()
        service_id += `${currentDate.format('YYMMDD')}`
        steps.push('12')

        let countRegisters = await CourseScheduling.count()
        countRegisters += 1
        steps.push('13')
        service_id += `${generalUtility.formatNumberWithZero(countRegisters, 4)}`
        steps.push('14')
        steps.push(service_id)

        params.metadata = {
          user: params.user,
          date: moment().format('YYYY-MM-DD'),
          service_id,
          year: moment().format('YYYY')
        }
        steps.push('15')
        steps.push(params)

        const { _id } = await CourseScheduling.create(params)
        steps.push('16')
        steps.push(_id)
        const response: any = await CourseScheduling.findOne({ _id })
          .populate({ path: 'schedulingMode', select: 'id name moodle_id' })
          .populate({ path: 'modular', select: 'id name' })
          .populate({ path: 'program', select: 'id name moodle_id code' })
          .populate({ path: 'schedulingType', select: 'id name' })
          .populate({ path: 'schedulingStatus', select: 'id name' })
          .populate({ path: 'regional', select: 'id name moodle_id' })
          .populate({ path: 'account_executive', select: 'id profile.first_name profile.last_name email' })
          .populate({ path: 'city', select: 'id name' })
          .populate({ path: 'country', select: 'id name' })
          .populate({ path: 'metadata.user', select: 'id profile.first_name profile.last_name email' })
          .populate({ path: 'client', select: 'id name'})
          // .populate({path: 'course', select: 'id name'})
          // .populate({path: 'teacher', select: 'id profile.first_name profile.last_name'})
          .lean()
        steps.push('17')
        steps.push(response)

        var moodleCity = '';
        if (response.city) { moodleCity = response.city.name; }
        steps.push('18')
        let regional = null;
        if (response) {
          steps.push('19')
          if (response.regional && response.regional.moodle_id) {
            steps.push('20-1')
            regional = response.regional.moodle_id;
          } else if (response.regional_transversal) {
            steps.push('20-2')
            regional = response.regional_transversal;
          }
        }
        steps.push(regional)
        steps.push('21')
        const paramsMoodle = {
          "shortName": `${response.program.code}_${service_id}`,
          "fullName": `${response.program.name}`,
          "masterId": `${response.program.moodle_id}`,
          "categoryId": `${regional}`,
          "startDate": `${response.startDate}`,
          "endDate": `${response.endDate}`,
          "customClassHours": `${generalUtility.getDurationFormatedForCertificate(params.duration)}`,
          "city": `${moodleCity}`,
          "country": `${response.country.name}`
        }
        steps.push(paramsMoodle)

        if (!params.disabledCreateMasterMoodle) {
          steps.push('22')
          const moodleResponse: any = await moodleCourseService.createFromMaster(paramsMoodle)
          steps.push(moodleResponse)
          if (moodleResponse.status === 'success') {
            steps.push('23')
            if (moodleResponse.course && moodleResponse.course.id) {
              steps.push('24')
              await CourseScheduling.findByIdAndUpdate(_id, { moodle_id: moodleResponse.course.id }, {
                useFindAndModify: false,
                new: true,
                lean: true,
              })
              steps.push('25')
              if ((params.sendEmail === true || params.sendEmail === 'true') && (response && response.schedulingStatus && response.schedulingStatus.name === 'Confirmado')) {
                steps.push('26')
                await this.checkEnrollmentUsers(response)
                await this.checkEnrollmentTeachers(response)
                await this.serviceSchedulingNotification(response)
              }
            } else {
              steps.push('24-b')
              await this.delete({ id: _id })
              return responseUtility.buildResponseFailed('json', null, {
                error_key: 'course_scheduling.insertOrUpdate.failed', additional_parameters: {
                  steps
                }
              })
            }
          } else {
            await this.delete({ id: _id })
            return responseUtility.buildResponseFailed('json', null, {
              error_key: 'course_scheduling.insertOrUpdate.failed', additional_parameters: {
                steps
              }
            })
          }
        } else {
          steps.push('22-b')
          if ((params.sendEmail === true || params.sendEmail === 'true') && (response && response.schedulingStatus && response.schedulingStatus.name === 'Confirmado')) {
            steps.push('26')
            await this.checkEnrollmentUsers(response)
            await this.checkEnrollmentTeachers(response)
            await this.serviceSchedulingNotification(response)
          }
        }

        if (response.certificate_icon_1) {
          response.certificate_icon_1 = this.getIconUrl(response.certificate_icon_1)
        }

        if (response.certificate_icon_2) {
          response.certificate_icon_2 = this.getIconUrl(response.certificate_icon_2)
        }

        if (response.certificate_icon_3) {
          response.certificate_icon_3 = this.getIconUrl(response.certificate_icon_3)
        }

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            scheduling: {
              ...response,
            },
            steps
          }
        })
      }

    } catch (e) {
      steps.push('25')
      steps.push(e)
      console.log('Error: ', e);
      return responseUtility.buildResponseFailed('json', null, {
        additional_parameters: {
          steps
        }
      })
    }
  }

  /**
   * Metodo que permite identificar si una modalidad ya fue creado de forma local
   * @param program Objeto de la modalidad
   * @returns
   */
  public saveLocalSchedulingMode = async (schedulingMode: { value: string | number, label: string }, schedulingModeDetails: 'in_situ' | 'online' | null) => {
    let newSchedulingMode = null
    let where = {
      moodle_id: schedulingMode.value
    }
    if (schedulingModeDetails) {
      where['schedulingModeDetails'] = schedulingModeDetails
      if (schedulingModeDetails === 'in_situ') {
        schedulingMode.label = 'Presencial';
      } else if (schedulingModeDetails === 'online') {
        schedulingMode.label = 'En linea';
      }
    }
    const schedulingModeLocal = await CourseSchedulingMode.findOne(where)
      .select('id')
      .lean()

    if (schedulingModeLocal) {
      newSchedulingMode = schedulingModeLocal._id
    } else {
      const newSchedulingModeLocal = await CourseSchedulingMode.create({
        name: schedulingMode.label,
        moodle_id: schedulingMode.value,
        short_key: schedulingMode.label.substr(0, 1),
        schedulingModeDetails: (schedulingModeDetails) ? schedulingModeDetails : null
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
  public saveLocalProgram = async (program: { value: string | number, label: string }) => {

    let newProgram = null
    const programArr = program.label.toString().split('|')
    if (programArr[0] && programArr[1]) {
      const programLocal = await Program.findOne({
        moodle_id: program.value,
        code: programArr[0].trim(),
      }).select('id').lean()
      if (programLocal) {
        await Program.findByIdAndUpdate(programLocal._id, {
          name: programArr[1].trim(),
        }, { useFindAndModify: false, new: true })
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
        observations: courseScheduling.observations,
        type: 'student',
        notification_source: `course_start_${enrolled.user._id}_${courseScheduling._id}`,
        amount_notifications: 1
      })
    }
  }

  public checkEnrollmentTeachers = async (courseScheduling, teacher?: string, amount_notifications: number | null = 1) => {
    const courses = await CourseSchedulingDetails.find({
      course_scheduling: courseScheduling._id
    }).select('id startDate endDate duration course sessions teacher')
      .populate({ path: 'course', select: 'id name code' })
      .populate({ path: 'teacher', select: 'id email profile.first_name profile.last_name' })
      .lean()

    let notificationsByTeacher = {}

    for await (const course of courses) {
      if (!notificationsByTeacher[course.teacher._id] && (!teacher || (teacher && teacher.toString() === course.teacher._id.toString()))) {
        notificationsByTeacher[course.teacher._id] = {
          teacher: {
            _id: course.teacher._id,
            email: course.teacher.email,
            first_name: course.teacher.profile.first_name,
          },
          program: {
            _id: courseScheduling.program._id,
            course_scheduling_id: courseScheduling._id,
            name: courseScheduling.program.name,
            observations: courseScheduling.observations,
            client: (courseScheduling.client?.name) ? courseScheduling.client?.name : '-',
            city: (courseScheduling.city && courseScheduling.city.name) ? courseScheduling.city.name : '-',
            scheduling_mode: (courseScheduling.schedulingMode && courseScheduling.schedulingMode.name) ? courseScheduling.schedulingMode.name : '-',
            // course_code: (course.course && course.course.code) ? course.course.code : '',
            // course_name: (course.course && course.course.name) ? course.course.name : '',
          },
          service: {
            service_id: courseScheduling.metadata.service_id,
          },
          courses: [],
          has_sessions: (course.sessions.length > 0) ? true : false,
        }
      }

      if (course.sessions.length === 0) {

        let item = {
          // client: (courseScheduling.client) ? courseScheduling.client : '-',
          // city: (courseScheduling.city && courseScheduling.city.name) ? courseScheduling.city.name : '-',
          // scheduling_mode: (courseScheduling.schedulingMode && courseScheduling.schedulingMode.name) ? courseScheduling.schedulingMode.name : '-',
          course_code: (course.course && course.course.code) ? course.course.code : '',
          course_name: (course.course && course.course.name) ? course.course.name : '',
          info: {
            start_date: (course.startDate) ? moment.utc(course.startDate).format('DD/MM/YYYY') : '',
            end_date: (course.endDate) ? moment.utc(course.endDate).format('DD/MM/YYYY') : '',
            duration: (course.duration) ? generalUtility.getDurationFormated(course.duration) : '0h',
            schedule: '-',
          }
        }
        if (notificationsByTeacher[course.teacher._id]) {
          notificationsByTeacher[course.teacher._id].courses.push(item)
        }
      } else {
        let item = {
          // client: (courseScheduling.client) ? courseScheduling.client : '',
          // city: (courseScheduling.city && courseScheduling.city.name) ? courseScheduling.city.name : '',
          // scheduling_mode: (courseScheduling.schedulingMode && courseScheduling.schedulingMode.name) ? courseScheduling.schedulingMode.name : '',
          course_code: (course.course && course.course.code) ? course.course.code : '',
          course_name: (course.course && course.course.name) ? course.course.name : '',
          sessions: []
        }
        course.sessions.map((session) => {
          let schedule = ''
          if (session.startDate && session.duration) {
            let endDate = moment(session.startDate).add(session.duration, 'seconds')
            schedule += `${moment(session.startDate).format('hh:mm a')} a ${moment(endDate).format('hh:mm a')}`
          }
          let session_data = {
            start_date: (session.startDate) ? moment.utc(session.startDate).format('DD/MM/YYYY') : '',
            duration: (session.duration) ? generalUtility.getDurationFormated(session.duration) : '0h',
            schedule: schedule,
          }
          item.sessions.push({ ...session_data })
        })
        if (notificationsByTeacher[course.teacher._id]) {
          notificationsByTeacher[course.teacher._id].courses.push(item)
        }
      }
    }


    for (const key in notificationsByTeacher) {
      if (Object.prototype.hasOwnProperty.call(notificationsByTeacher, key)) {
        const teacherData = notificationsByTeacher[key];
        await this.sendEnrollmentUserEmail([teacherData.teacher.email], {
          mailer: customs['mailer'],
          teacher: teacherData.teacher,
          program: teacherData.program,
          service: teacherData.service,
          courses: teacherData.courses,
          has_sessions: teacherData.has_sessions,
          type: 'teacher',
          notification_source: `program_confirmed_${teacherData.teacher._id}_${teacherData.program.course_scheduling_id}`,
          amount_notifications: amount_notifications ? amount_notifications : null
        })
      }
    }
  }

  private serviceSchedulingNotification = async (courseScheduling) => {
    let email_to_notificate = []
    const serviceScheduler = (courseScheduling.metadata && courseScheduling.metadata.user) ? courseScheduling.metadata.user : null
    if (serviceScheduler) {
      email_to_notificate.push(serviceScheduler.email)
    }

    const role = await Role.findOne({ name: 'logistics_assistant' }).select('id')
    if (role) {
      const users = await User.find({ roles: { $in: [role._id] } }).select('id email')
      if (users.length > 0) {
        users.map((user: any) => email_to_notificate.push(user.email))
      }
    }
    if (email_to_notificate.length > 0) {
      await this.sendSchedulingNotificationEmail(email_to_notificate, {
        mailer: customs['mailer'],
        service_id: courseScheduling.metadata.service_id,
        program_name: courseScheduling.program.name,
        today: moment().format('YYYY-MM-DD'),
        notification_source: `scheduling_notification_${courseScheduling._id}`,
        amount_notifications: 1
      })

    }
  }

  private serviceSchedulingCancelled = async (courseScheduling) => {
    let email_to_notificate = []
    const userEnrolled = await Enrollment.find({
      courseID: courseScheduling.moodle_id
    }).select('id user')
      .populate({ path: 'user', select: 'id email profile.first_name profile.last_name' })
      .lean()

    for await (const enrolled of userEnrolled) {
      email_to_notificate.push(enrolled.user.email.toString())
    }

    const courses = await CourseSchedulingDetails.find({
      course_scheduling: courseScheduling._id
    }).select('id startDate endDate duration course sessions teacher')
      .populate({ path: 'course', select: 'id name code' })
      .populate({ path: 'teacher', select: 'id email profile.first_name profile.last_name' })
      .lean()

    for await (const course of courses) {
      if (!email_to_notificate.includes(course.teacher.email.toString())) {
        email_to_notificate.push(course.teacher.email.toString())
      }
    }

    if (email_to_notificate.length > 0) {
      await this.sendServiceSchedulingCancelled(email_to_notificate, {
        mailer: customs['mailer'],
        service_id: courseScheduling.metadata.service_id,
        program_name: courseScheduling.program.name,
        today: moment().format('YYYY-MM-DD'),
        notification_source: `scheduling_notification_cancelled_${courseScheduling._id}`,
        amount_notifications: 1
      })

    }
  }

  private validateChanges = (params: ICourseScheduling, register: typeof CourseScheduling) => {
    const changes = []
    if ((register.startDate && params.startDate) && `${params.startDate}T00:00:00.000Z` !== register.startDate.toISOString()) {
      changes.push({
        message: `<div>La fecha de inicio del programa ha cambiado de ${moment(register.startDate.toISOString().replace('T00:00:00.000Z', '')).format('YYYY-MM-DD')} a ${params.startDate}</div>`
      })
    }
    if ((register.endDate && params.endDate) && `${params.endDate}T00:00:00.000Z` !== register.endDate.toISOString()) {
      changes.push({
        message: `<div>La fecha de fin del programa ha cambiado de ${moment(register.endDate.toISOString().replace('T00:00:00.000Z', '')).format('YYYY-MM-DD')} a ${params.endDate}</div>`
      })
    }
    // if ((register.duration && params.duration) && params.duration !== register.duration) {
    //   changes.push({
    //     message: `La duración del curso ha cambiado a ${generalUtility.getDurationFormated(register.duration)}`
    //   })
    // }
    return changes
  }

  private sendServiceSchedulingUpdated = async (courseScheduling, changes) => {
    let email_to_notificate = []
    const userEnrolled = await Enrollment.find({
      courseID: courseScheduling.moodle_id
    }).select('id user')
      .populate({ path: 'user', select: 'id email profile.first_name profile.last_name' })
      .lean()

    for await (const enrolled of userEnrolled) {
      email_to_notificate.push(enrolled.user.email.toString())
    }

    const courses = await CourseSchedulingDetails.find({
      course_scheduling: courseScheduling._id
    }).select('id startDate endDate duration course sessions teacher')
      .populate({ path: 'course', select: 'id name code' })
      .populate({ path: 'teacher', select: 'id email profile.first_name profile.last_name' })
      .lean()

    for await (const course of courses) {
      if (!email_to_notificate.includes(course.teacher.email.toString())) {
        email_to_notificate.push(course.teacher.email.toString())
      }
    }

    if (email_to_notificate.length > 0) {
      await this.serviceSchedulingUpdated(email_to_notificate, {
        mailer: customs['mailer'],
        service_id: courseScheduling.metadata.service_id,
        program_name: courseScheduling.program.name,
        notification_source: `course_updated_${courseScheduling._id}`,
        changes
      })

    }
  }

  public serviceSchedulingUpdated = async (emails: Array<string>, paramsTemplate: any) => {
    try {
      let path_template = 'course/schedulingUpdate'

      const mail = await mailService.sendMail({
        emails,
        mailOptions: {
          subject: i18nUtility.__('mailer.scheduling_update.subject'),
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
          subject: (paramsTemplate.subject) ? paramsTemplate.subject : i18nUtility.__('mailer.enrollment_user.subject'),
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
      if (paramsTemplate.type && paramsTemplate.type === 'teacher') {
        path_template = 'user/unenrollmentTeacher'
      }

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
   * Metodo que permite enviar emails de bienvenida a los usuarios
   * @param emails Emails a los que se va a enviar
   * @param paramsTemplate Parametros para construir el email
   * @returns
   */
  public sendSchedulingNotificationEmail = async (emails: Array<string>, paramsTemplate: any) => {

    try {
      const path_template = 'course/schedulingNotification'

      const mail = await mailService.sendMail({
        emails,
        mailOptions: {
          subject: i18nUtility.__('mailer.scheduling_notification.subject'),
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

  public sendServiceSchedulingCancelled = async (emails: Array<string>, paramsTemplate: any) => {

    try {
      const path_template = 'course/programCancelled'

      const mail = await mailService.sendMail({
        emails,
        mailOptions: {
          subject: i18nUtility.__('mailer.scheduling_cancelled_notification.subject'),
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

    let select = 'id metadata schedulingMode schedulingModeDetails modular program schedulingType schedulingStatus startDate endDate regional regional_transversal city country amountParticipants observations client duration in_design moodle_id hasCost priceCOP priceUSD discount startPublicationDate endPublicationDate enrollmentDeadline endDiscountDate account_executive certificate_clients certificate_students certificate english_certificate scope english_scope certificate_icon_1 certificate_icon_2 certificate_icon_3'
    if (filters.select) {
      select = filters.select
    }

    let where: object[] = []

    if (filters.search) {
      const search = filters.search
      where.push({
        $match: {
          $or: [
            { observations: { $regex: '.*' + search + '.*', $options: 'i' } }
          ]
        }
      })
    }

    if (filters.service_id) {
      where.push({
        $match: {
          'metadata.service_id': { $regex: '.*' + filters.service_id + '.*', $options: 'i' }
        }
      })
    }

    if (filters.course_scheduling_code) {
      const programs = await Program.find({ code: { $regex: '.*' + filters.course_scheduling_code + '.*', $options: 'i' } }).select('id')
      const program_ids = programs.reduce((accum, element) => {
        accum.push(element._id)
        return accum
      }, [])
      where.push({
          $match: {
            program: { $in: program_ids.map((p) => ObjectID(p)) }
          }
      })
    }

    if (filters.schedulingType) where.push({$match: {schedulingType: ObjectID(filters.schedulingType)}})
    if (filters.schedulingStatus) where.push({$match: {schedulingStatus: ObjectID(filters.schedulingStatus)}})
    if (filters.schedulingMode) where.push({$match: {schedulingMode: ObjectID(filters.schedulingMode)}})
    if (filters.regional) where.push({$match: {regional: ObjectID(filters.regional)}})
    // if (filters.client) where.push({$match: {client: { $regex: '.*' + filters.client + '.*', $options: 'i' }}})
    if (filters.client) {
      const companies = await Company.find({name: { $regex: '.*' + filters.client + '.*', $options: 'i' }}).select('id name')
      const company_ids = companies.reduce((accum, element) => {
        accum.push(element._id)
        return accum
      }, [])
      where.push({
          $match: {
            client: { $in: company_ids.map((p) => ObjectID(p)) }
          }
      })
    }
    if (filters.modular) where.push({$match: {modular: ObjectID(filters.modular)}})
    if (filters.account_executive) where.push({$match: {account_executive: ObjectID(filters.account_executive)}})
    if (filters.start_date) where.push({$match: {startDate: {$gte: new Date(filters.start_date)}}})
    if (filters.end_date) where.push({$match: {endDate: {$lte: new Date(filters.end_date)}}})


    // if (filters.user) {
    // where['metadata.user'] = filters.user
    // }

    if (filters.program_course_name) {
      // Buscar el los cursos una coincidencia
      const responseCourses = await CourseSchedulingDetails.aggregate([
        {
          $lookup: {
            from: "course_scheduling_sections",
            localField: "course",
            foreignField: "_id",
            as: "course_doc"
          }
        },{
          $match: {
            "course_doc.name": { $regex: '.*' + filters.program_course_name + '.*', $options: 'i' }
          }
        }
      ])
      let programsId = []
      if (responseCourses && responseCourses.length) {
        programsId = responseCourses.map((c) => ObjectID(c.course_scheduling))
      }

      where.push({
        $lookup: {
          from: "programs",
          localField: "program",
          foreignField: "_id",
          as: "program_doc"
        }
      })

      if (programsId.length) {
        where.push({
          $match:{
            $or : [
              {
                _id: { $in: programsId }
              },
              {
                'program_doc.name': { $regex: '.*' + filters.program_course_name + '.*', $options: 'i' }
              }
            ]
          }
        })
      } else {
        where.push({
          $match: {
            'program_doc.name': { $regex: '.*' + filters.program_course_name + '.*', $options: 'i' }
          }
        })
      }
    }

    let registers = []
    try {
      if (where.length) {
        registers = await CourseScheduling.aggregate(where)
        .skip(paging ? (pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0) : null)
        .limit(paging ? nPerPage : null)
        .sort({ startDate: -1 })
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

      for await (const register of registers) {
        if (register.startDate) register.startDate = moment.utc(register.startDate).format('YYYY-MM-DD')
        if (register.endDate) register.endDate = moment.utc(register.endDate).format('YYYY-MM-DD')
        if (register.metadata) {
          if (register.metadata.user) {
            register.metadata.user.fullname = `${register.metadata.user.profile.first_name} ${register.metadata.user.profile.last_name}`
          }
        }
        if (register.certificate_icon_1) {
          register.certificate_icon_1 = this.getIconUrl(register.certificate_icon_1)
        }

        if (register.certificate_icon_2) {
          register.certificate_icon_2 = this.getIconUrl(register.certificate_icon_2)
        }

        if (register.certificate_icon_3) {
          register.certificate_icon_3 = this.getIconUrl(register.certificate_icon_3)
        }
        // if (register.teacher && register.teacher.profile) {
        //   register.teacher.fullname = `${register.teacher.profile.first_name} ${register.teacher.profile.last_name}`
        // }
      }
    } catch (e) {
      console.log('Error: ', e)
    }

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

  /**
   * Metodo que permite generar un reporte en PDF
   * @param params
   * @returns
   */
  public generateReport = async (params: ICourseSchedulingReport) => {

    try {
      let select = 'id metadata schedulingMode schedulingModeDetails modular program schedulingType schedulingStatus startDate endDate regional regional_transversal city country amountParticipants observations client duration in_design moodle_id'

      let where = {}

      if (params.type === 'single') {

        if (params.course_scheduling) {
          where['_id'] = params.course_scheduling
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
          .populate({ path: 'client', select: 'id name' })
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
              course_code: (element.course && element.course.code) ? element.course.code : '-',
              course_name: (element.course && element.course.name) ? element.course.name : '-',
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
                course_code: (element.course && element.course.code) ? element.course.code : '-',
                course_name: (element.course && element.course.name) ? element.course.name : '-',
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

        if (params.format === 'pdf') {
          return await this.generatePDFReport(register, {
            courses,
            total_scheduling,
            scheduling_free
          })
        } else if (params.format === 'xlsx') {
          return await this.generateXLSXReport(register)
        }
      } else {
        let courses = []

        const detailSessions = await CourseSchedulingDetails.find()
          .select('id course_scheduling course schedulingMode startDate endDate teacher number_of_sessions sessions duration')
          .populate({
            path: 'course_scheduling', select: 'id program client schedulingMode regional metadata moodle_id', populate: [
              { path: 'metadata.user', select: 'id profile.first_name profile.last_name' },
              { path: 'schedulingMode', select: 'id name moodle_id' },
              // { path: 'modular', select: 'id name' },
              { path: 'program', select: 'id name moodle_id code' },
              // { path: 'schedulingType', select: 'id name' },
              // { path: 'schedulingStatus', select: 'id name' },
              { path: 'regional', select: 'id name' },
              { path: 'client', select: 'id name'}

              // { path: 'city', select: 'id name' },
              // { path: 'country', select: 'id name' },
            ]
          })
          .populate({ path: 'course', select: 'id name code moodle_id' })
          .populate({ path: 'schedulingMode', select: 'id name moodle_id' })
          .populate({ path: 'teacher', select: 'id profile.first_name profile.last_name' })
          .select(select)
          .lean()

        detailSessions.map((course, index) => {
          let duration_scheduling = parseInt(course.duration)
          let item = {
            service_id: (course.course_scheduling && course.course_scheduling.metadata && course.course_scheduling.metadata.service_id) ? course.course_scheduling.metadata.service_id : '-',
            service_user: (course.course_scheduling && course.course_scheduling.metadata && course.course_scheduling.metadata.user) ? `${course.course_scheduling.metadata.user.profile.first_name} ${course.course_scheduling.metadata.user.profile.last_name}` : '-',
            program_code: (course.course_scheduling && course.course_scheduling.program && course.course_scheduling.program.code) ? course.course_scheduling.program.code : '-',
            program_name: (course.course_scheduling && course.course_scheduling.program && course.course_scheduling.program.name) ? course.course_scheduling.program.name : '-',
            course_code: (course.course && course.course.code) ? course.course.code : '-',
            course_name: (course.course && course.course.name) ? course.course.name : '-',
            teacher_name: (course.teacher && course.teacher.profile) ? `${course.teacher.profile.first_name} ${course.teacher.profile.last_name}` : '-',
            client: (course.course_scheduling && course.course_scheduling.client?.name) ? course.course_scheduling.client.name : '-',
            scheduling_mode: (course.course_scheduling && course.course_scheduling.schedulingMode && course.course_scheduling.schedulingMode.name) ? course.course_scheduling.schedulingMode.name : '-',
            regional: (course.course_scheduling && course.course_scheduling.regional && course.course_scheduling.regional.name) ? course.course_scheduling.regional.name : '-',
            executive: '-',
            start_date: (course.startDate) ? moment.utc(course.startDate).format('DD/MM/YYYY') : '',
            end_date: (course.endDate) ? moment.utc(course.endDate).format('DD/MM/YYYY') : '',
            course_duration: (duration_scheduling) ? generalUtility.getDurationFormated(duration_scheduling) : '0h',
          }

          courses.push(item)
        })

        if (params.format === 'pdf') {
        } else if (params.format === 'xlsx') {
          return await this.generateXLSXReport(courses)
        }
      }
    } catch (error) {
      console.log('generateReport error', error)
      return responseUtility.buildResponseFailed('json')
    }
  }

  public getIconUrl = (url: string) => {
    return `${customs['uploads']}/${this.default_icon_path}/${url}`
  }

  private generatePDFReport = async (courseScheduling: any, reportData: ICourseSchedulingReportData) => {
    let path = '/admin/course/courseSchedulingReport'
    if (['Virtual'].includes(courseScheduling.schedulingMode.name)) {
      path = '/admin/course/courseSchedulingVirtualReport'
    }

    const time = new Date().getTime()

    const responsePdf = await htmlPdfUtility.generatePdf({
      from: 'file',
      file: {
        path,
        type: 'hbs',
        context: {
          program_name: (courseScheduling.program && courseScheduling.program.name) ? courseScheduling.program.name : '',
          service_id: (courseScheduling.metadata && courseScheduling.metadata.service_id) ? courseScheduling.metadata.service_id : '',
          regional_name: (courseScheduling.regional && courseScheduling.regional.name) ? courseScheduling.regional.name : '',
          cliente_name: (courseScheduling.client?.name) ? courseScheduling.client?.name : '',
          schedule_mode: (courseScheduling.schedulingMode && courseScheduling.schedulingMode.name) ? courseScheduling.schedulingMode.name : '',
          service_city: (courseScheduling.city && courseScheduling.city.name) ? courseScheduling.city.name : '',
          courses: reportData.courses,
          total_scheduling: (reportData.total_scheduling) ? generalUtility.getDurationFormated(reportData.total_scheduling) : '0h',
          scheduling_free: (reportData.scheduling_free) ? generalUtility.getDurationFormated(reportData.scheduling_free) : '0h',
          observations: (courseScheduling.observations) ? courseScheduling.observations : '',
        }
      },
      to_file: {
        file: {
          name: `${courseScheduling.metadata.service_id}_${courseScheduling.program.code}_${time}.pdf`,
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
  }

  private generateXLSXReport = async (courses: Array<any>) => {
    // @INFO: Se genera la hoja de calculo para el reporte
    let cols = []
    let reportData = courses.reduce((accum, element) => {
      accum.push({
        'ID del servicio': element.service_id,
        'Coordinador Servicio': element.service_user,
        'Código del programa': element.program_code,
        'Nombre del programa': element.program_name,
        'Código del curso': element.course_code,
        'Nombre del curso': element.course_name,
        'Docente': element.teacher_name,
        'Cliente': element.client,
        'Modalidad': element.scheduling_mode,
        'Regional': element.regional,
        'Ejecutivo': element.executive,
        'Fecha de inicio del curso': element.start_date,
        'Fecha de finalización del curso': element.end_date,
        'Nº de horas del curso': element.course_duration,
      })
      cols.push({ width: 20 })
      return accum
    }, [])

    // @INFO: Inicializamos el nuevo libro de excel
    const wb: XLSX.WorkBook = XLSX.utils.book_new();

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(reportData, { header: [], skipHeader: false })

    ws["!cols"] = cols

    // @INFO: Se agrega la hoja de calculos al libro de excel
    XLSX.utils.book_append_sheet(wb, ws, 'reporte_general')

    // @INFO Se carga el archivo al servidor S3
    const send = await xlsxUtility.uploadXLSX({ from: 'file', attached: { file: { name: `reporte_general.xlsx` } } }, { workbook: wb })

    if (!send) return responseUtility.buildResponseFailed('json', null, { error_key: 'reports.customReport.fail_upload_xlsx' })

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        path: send
      }
    })
  }
}

export const courseSchedulingService = new CourseSchedulingService();
export { CourseSchedulingService as DefaultAdminCourseCourseSchedulingService };
