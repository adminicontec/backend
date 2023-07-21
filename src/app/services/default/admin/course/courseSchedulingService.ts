// @import_dependencies_node Import libraries
import * as path from 'path';
import * as XLSX from "xlsx";
const ObjectID = require('mongodb').ObjectID
import moment from 'moment'
const ical = require('ical-generator').default;
// @end

// @import services
import { moodleCourseService } from '@scnode_app/services/default/moodle/course/moodleCourseService'
import { IMailMessageData, mailService } from "@scnode_app/services/default/general/mail/mailService";
import { uploadService } from '@scnode_core/services/default/global/uploadService';
import { courseSchedulingNotificationsService } from '@scnode_app/services/default/admin/course/courseSchedulingNotificationsService';
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
import { mapUtility } from '@scnode_core/utilities/mapUtility'
// @end

// @import models
import { Attached, City, Company, Country, Course, CourseScheduling, CourseSchedulingDetails, CourseSchedulingMode, CourseSchedulingStatus, CourseSchedulingType, Enrollment, MailMessageLog, Modular, Program, Regional, Role, User } from '@scnode_app/models'
// @end

// @import types
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes'
import {
  CourseSchedulingDetailsSync,
  CourseSchedulingEventType,
  CourseSchedulingProvisioningMoodleStatus,
  CourseSchedulingUpdateNotification,
  ForceStatus,
  IChangeSchedulingElement,
  IChangeSchedulingModular,
  ICourseScheduling,
  ICourseSchedulingDelete,
  ICourseSchedulingEmailDestination,
  ICourseSchedulingInsertOrUpdateOptions,
  ICourseSchedulingModification,
  ICourseSchedulingQuery,
  ICourseSchedulingReport,
  ICourseSchedulingReportData,
  ICourseSchedulingUpdatedNotificationParams,
  IDownloadCalendar,
  IDuplicateCourseScheduling,
  IDuplicateService,
  IForceStatusService,
  IProvisioningMoodleCoursesParams,
  IReactivateService,
  ItemsToDuplicate,
  ReprogramingLabels,
  TCourseSchedulingModificationFn
} from '@scnode_app/types/default/admin/course/courseSchedulingTypes'
import { courseSchedulingDetailsService } from "./courseSchedulingDetailsService";
import { attachedService } from "../attached/attachedService";
import { courseContentService } from '@scnode_app/services/default/moodle/course/courseContentService';
import { CourseSchedulingDetailsModification, TCourseSchedulingDetailsModificationFn } from '@scnode_app/types/default/admin/course/courseSchedulingDetailsTypes';
import { TimeZone, TIME_ZONES_WITH_OFFSET } from '@scnode_app/types/default/admin/user/userTypes';
import { courseSchedulingDataService } from '@scnode_app/services/default/data/course/courseSchedulingDataService'
import { eventEmitterUtility } from '@scnode_core/utilities/eventEmitterUtility';
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

      let select = 'id metadata schedulingMode schedulingModeDetails modular program schedulingType schedulingStatus startDate endDate regional regional_transversal city country amountParticipants observations client duration in_design moodle_id hasCost priceCOP priceUSD discount startPublicationDate endPublicationDate enrollmentDeadline endDiscountDate account_executive certificate_clients certificate_students certificate english_certificate scope english_scope certificate_icon_1 certificate_icon_2 certificate_icon_3 auditor_certificate attachments attachments_student address classroom material_delivery material_address material_contact_name material_contact_phone material_contact_email material_assistant signature_1 signature_2 signature_3 auditor_modules contact logistics_supply certificate_address business_report partial_report approval_criteria loadParticipants publish signature_1_name signature_1_position signature_1_company signature_2_name signature_2_position signature_2_company signature_3_name signature_3_position signature_3_company multipleCertificate provisioningMoodle'
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
          .populate({ path: 'account_executive', select: 'id profile.first_name profile.last_name' })
          .populate({ path: 'client', select: 'id name' })
          .populate({ path: 'contact', select: 'id profile email' })
          .populate({ path: 'material_assistant', select: 'id profile' })
          .populate({ path: 'auditor_modules', select: 'id course duration', populate: { path: 'course', select: 'id name ' } })
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
          .populate({ path: 'account_executive', select: 'id profile.first_name profile.last_name' })
          .populate({ path: 'client', select: 'id name' })
          .populate({ path: 'contact', select: 'id profile email' })
          .populate({ path: 'material_assistant', select: 'id profile' })
          .populate({ path: 'auditor_modules', select: 'id course duration', populate: { path: 'course', select: 'id name moodle_id ' } })
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
          register.path_certificate_icon_1 = register.certificate_icon_1;
          register.certificate_icon_1 = this.getIconUrl(register.certificate_icon_1);
        }

        if (register.certificate_icon_2) {
          register.path_certificate_icon_2 = register.certificate_icon_2;
          register.certificate_icon_2 = this.getIconUrl(register.certificate_icon_2)
        }

        if (register.signature_1) {
          register.path_signature_1 = register.signature_1;
          register.signature_1 = this.getIconUrl(register.signature_1)
        }

        if (register.signature_2) {
          register.path_signature_2 = register.signature_2;
          register.signature_2 = this.getIconUrl(register.signature_2)
        }

        if (register.signature_3) {
          register.path_signature_3 = register.signature_3;
          register.signature_3 = this.getIconUrl(register.signature_3)
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
  public updateClean = async (params: ICourseScheduling) => {

    try {
      if (params.id) {
        const register = await CourseScheduling.findOne({_id: params.id})
        if (!register) return responseUtility.buildResponseFailed('json', null, {error_key: 'course_scheduling.not_found'})

        const response: any = await CourseScheduling.findByIdAndUpdate(params.id, params, { useFindAndModify: false, new: true })

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            courseScheduling: response
          }
        })
      }
      return responseUtility.buildResponseFailed('json', null, {message: 'No es posible actualizar sin un ID'})
    } catch (e) {
      return responseUtility.buildResponseFailed('json', null, {message: e?.message})
    }
  }

  /**
   * Metodo que permite insertar/actualizar un registro
   * @param params Elementos a registrar
   * @returns
   */
  public insertOrUpdate = async (params: ICourseScheduling, files?: any, options?: ICourseSchedulingInsertOrUpdateOptions) => {

    let steps = [];
    try {
      let user = undefined;
      if (params.user) {
        user = await User.findOne({ _id: params.user }).select('id short_key')
      }
      steps.push('1')

      if (params?.hasMultipleCertificate) {
        if (params.hasMultipleCertificate === 'true') {
          params.hasMultipleCertificate = true;
        } else if (params.hasMultipleCertificate === 'false') {
          params.hasMultipleCertificate = false
        }
      }
      if (params.auditor_modules && typeof params.auditor_modules === 'string' && params.auditor_modules.length) {
        params.auditor_modules = params.auditor_modules.split(',');
      } else if (Array.isArray(params.auditor_modules)) {
        params.auditor_modules = params.auditor_modules;
      } else {
        delete params.auditor_modules;
      }

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
        let findByIdOrName;
        try {
          findByIdOrName = await City.findOne({
            $or: [
              { _id: params.city },
              { name: params.city },
            ]
          }).select('id').lean()
        } catch (err) {}
        if (!findByIdOrName) {
          const response = await City.create({ name: params.city });
          params.city = response._id;
        } else {
          params.city = findByIdOrName._id
        }

      }
      steps.push('5')
      if (params.country === '') delete params.country

      steps.push('6')
      steps.push(params)

      // @INFO Logotipos
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

      // @INFO firmas
      if (files && files.signature_1_file && typeof files.signature_1_file === 'object') {
        const response_upload: any = await uploadService.uploadFile(files.signature_1_file, this.default_icon_path);
        if (response_upload.status === 'error') return response_upload;
        if (response_upload.hasOwnProperty('name')) params.signature_1 = response_upload.name
      }

      if (files && files.signature_2_file && typeof files.signature_2_file === 'object') {
        const response_upload: any = await uploadService.uploadFile(files.signature_2_file, this.default_icon_path);
        if (response_upload.status === 'error') return response_upload;
        if (response_upload.hasOwnProperty('name')) params.signature_2 = response_upload.name
      }

      if (files && files.signature_3_file && typeof files.signature_3_file === 'object') {
        const response_upload: any = await uploadService.uploadFile(files.signature_3_file, this.default_icon_path);
        if (response_upload.status === 'error') return response_upload;
        if (response_upload.hasOwnProperty('name')) params.signature_3 = response_upload.name
      }

      if (params.id) {
        let visibleAtMoodle = 0;
        const register: any = await CourseScheduling.findOne({ _id: params.id })
          .populate({ path: 'schedulingStatus', select: 'id name' })
          .lean()
        if (!register) return responseUtility.buildResponseFailed('json', null, { error_key: 'course_scheduling.not_found' })
        const prevSchedulingStatus = (register && register.schedulingStatus && register.schedulingStatus.name) ? register.schedulingStatus.name : null
        const changesFn = this.validateChanges(params, register)
        const changes = await changesFn()

        let paramsStatus: any = undefined;
        if (params.schedulingStatus) {
          paramsStatus = await CourseSchedulingStatus.findOne({ _id: params.schedulingStatus })
        }

        // @INFO Obtener la fecha de confirmación del servicio
        let confirmed_date: Date | null = null;
        if (paramsStatus && paramsStatus.name === 'Confirmado' && prevSchedulingStatus !== 'Confirmado') {
          confirmed_date = new Date();
          params.confirmed_date = confirmed_date;
        }

        if (paramsStatus && paramsStatus.name === 'Cancelado') {
          if (!register?.cancelationTracking?.date) {
            params.cancelationTracking = {
              date: moment().format('YYYY-MM-DD'),
              personWhoCancels: params.user
            }
            params.reactivateTracking = {
              date: null,
              personWhoReactivates: null
            }
          }
        }

        if (params.hasMultipleCertificate) {
          params.multipleCertificate = {
            status: true,
            editingStatus: true,
          }
          if (register?.multipleCertificate) {
            params.multipleCertificate.editingStatus = register?.multipleCertificate?.editingStatus || false
          }
        } else {
          if (params.hasMultipleCertificate === false) {
            params.multipleCertificate = {
              status: false,
              editingStatus: true
            }
          } else {
            if (register?.multipleCertificate) {
              params.multipleCertificate = {
                ...register.multipleCertificate
              }
            }
          }
        }

        if (params.hasCost) {
          let hasParamsCost = false
          if (params.priceCOP) hasParamsCost = true
          if (params.priceUSD) hasParamsCost = true
          if (register.priceCOP) hasParamsCost = true
          if (register.priceUSD) hasParamsCost = true

          if (!hasParamsCost) return responseUtility.buildResponseFailed('json', null, { error_key: 'course.insertOrUpdate.cost_required' })
        } else if (params?.hasCost === false) {
          params.priceCOP = 0
          params.priceUSD = 0
        }
        if (params?.discount === 0) params.endDiscountDate = null;

        if (!!params.endDate) {
          params.endDate = moment(params.endDate + "T23:59:59Z");
        }
        if (!!params.endDiscountDate) {
          params.endDiscountDate = moment(params.endDiscountDate + "T23:59:59Z")
        }
        if (!!params.endPublicationDate) {
          params.endPublicationDate = moment(params.endPublicationDate + "T23:59:59Z")
        }
        if (!!params.enrollmentDeadline) {
          params.enrollmentDeadline = moment(params.enrollmentDeadline + "T23:59:59Z")
        }

        if (params.reprograming && params.reprograming !== "" && params.reprograming !== "undefined") {
          params.logReprograming = this.addReprogramingLog(params.reprograming, register, {identifier: register._id, sourceType: 'course_scheduling'});
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
        await Regional.populate(response, { path: 'regional', select: 'id name moodle_id' })
        await User.populate(response, { path: 'account_executive', select: 'id profile.first_name profile.last_name email profile.timezone' })
        await User.populate(response, { path: 'material_assistant', select: 'id profile.first_name profile.last_name email profile.timezone' })
        await City.populate(response, { path: 'city', select: 'id name' })
        await Country.populate(response, { path: 'country', select: 'id name' })
        await User.populate(response, { path: 'metadata.user', select: 'id profile.first_name profile.last_name email profile.timezone' })
        await Company.populate(response, { path: 'client', select: 'id name' })
        await User.populate(response, {path: 'contact', select: 'id profile.first_name profile.last_name phoneNumber email'})
        // await Course.populate(response, {path: 'course', select: 'id name'})
        // await User.populate(response, {path: 'teacher', select: 'id profile.first_name profile.last_name'})

        if (params.sendEmail === true || params.sendEmail === 'true') {
          if (response && response.schedulingStatus && response.schedulingStatus.name === 'Confirmado') {
            // if (response && response.schedulingStatus && response.schedulingStatus.name === 'Confirmado' && prevSchedulingStatus === 'Programado') {
            await this.checkEnrollmentUsers(response)
            await this.checkEnrollmentTeachers(response)
            await this.serviceSchedulingNotification(response, prevSchedulingStatus)
            visibleAtMoodle = 1;
          }
          if (response && response.schedulingStatus && response.schedulingStatus.name === 'Confirmado' && prevSchedulingStatus === 'Confirmado') {
            if (changes.length > 0) {
              await this.sendServiceSchedulingUpdated(response, changesFn);
            }
            visibleAtMoodle = 1;
          }
          if (response && response.schedulingStatus && response.schedulingStatus.name === 'Cancelado' && prevSchedulingStatus === 'Confirmado') {
            await this.serviceSchedulingCancelled(response)
            visibleAtMoodle = 1;
          }
        }

        if (response && response.schedulingStatus) {
          if (['Confirmado', 'Cancelado'].includes(response.schedulingStatus.name)) {
            console.log('---------------------------- entro aca ----------------------------')
            visibleAtMoodle = 1;
          }
        }

        // @INFO Enviar email de entrega de materiales en físico
        await this.sendEmailMaterialDelivery(response, prevSchedulingStatus);

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

        console.log('------------------- visibleAtMoodle -----------------------------', visibleAtMoodle)

        const moodleResponse: any = await moodleCourseService.update({
          "id": `${response.moodle_id}`,
          "categoryId": `${regional}`,
          "startDate": `${response.startDate}`,
          "endDate": `${response.endDate}`,
          "customClassHours": `${generalUtility.getDurationFormatedForCertificate(params.duration)}`,
          "city": `${moodleCity}`,
          "country": `${response.country.name}`,
          "visible": visibleAtMoodle,
          status: paramsStatus?.name
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

        if (register.signature_1) {
          register.signature_1 = this.getIconUrl(register.signature_1)
        }

        if (register.signature_2) {
          register.signature_2 = this.getIconUrl(register.signature_2)
        }

        if (register.signature_3) {
          register.signature_3 = this.getIconUrl(register.signature_3)
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
        params.multipleCertificate = {
          status: false,
          editingStatus: false,
        }
        if (params.hasMultipleCertificate) {
          params.multipleCertificate.status = true
          params.multipleCertificate.editingStatus = true
        }

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
        if (user && user.short_key) {
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

        const countRegistersArr = await CourseScheduling.aggregate([
          {
            $group: { _id: null, count: { $sum: 1} }
          },
          {
            $project: {_id: 0}
          }
        ])
        let countRegisters = (countRegistersArr && countRegistersArr[0]) ? countRegistersArr[0].count + 1 : 1
        steps.push('13')
        steps.push(countRegisters)
        service_id += `${generalUtility.formatNumberWithZero(countRegisters, 4)}`
        steps.push('14')
        steps.push(service_id)

        params.metadata = {
          user: params.user,
          date: moment().format('YYYY-MM-DD'),
          service_id,
          year: moment().format('YYYY')
        }

        params.endDate = params.endDate ? moment(params.endDate + "T23:59:59Z") : moment(params.startDate + "T23:59:59Z");
        params.endDiscountDate = (params.endDiscountDate) ? moment(params.endDiscountDate + "T23:59:59Z") : null;
        params.endPublicationDate = (params.endPublicationDate) ? moment(params.endPublicationDate + "T23:59:59Z") : null;
        params.enrollmentDeadline = (params.enrollmentDeadline) ? moment(params.enrollmentDeadline + "T23:59:59Z") : null;

        steps.push('14-1');
        // steps.push(params.endDate);
        steps.push(params.endDiscountDate);
        steps.push(params.endPublicationDate);
        steps.push(params.enrollmentDeadline);

        steps.push('15');
        steps.push(params);

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
          .populate({ path: 'account_executive', select: 'id profile.first_name profile.last_name email profile.timezone' })
          .populate({ path: 'material_assistant', select: 'id profile.first_name profile.last_name email profile.timezone' })
          .populate({ path: 'city', select: 'id name' })
          .populate({ path: 'country', select: 'id name' })
          .populate({ path: 'metadata.user', select: 'id profile.first_name profile.last_name email profile.timezone' })
          .populate({ path: 'client', select: 'id name' })
          .populate({path: 'contact', select: 'id profile.first_name profile.last_name phoneNumber email'})
          // .populate({path: 'course', select: 'id name'})
          // .populate({path: 'teacher', select: 'id profile.first_name profile.last_name'})
          .lean()
        steps.push('17')
        steps.push(response)

        const prevSchedulingStatus = (response && response.schedulingStatus && response.schedulingStatus.name) ? response.schedulingStatus.name : null

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
          await CourseScheduling.findByIdAndUpdate(_id, {
            provisioningMoodle: {
              status: CourseSchedulingProvisioningMoodleStatus.IN_PROCESS,
              logs: [],
            }
          }, {
            useFindAndModify: false,
            new: true,
            lean: true,
          })
          const eventParams: IProvisioningMoodleCoursesParams = {
            steps,
            paramsMoodle,
            params,
            response,
            _id,
            prevSchedulingStatus,
            originalScheduling: options?.originalScheduling,
            shouldDuplicateSessions: options?.shouldDuplicateSessions,
            itemsToDuplicate: options?.itemsToDuplicate,
          }
          eventEmitterUtility.emit(CourseSchedulingEventType.PROVISIONING_MOODLE_COURSES, eventParams)
        } else {
          steps.push('22-b')
          if ((params.sendEmail === true || params.sendEmail === 'true') && (response && response.schedulingStatus && response.schedulingStatus.name === 'Confirmado')) {
            steps.push('26')
            await this.checkEnrollmentUsers(response)
            await this.checkEnrollmentTeachers(response)
            await this.serviceSchedulingNotification(response, prevSchedulingStatus)
          }
        }

        if (response.certificate_icon_1) {
          response.certificate_icon_1 = this.getIconUrl(response.certificate_icon_1)
        }

        if (response.certificate_icon_2) {
          response.certificate_icon_2 = this.getIconUrl(response.certificate_icon_2)
        }

        if (response.signature_1) {
          response.signature_1 = this.getIconUrl(response.signature_1)
        }

        if (response.signature_2) {
          response.signature_2 = this.getIconUrl(response.signature_2)
        }

        if (response.signature_3) {
          response.signature_3 = this.getIconUrl(response.signature_3)
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

  public updateCourseSchedulingEndDate = async (courseSchedulingId: string) => {
    try {
      const courseScheduling = await CourseScheduling.findOne({_id: courseSchedulingId})
      .select('id schedulingMode')
      .populate({path: 'schedulingMode', select: 'id name'})

      const courseSchedulingDetails = await CourseSchedulingDetails.find({course_scheduling: courseSchedulingId})
      .select('id startDate endDate')
      .sort({endDate: -1})
      .limit(1)
      if (courseSchedulingDetails && courseSchedulingDetails[0]) {
        const endDate = moment(courseSchedulingDetails[0].endDate.toISOString().split('T')[0])
        if (['Presencial', 'En linea'].includes(courseScheduling?.schedulingMode?.name)) {
          // TODO: Desactivado temporalmente hasta confirmación de Icontec
          // endDate.add(15, 'days')
        }
        const response: any = await CourseScheduling.findByIdAndUpdate(courseSchedulingId, {
          endDate: moment(endDate.format('YYYY-MM-DD')+"T23:59:59Z")
        }, {
          useFindAndModify: false,
          new: true,
          lean: true,
        })
        await CourseSchedulingStatus.populate(response, { path: 'schedulingStatus', select: 'id name' })
        await Regional.populate(response, { path: 'regional', select: 'id name moodle_id' })
        await City.populate(response, { path: 'city', select: 'id name' })
        await Country.populate(response, { path: 'country', select: 'id name' })
        let regional = null;
        if (response) {
          if (response.regional && response.regional.moodle_id) {
            regional = response.regional.moodle_id;
          } else if (response.regional_transversal) {
            regional = response.regional_transversal;
          }
        }
        var moodleCity = '';
        let visibleAtMoodle = 0;
        if (response.city) { moodleCity = response.city.name; }
        if (['Confirmado', 'Cancelado'].includes(response.schedulingStatus.name)) {
          visibleAtMoodle = 1;
        }
        const moodleResponse: any = await moodleCourseService.update({
          "id": `${response.moodle_id}`,
          "categoryId": `${regional}`,
          "startDate": `${response.startDate}`,
          "endDate": `${response.endDate}`,
          "customClassHours": `${generalUtility.getDurationFormatedForCertificate(response.duration)}`,
          "city": `${moodleCity}`,
          "country": `${response.country.name}`,
          "visible": visibleAtMoodle,
          status: response.schedulingStatus.name
        });
      }
    } catch (err) {}
  }

  public addReprogramingLog = (reprograming: string, courseScheduling: any, source: {identifier: string, sourceType: string}) => {
    let logReprograming = {
      count: 0,
      log: []
    }
    if (courseScheduling?.logReprograming) {
      if (courseScheduling?.logReprograming?.count) logReprograming.count = courseScheduling?.logReprograming?.count
      if (courseScheduling?.logReprograming?.log) logReprograming.log = courseScheduling?.logReprograming?.log
    }
    logReprograming.count = logReprograming.count + 1,
    logReprograming.log.push({
      reason: reprograming,
      source,
      date: new Date()
    })
    return logReprograming
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
  checkEnrollmentUsers = async (courseScheduling) => {

    const userEnrolled = await Enrollment.find({
      courseID: courseScheduling.moodle_id
    }).select('id user')
      .populate({ path: 'user', select: 'id username email profile.first_name profile.last_name' })
      .lean()

    for await (const enrolled of userEnrolled) {
      if (!enrolled?.user?.email) continue
      await this.sendEnrollmentUserEmail([enrolled.user.email], {
        mailer: customs['mailer'],
        first_name: enrolled.user.profile.first_name,
        course_name: courseScheduling.program.name,
        service_id: courseScheduling?.metadata?.service_id || '',
        username: enrolled.user.username || '',
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
      .populate({ path: 'teacher', select: 'id email profile.first_name profile.last_name profile.timezone' })
      .lean()

    let notificationsByTeacher = {}

    for await (const course of courses) {
      const timezone: TimeZone = course?.teacher?.profile?.timezone ? course?.teacher?.profile?.timezone : TimeZone.GMT_5
      if (!notificationsByTeacher[course.teacher._id] && (!teacher || (teacher && teacher.toString() === course.teacher._id.toString()))) {
        let isBusiness = false
        let modality = undefined;

        let contact = undefined;
        let address = undefined;
        let classroom = undefined;
        let city = undefined;

        if (courseScheduling?.schedulingType?.name === 'Empresarial') {
          isBusiness = true;
        }
        if (courseScheduling.schedulingMode.name === 'Presencial') {
          modality = 'in_situ'
        } else if (courseScheduling.schedulingMode.name === 'En linea') {
          modality = 'online'
        } else {
          modality = 'virtual'
        }

        // if (isBusiness) {
          if (modality === 'in_situ') {
            address = courseScheduling?.address || '-'
            classroom = courseScheduling?.classroom || '-'
            city = (courseScheduling.city && courseScheduling.city.name) ? courseScheduling.city.name : '-'
            contact = {
              fullName: `${courseScheduling?.contact?.profile ? `${courseScheduling?.contact?.profile?.first_name} ${courseScheduling?.contact?.profile?.last_name}` : '-'}`,
              phoneNumber: courseScheduling?.contact?.phoneNumber || '-',
              email: courseScheduling?.contact?.email || '-',
            }
          } else if (modality === 'online') {
            contact = {
              fullName: `${courseScheduling?.contact?.profile ? `${courseScheduling?.contact?.profile?.first_name} ${courseScheduling?.contact?.profile?.last_name}` : '-'}`,
              phoneNumber: courseScheduling?.contact?.phoneNumber || '-',
              email: courseScheduling?.contact?.email || '-',
            }
          }
        // }

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
            city,
            scheduling_mode: (courseScheduling.schedulingMode && courseScheduling.schedulingMode.name) ? courseScheduling.schedulingMode.name : '-',
            duration: (courseScheduling?.duration) ? generalUtility.getDurationFormated(courseScheduling?.duration, 'large') : '-',
            scheduling_type: (courseScheduling?.schedulingType?.name) ? courseScheduling?.schedulingType?.name : '-',
            amountParticipants: (courseScheduling?.amountParticipants) ? courseScheduling?.amountParticipants : '-',
            regional: (courseScheduling?.regional?.name) ? courseScheduling?.regional?.name : '-',
            account_executive: (courseScheduling?.account_executive?.profile?.first_name) ? `${courseScheduling?.account_executive?.profile?.first_name} ${courseScheduling?.account_executive?.profile?.last_name}` : '-',
            contact,
            address,
            classroom
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
          course_code: (course.course && course.course.code) ? course.course.code : '',
          course_name: (course.course && course.course.name) ? course.course.name : '',
          timezone: courseSchedulingDetailsService.getTimezoneName(timezone),
          sessions: []
        }
        course.sessions.map((session) => {
          const sessionData = courseSchedulingDetailsService.formatSessionNotificationInfo(session, timezone)
          item.sessions.push({ ...sessionData })
        })
        if (notificationsByTeacher[course.teacher._id]) {
          notificationsByTeacher[course.teacher._id].courses.push(item)
        }
      }
    }


    for (const key in notificationsByTeacher) {
      if (Object.prototype.hasOwnProperty.call(notificationsByTeacher, key)) {
        const teacherData = notificationsByTeacher[key];
        console.log('teacherData', teacherData)
        await this.sendEnrollmentUserEmail([teacherData.teacher.email], {
          mailer: customs['mailer'],
          subject: i18nUtility.__('mailer.enrollment_teacher.subject'),
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

  serviceSchedulingNotification = async (courseScheduling, prevSchedulingStatus: string) => {
    // Solo se envía cuando pasa de programado a confirmado
    const currentStatus = (courseScheduling && courseScheduling.schedulingStatus && courseScheduling.schedulingStatus.name) ? courseScheduling.schedulingStatus.name : null
    if (currentStatus === 'Confirmado' && prevSchedulingStatus !== 'Confirmado') {
      // @INFO Segun lo hablado con Brian el 24/02/2022, la notificación cambia
      await courseSchedulingNotificationsService.sendNotificationOfServiceToAssistant(courseScheduling);
    }
    return
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
        today: moment().format('YYYY-MM-DD'),
        notification_source: `scheduling_notification_${courseScheduling._id}`,
        amount_notifications: 1,
        // Información
        program_name: courseScheduling.program.name,
        service_id: courseScheduling.metadata.service_id
      });
    }
  }

  private serviceSchedulingCancelled = async (courseScheduling) => {
    // @INFO Enviar notificación de cancelado al auxiliar del servicio
    await courseSchedulingNotificationsService.sendNotificationOfServiceToAssistant(courseScheduling, 'cancel');

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

  private validateChanges = (params: ICourseScheduling, register: typeof CourseScheduling): TCourseSchedulingModificationFn => async (timezone: TimeZone = TimeZone.GMT_5) => {
    const changes: ICourseSchedulingModification[] = []
    if ((register.startDate && params.startDate) && `${params.startDate}T00:00:00.000Z` !== register.startDate.toISOString()) {
      changes.push({
        message: `<div>La fecha de inicio del programa ha cambiado de ${moment(register.startDate.toISOString().replace('T00:00:00.000Z', '')).zone(TIME_ZONES_WITH_OFFSET[timezone]).format('YYYY-MM-DD')} a ${params.startDate}</div>`
      })
    }
    if ((register.endDate && params.endDate) && `${params.endDate}T00:00:00.000Z` !== register.endDate.toISOString()) {
      changes.push({
        message: `<div>La fecha de fin del programa ha cambiado de ${moment(register.endDate.toISOString().replace('T00:00:00.000Z', '')).zone(TIME_ZONES_WITH_OFFSET[timezone]).format('YYYY-MM-DD')} a ${params.endDate}</div>`
      })
    }
    // if ((register.duration && params.duration) && params.duration !== register.duration) {
    //   changes.push({
    //     message: `La duración del curso ha cambiado a ${generalUtility.getDurationFormated(register.duration)}`
    //   })
    // }
    return changes
  }

  /**
   * @INFO Enviar el email de entrega de material en fisico
   * @param response
   * @param prevSchedulingStatus
   */
  private sendEmailMaterialDelivery = async (register: any, prevSchedulingStatus?: string) => {
    try {
      const currentStatus = (register && register.schedulingStatus && register.schedulingStatus.name) ? register.schedulingStatus.name : null
      if (currentStatus === 'Confirmado' && prevSchedulingStatus !== 'Confirmado' && register.material_delivery === 'physic') {
        let path_template = 'course/schedulingMaterialDelivery';
        const params = {
          mailer: customs['mailer'],
          service_id: register.program.name,
          service_code: register.metadata.service_id,
          initDate: moment.utc(register.startDate).format('YYYY-MM-DD'),
          city: register.city.name
        }
        const emails: string[] = [customs['mailer']['email_material_delivery']];
        const mail = await mailService.sendMail({
          emails,
          mailOptions: {
            subject: i18nUtility.__('mailer.scheduling_material_delivery.subject'),
            html_template: {
              path_layout: 'icontec',
              path_template: path_template,
              params
            },
          },
          notification_source: `course_material_delivery_${params.service_code}`
        })
        return mail
      }
    } catch (e) {
      console.log('Error send email material delivery: ', e)
      return responseUtility.buildResponseFailed('json', null)
    }
  }

  public sendServiceSchedulingUpdated = async (
    courseScheduling,
    changesFn: TCourseSchedulingDetailsModificationFn | TCourseSchedulingModificationFn,
    course?: { course: any, courseSchedulingDetail: any, syncupSessionsInMoodle?: CourseSchedulingDetailsSync },
  ) => {
    await courseSchedulingNotificationsService.sendNotificationOfServiceToAssistant(
      typeof courseScheduling === 'string' ? courseScheduling : courseScheduling?._id,
      'modify',
      true,
      changesFn,
      course?.syncupSessionsInMoodle
    );

    const changes = await changesFn()

    const _changes = changes.filter(val => !val.type || val.type !== CourseSchedulingDetailsModification.TEACHER)
    if (_changes.length > 0) {
      let students_to_notificate: ICourseSchedulingEmailDestination[] = []
      let teachers_to_notificate: ICourseSchedulingEmailDestination[] = []
      const userEnrolled = await Enrollment.find({
        courseID: courseScheduling.moodle_id
      }).select('id user')
        .populate({ path: 'user', select: 'id email profile.first_name profile.last_name profile.timezone' })
        .lean()

      for await (const enrolled of userEnrolled) {
        students_to_notificate.push({
          email: enrolled.user.email.toString(),
          timezone: enrolled?.user?.profile?.timezone,
        })
      }

      const where: any = {
        course_scheduling: courseScheduling._id
      }

      if (course) {
        where._id = course.courseSchedulingDetail._id
      }

      const courses = await CourseSchedulingDetails.find(where).select('id startDate endDate duration course sessions teacher')
        .populate({ path: 'course', select: 'id name code' })
        .populate({ path: 'teacher', select: 'id email profile.first_name profile.last_name profile.timezone' })
        .lean()

      for await (const course of courses) {
        const teacherEmail = course?.teacher?.email?.toString()
        if (teacherEmail && !teachers_to_notificate.some((teacher) => teacher.email === teacherEmail)) {
          teachers_to_notificate.push({
            email: teacherEmail,
            timezone: course?.teacher?.profile?.timezone,
          })
        }
      }

      if (students_to_notificate.length > 0) {
        await this.serviceSchedulingUpdated(students_to_notificate, {
          mailer: customs['mailer'],
          service_id: courseScheduling.metadata.service_id,
          program_name: courseScheduling.program.name,
          course_name: course?.course?.name || undefined,
          notification_source: `course_updated_${courseScheduling._id}`,
          changesFn,
          type: CourseSchedulingUpdateNotification.STUDENT
        })
      }
      if (teachers_to_notificate.length > 0) {
        await this.serviceSchedulingUpdated(teachers_to_notificate, {
          mailer: customs['mailer'],
          service_id: courseScheduling.metadata.service_id,
          program_name: courseScheduling.program.name,
          course_name: course?.course?.name || undefined,
          notification_source: `course_updated_${courseScheduling._id}`,
          changesFn,
          type: CourseSchedulingUpdateNotification.TEACHER
        })
      }
    }
  }

  public serviceSchedulingUpdated = async (receivers: ICourseSchedulingEmailDestination[], paramsTemplate: ICourseSchedulingUpdatedNotificationParams) => {
    try {
      let path_template = 'course/schedulingUpdate'
      if (paramsTemplate.type === CourseSchedulingUpdateNotification.TEACHER) {
        path_template = 'course/schedulingUpdateTeacher'
      }

      const changesFn = paramsTemplate.changesFn;

      const emailsByTimezone = {};
      receivers.forEach((receiver) => {
        const timezone = receiver?.timezone ? receiver?.timezone : TimeZone.GMT_5
        if (emailsByTimezone[timezone]) {
          emailsByTimezone[timezone].push(receiver.email)
        } else {
          emailsByTimezone[timezone] = [receiver.email]
        }
      })

      const timezoneKeys = Object.keys(emailsByTimezone) as TimeZone[]
      let mail = undefined;
      for (let timezone of timezoneKeys) {
        paramsTemplate.changes = await changesFn(timezone);
        const emails = emailsByTimezone[timezone];
        mail = await mailService.sendMail({
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
      }
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

      let messageAttacheds = []
      if (paramsTemplate?.service_id && paramsTemplate?.type === 'student') {
        const courseScheduling = await CourseScheduling.findOne({"metadata.service_id": paramsTemplate?.service_id}).select('id attachments_student')
        if (courseScheduling && courseScheduling?.attachments_student) {
          const attacheds = await Attached.find({_id: courseScheduling?.attachments_student}).select('files')
          let count = 1;
          for (const attached of attacheds) {
            if (attached?.files) {
              for (const file of attached?.files) {
                if (file?.url) {
                  const ext = path.extname(file?.url);
                  messageAttacheds.push({
                    filename: `Adjunto ${count}${ext}`,
                    path: attachedService.getFileUrl(file?.url)
                  })
                  count++;
                }
              }
            }
          }
        }
      }

      const mailOptions: IMailMessageData = {
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
      }
      if (messageAttacheds) {
        if (Array.isArray(messageAttacheds) && messageAttacheds.length > 0) {
          mailOptions.mailOptions['attachments'] = messageAttacheds
        }
      }

      const mail = await mailService.sendMail(mailOptions)
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
          subject: (paramsTemplate.type === 'teacher') ? i18nUtility.__('mailer.unenrollment_teacher.subject') : i18nUtility.__('mailer.unenrollment_user.subject'),
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

    let select = 'id metadata schedulingMode schedulingModeDetails modular program schedulingType schedulingStatus startDate endDate regional regional_transversal city country amountParticipants observations client duration in_design moodle_id hasCost priceCOP priceUSD discount startPublicationDate endPublicationDate enrollmentDeadline endDiscountDate account_executive certificate_clients certificate_students certificate english_certificate scope english_scope certificate_icon_1 certificate_icon_2 attachments attachments_student address classroom material_delivery material_address material_contact_name material_contact_phone material_contact_email material_assistant signature_1 signature_2 signature_3 contact logistics_supply certificate_address business_report partial_report approval_criteria schedulingAssociation loadParticipants publish multipleCertificate provisioningMoodle'
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

    if (filters.schedulingType) where.push({ $match: { schedulingType: ObjectID(filters.schedulingType) } })
    if (filters.schedulingStatus) where.push({ $match: { schedulingStatus: ObjectID(filters.schedulingStatus) } })
    if (filters.schedulingMode) where.push({ $match: { schedulingMode: ObjectID(filters.schedulingMode) } })
    if (filters.regional) where.push({ $match: { regional: ObjectID(filters.regional) } })
    if (filters.company) where.push({ $match: { client: ObjectID(filters.company) } })
    // if (filters.client) where.push({$match: {client: { $regex: '.*' + filters.client + '.*', $options: 'i' }}})
    if (filters.client) {
      const companies = await Company.find({ name: { $regex: '.*' + filters.client + '.*', $options: 'i' } }).select('id name')
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
    if (filters.modular) where.push({ $match: { modular: ObjectID(filters.modular) } })
    if (filters.account_executive) where.push({ $match: { account_executive: ObjectID(filters.account_executive) } })
    if (filters.start_date) where.push({ $match: { startDate: { $gte: new Date(filters.start_date) } } })
    if (filters.end_date) where.push({ $match: { endDate: { $lte: new Date(filters.end_date) } } })
    if (filters.schedulingAssociation) where.push({ $match: {'schedulingAssociation.slug': { $regex: '.*' + filters.schedulingAssociation + '.*', $options: 'i' }}})
    if (filters.program) where.push({$match: {'program': ObjectID(filters.program)}})

    // if (filters.user) {
    // where['metadata.user'] = filters.user
    // }

    // Filtrar por docente
    if (filters.teacher) {
      const responseCourses = await CourseSchedulingDetails.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "teacher",
            foreignField: "_id",
            as: "teacher_doc"
          }
        }, {
          $match: {
            $or: [
              {"teacher_doc.profile.first_name": { $regex: '.*' + filters.teacher + '.*', $options: 'i' }},
              {"teacher_doc.profile.last_name": { $regex: '.*' + filters.teacher + '.*', $options: 'i' }},
              {"teacher_doc.username": { $regex: '.*' + filters.teacher + '.*', $options: 'i' }},
              {"teacher_doc.email": { $regex: '.*' + filters.teacher + '.*', $options: 'i' }},
              {"teacher_doc.profile.doc_number": { $regex: '.*' + filters.teacher + '.*', $options: 'i' }},
            ]
          }
        }
      ])
      let programsId = []
      if (responseCourses && responseCourses.length) {
        programsId = responseCourses.map((c) => ObjectID(c.course_scheduling))
      }
      where.push({
        $match: {
          _id: {$in: programsId}
        }
      })
    }

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
        }, {
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
          $match: {
            $or: [
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
        where.push({$match: {deleted: false}})
        const whereAggregate = [].concat(where)
        if (paging) {
          whereAggregate.push({$skip: ((pageNumber - 1) * nPerPage)})
          whereAggregate.push({$limit: nPerPage})
        }
        registers = await CourseScheduling.aggregate(whereAggregate)
          // .skip(paging ? (pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0) : null)
          // .limit(paging ? nPerPage : null)
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
          { path: 'account_executive', select: 'id profile.first_name profile.last_name' },
          { path: 'client', select: 'id name' },
          { path: 'contact', select: 'id profile email' },
          { path: 'material_assistant', select: 'id profile' },
          { path: 'auditor_modules', select: 'id course duration', populate: { path: 'course', select: 'id name ' } }

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
          .populate({ path: 'account_executive', select: 'id profile.first_name profile.last_name' })
          .populate({ path: 'client', select: 'id name' })
          .populate({ path: 'contact', select: 'id profile email' })
          .populate({ path: 'material_assistant', select: 'id profile' })
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

        if (register.signature_1) {
          register.signature_1 = this.getIconUrl(register.signature_1)
        }

        if (register.signature_2) {
          register.signature_2 = this.getIconUrl(register.signature_2)
        }

        if (register.signature_3) {
          register.signature_3 = this.getIconUrl(register.signature_3)
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
      let select = 'id metadata schedulingMode schedulingModeDetails modular program schedulingType schedulingStatus startDate endDate regional regional_transversal city country amountParticipants observations client duration in_design moodle_id address classroom material_delivery material_address material_contact_name material_contact_phone material_contact_email material_assistant signature_1 signature_2 signature_3 business_report partial_report approval_criteria loadParticipants publish provisioningMoodle'

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
          .populate({ path: 'material_assistant', select: 'id profile' })
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
          .populate({ path: 'teacher', select: 'id profile.first_name profile.last_name profile.city' })
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
              teacher_city: element?.teacher?.profile?.city || '-',
              start_date: (element.startDate) ? moment(element.startDate).format('DD/MM/YYYY') : '',
              end_date: (element.endDate) ? moment(element.endDate).format('DD/MM/YYYY') : '',
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
                teacher_city: element?.teacher?.profile?.city || '-',
                start_date: (session.startDate) ? moment(session.startDate).format('DD/MM/YYYY') : '',
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
          .select('id course_scheduling course schedulingMode startDate endDate teacher number_of_sessions sessions duration observations')
          .populate({
            path: 'course_scheduling',
            select: 'id program client schedulingMode schedulingType schedulingStatus regional metadata moodle_id modular city observations account_executive logReprograming schedulingAssociation cancelationTracking reactivateTracking',
            populate: [
              { path: 'metadata.user', select: 'id profile.first_name profile.last_name' },
              { path: 'schedulingMode', select: 'id name moodle_id' },
              { path: 'modular', select: 'id name' },
              { path: 'program', select: 'id name moodle_id code' },
              { path: 'schedulingType', select: 'id name' },
              { path: 'schedulingStatus', select: 'id name' },
              { path: 'regional', select: 'id name' },
              { path: 'client', select: 'id name' },
              { path: 'city', select: 'id name' },
              { path: 'account_executive', select: 'id profile.first_name profile.last_name' },
              { path: 'schedulingAssociation.parent', select: 'id metadata.service_id'},
              { path: 'schedulingAssociation.personWhoGeneratedAssociation', select: 'id profile.first_name profile.last_name'},
              { path: 'cancelationTracking.personWhoCancels', select: 'id profile.first_name profile.last_name'},
              { path: 'reactivateTracking.personWhoReactivates', select: 'id profile.first_name profile.last_name'}
            ]
          })
          .populate({ path: 'course', select: 'id name code moodle_id' })
          .populate({ path: 'schedulingMode', select: 'id name moodle_id' })
          .populate({ path: 'teacher', select: 'id profile.first_name profile.last_name profile.city profile.regional profile.contractType' })
          .select(select)
          .lean()

        const courseSchedulings = mapUtility.removeDuplicated(detailSessions.reduce((accum, element) => {
          if (element?.course_scheduling?._id) {
            accum.push(element.course_scheduling._id)
          }
          return accum
        }, []))

        let participantsByProgram = {}

        if (courseSchedulings.length > 0) {
          const enrolledByProgramQuery = await Enrollment.aggregate([
            {
              $match: {
                course_scheduling: { $in: courseSchedulings },
                deleted: false
              }
            },
            {
              $group: { _id: "$course_scheduling", count: { $sum: 1 } }
            }
          ])
          if (enrolledByProgramQuery.length > 0) {
            participantsByProgram = enrolledByProgramQuery.reduce((accum, element) => {
              if (!accum[element._id.toString()]) {
                accum[element._id.toString()] = element.count;
              }
              return accum
            }, {})
          }
        }

        detailSessions.map((course, index) => {
          let duration_scheduling = parseInt(course.duration)

          if (course.sessions && course.sessions.length > 0) {
            duration_scheduling = 0;
            course.sessions.map((session) => {
              duration_scheduling += parseInt(session.duration)
            })
          }

          let teacher_type = '-';
          if (course?.teacher?.profile?.contractType) {
            if (course?.teacher?.profile?.contractType?.isTeacher === true) {
              teacher_type = 'Docente'
            } else if (course?.teacher?.profile?.contractType?.isTutor === true) {
              teacher_type = 'Tutor'
            }
          }

          let reprogramingCount = 0
          let reprogramingTypes = []
          if (course.course_scheduling?.logReprograming) {
            reprogramingTypes = course.course_scheduling?.logReprograming.log.reduce((accum, element) => {
              if (element?.source?.sourceType === 'course_scheduling_detail' && element?.source?.identifier === course._id.toString()) {
                accum.push(ReprogramingLabels[element.reason])
                reprogramingCount++;
              }
              return accum;
            }, [])
          }

          let item = {
            service_id: (course?.course_scheduling?.metadata?.service_id) ? course.course_scheduling.metadata.service_id : '-',
            course_scheduling_status: (course?.course_scheduling?.schedulingStatus?.name) ? course?.course_scheduling?.schedulingStatus?.name : '-',
            modular: (course?.course_scheduling?.modular?.name) ? course?.course_scheduling?.modular?.name : '-',
            program_code: (course?.course_scheduling?.program?.code) ? course.course_scheduling.program.code : '-',
            program_name: (course?.course_scheduling?.program?.name) ? course.course_scheduling.program.name : '-',
            course_scheduling_type: (course?.course_scheduling?.schedulingType?.name) ? course?.course_scheduling?.schedulingType?.name : '-',
            scheduling_mode: (course.course_scheduling && course.course_scheduling.schedulingMode && course.course_scheduling.schedulingMode.name) ? course.course_scheduling.schedulingMode.name : '-',
            course_code: (course.course && course.course.code) ? course.course.code : '-',
            course_name: (course.course && course.course.name) ? course.course.name : '-',
            course_duration: (duration_scheduling) ? generalUtility.getDurationFormated(duration_scheduling) : '0h',
            start_date: (course.startDate) ? moment.utc(course.startDate).format('DD/MM/YYYY') : '',
            end_date: (course.endDate) ? moment.utc(course.endDate).format('DD/MM/YYYY') : '',
            start_month: (course.startDate) ? moment.utc(course.startDate).format('MM') : '',
            start_year: (course.startDate) ? moment.utc(course.startDate).format('YYYY') : '',
            teacher_name: (course.teacher?.profile) ? `${course.teacher.profile.first_name} ${course.teacher.profile.last_name}` : '-',
            teacher_type,
            teacher_id: (course.teacher?._id) ? course.teacher._id : '-',
            teacher_city: (course.teacher?.profile?.city) ? course.teacher.profile.city : '-',
            teacher_regional: (course.teacher?.profile?.regional) ? course.teacher.profile.regional : '-',
            city: (course?.course_scheduling?.city?.name) ? course.course_scheduling.city.name : '-',
            regional: (course?.course_scheduling?.regional?.name) ? course.course_scheduling.regional.name : '-',
            participants: (participantsByProgram[course?.course_scheduling?._id]) ? participantsByProgram[course?.course_scheduling._id] : 0,
            observations: (course?.course_scheduling?.observations) ? course.course_scheduling.observations : '-',
            executive: (course?.course_scheduling?.account_executive?.profile) ? `${course.course_scheduling.account_executive.profile.first_name} ${course.course_scheduling.account_executive.profile.last_name}` : '-',
            client: (course?.course_scheduling?.client?.name) ? course.course_scheduling.client.name : '-',
            service_user: (course.course_scheduling && course.course_scheduling.metadata && course.course_scheduling.metadata.user) ? `${course.course_scheduling.metadata.user.profile.first_name} ${course.course_scheduling.metadata.user.profile.last_name}` : '-',
            reprogramingCount,
            reprogramingTypes,
            moduleObservations: (course?.observations) ? course.observations : '-',
            schedulingAssociationSlug: (course?.course_scheduling?.schedulingAssociation?.slug) ? course?.course_scheduling?.schedulingAssociation?.slug : '-',
            schedulingAssociationDate: (course?.course_scheduling?.schedulingAssociation?.date) ? moment.utc(course?.course_scheduling?.schedulingAssociation?.date).format('DD/MM/YYYY') : '-',
            schedulingAssociationPerson: (course?.course_scheduling?.schedulingAssociation?.personWhoGeneratedAssociation) ? `${course?.course_scheduling?.schedulingAssociation?.personWhoGeneratedAssociation.profile.first_name} ${course?.course_scheduling?.schedulingAssociation?.personWhoGeneratedAssociation.profile.last_name}` : '-',
            cancelationDate: (course?.course_scheduling?.cancelationTracking?.date) ? moment.utc(course?.course_scheduling?.cancelationTracking?.date).format('DD/MM/YYYY') : 'N/A',
            cancelationPerson: (course?.course_scheduling?.cancelationTracking?.personWhoCancels) ? `${course?.course_scheduling?.cancelationTracking?.personWhoCancels.profile.first_name} ${course?.course_scheduling?.cancelationTracking?.personWhoCancels.profile.last_name}` : 'N/A',
            reactivateDate: (course?.course_scheduling?.reactivateTracking?.date) ? moment.utc(course?.course_scheduling?.reactivateTracking?.date).format('DD/MM/YYYY') : 'N/A',
            reactivatePerson: (course?.course_scheduling?.reactivateTracking?.personWhoReactivates) ? `${course?.course_scheduling?.reactivateTracking?.personWhoReactivates.profile.first_name} ${course?.course_scheduling?.reactivateTracking?.personWhoReactivates.profile.last_name}` : 'N/A',

          }

          courses.push(item)
        })

        if (params.format === 'pdf') {
        } else if (params.format === 'xlsx') {
          return await this.generateXLSXReport(courses)
        } else if (params.format === 'json') {
          return responseUtility.buildResponseSuccess('json', null, {
            additional_parameters: {
              courses
            }
          })
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
          schedule_status: (courseScheduling.schedulingStatus && courseScheduling.schedulingStatus.name) ? courseScheduling.schedulingStatus.name : '',
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
        base: `${customs['pdf_base']}/`,
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
    const time = new Date().getTime()
    const title: any = `reporte_general_${time}`

    // @INFO: Se genera la hoja de calculo para el reporte
    let cols = []
    let reportData = courses.reduce((accum, element) => {
      accum.push({
        'ID del servicio': element.service_id,
        'Estado': element.course_scheduling_status,
        'Modular': element?.modular ? element?.modular : '-',
        'Código del programa': element.program_code,
        'Nombre del programa': element.program_name,
        'Tipo de servicio': element.course_scheduling_type,
        'Modalidad': element.scheduling_mode,
        'Código del curso': element.course_code,
        'Nombre del curso': element.course_name,
        'Nº de horas del curso': element.course_duration,
        'Fecha de inicio del curso': element.start_date,
        'Fecha de finalización del curso': element.end_date,
        'Mes': element.start_month,
        'Año': element.start_year,
        'Docente': element.teacher_name,
        'Tipo de docente': element.teacher_type,
        'Ciudad origen docente': element.teacher_city,
        'Regional docente': element.teacher_regional,
        'Ciudad del servicio': element.city,
        'Regional del servicio': element.regional,
        'Participantes': element.participants,
        'Observaciones del programa': element.observations,
        'Observaciones del modulo': element.moduleObservations,
        'Cantidad de reprogramaciones': element.reprogramingCount,
        'Tipo de reprogramaciones': element.reprogramingTypes.join(','),
        'Nombre del ejecutivo de cuenta': element.executive,
        'Empresa': element.client,
        'Grupo': element.schedulingAssociationSlug,
        'Fecha de generación del grupo': element.schedulingAssociationDate,
        'Persona que genero el grupo': element.schedulingAssociationPerson,
        'Fecha de cancelación del servicio': element.cancelationDate,
        'Persona que cancelo el servicio': element.cancelationPerson,
        'Fecha de reactivación del servicio': element.reactivateDate,
        'Persona que reactivo el servicio': element.reactivatePerson,
        // 'Modalidad horario': '', // TODO: Ver donde esta este campo
        // 'Coordinador Servicio': element.service_user,
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
    const send = await xlsxUtility.uploadXLSX({ from: 'file', attached: { file: { name: `${title}.xlsx` } } }, {workbook: wb})
    if (!send) return responseUtility.buildResponseFailed('json', null, { error_key: 'reports.customReport.fail_upload_xlsx' })

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        path: send
      }
    })
  }

  public duplicateCourseScheduling = async (params: IDuplicateCourseScheduling) => {
    try {

      const logs = []
      const courseScheduling = await CourseScheduling.findOne({_id: params.courseSchedulingId}).lean()
      if (!courseScheduling) return responseUtility.buildResponseFailed('json', null, { error_key: 'course_scheduling.not_found' })

      const newCourseSchedulingObj = {
        ...courseScheduling,
        _id: undefined,
        user: params.user || courseScheduling?.metadata?.user,
        endDate: courseScheduling?.endDate ? moment(courseScheduling.endDate).format('YYYY-MM-DD') : undefined,
        endDiscountDate: courseScheduling?.endDiscountDate ? moment(courseScheduling.endDiscountDate).format('YYYY-MM-DD') : undefined,
        endPublicationDate: courseScheduling?.endPublicationDate ? moment(courseScheduling.endPublicationDate).format('YYYY-MM-DD') : undefined,
        enrollmentDeadline: courseScheduling?.enrollmentDeadline ? moment(courseScheduling.enrollmentDeadline).format('YYYY-MM-DD') : undefined,
        moodle_id: undefined,
        sendEmail: false,
        schedulingAssociation: undefined
      }

      const newCourseSchedulingResponse = await this.insertOrUpdate(newCourseSchedulingObj, undefined, {
        shouldDuplicateSessions: true,
        originalScheduling: courseScheduling,
        itemsToDuplicate: params.itemsToDuplicate,
      })

      if (newCourseSchedulingResponse.status === 'error') return newCourseSchedulingResponse;

      return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
        newCourseScheduling: newCourseSchedulingResponse.scheduling,
        logs
      }})
    } catch (err) {
      return responseUtility.buildResponseFailed('json', null, {message: err?.getMessage() || 'Se ha presentado un error al duplicar'})
    }
  }

  public forceStatusService = async (params: IForceStatusService) => {
    try {

      const user = await User.findOne({_id: params.user}).select('id')
      if (!user) return responseUtility.buildResponseFailed('json', null, {error_key: 'user.not_found'})

      let status = undefined;
      switch (params.status) {
        case ForceStatus.PROGRAMMED:
          status = 'Programado'
          break;
        case ForceStatus.PROGRAMMED:
          status = 'Confirmado'
          break;
        case ForceStatus.PROGRAMMED:
          status = 'Ejecutado'
          break;
        case ForceStatus.PROGRAMMED:
          status = 'Cancelado'
          break;
        default:
          break;
      }

      if (!status) return responseUtility.buildResponseFailed('json', null, {error_key: 'course_scheduling.not_found'})

      const schedulingStatus = await CourseSchedulingStatus.findOne({name: status}).select('id')
      const courseScheduling = await CourseScheduling.findOne({_id: params.id})
      .populate({path: 'schedulingStatus', select: 'id name'})
      .select('id schedulingStatus')
      if (!courseScheduling) return responseUtility.buildResponseFailed('json', null, {error_key: 'course_scheduling.not_found'})

      if (courseScheduling?.schedulingStatus?.name === 'Confirmado') {
        await MailMessageLog.delete({
          notification_source: {
            $regex: `.*${courseScheduling.id}.*`,
            $options: 'i'
          } })
      }

      await CourseScheduling.findByIdAndUpdate(
        courseScheduling._id,
        {
          forceStatusTracking: {
            date: moment().format('YYYY-MM-DD'),
            personWhoForce: user._id,
          },
          schedulingStatus: schedulingStatus._id
        },
        {
          useFindAndModify: false,
          new: true,
          lean: true,
        }
      )
      return responseUtility.buildResponseSuccess('json')
    } catch (err) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  public reactivateService = async (params: IReactivateService) => {
    try {

      const user = await User.findOne({_id: params.user}).select('id')
      if (!user) return responseUtility.buildResponseFailed('json', null, {error_key: 'user.not_found'})

      const schedulingStatus = await CourseSchedulingStatus.findOne({name: 'Programado'}).select('id')
      const courseScheduling = await CourseScheduling.findOne({_id: params.id})
      .populate({path: 'schedulingStatus', select: 'id name'})
      .select('id schedulingStatus')
      if (!courseScheduling) return responseUtility.buildResponseFailed('json', null, {error_key: 'course_scheduling.not_found'})

      if (!courseScheduling?.schedulingStatus?.name) return responseUtility.buildResponseFailed('json', null, {error_key: 'course_scheduling.reactivate.invalid'})
      if (courseScheduling?.schedulingStatus?.name !== 'Cancelado') return responseUtility.buildResponseFailed('json', null, {error_key: 'course_scheduling.reactivate.invalid'})

      await CourseScheduling.findByIdAndUpdate(
        courseScheduling._id,
        {
          cancelationTracking: {
            date: undefined,
            personWhoCancels: undefined
          },
          reactivateTracking: {
            date: moment().format('YYYY-MM-DD'),
            personWhoReactivates: user._id,
          },
          schedulingStatus: schedulingStatus._id
        },
        {
          useFindAndModify: false,
          new: true,
          lean: true,
        }
      )
      return responseUtility.buildResponseSuccess('json')
    } catch (err) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  public duplicateService = async (params: IDuplicateService) => {
    try {

      const user = await User.findOne({_id: params.user}).select('id')
      if (!user) return responseUtility.buildResponseFailed('json', null, {error_key: 'user.not_found'})

      const duplicateResponse: any = await this.duplicateCourseScheduling({
        courseSchedulingId: params.id,
        itemsToDuplicate: params.itemsToDuplicate,
        user: user._id
      })

      if (duplicateResponse.status === 'error') return duplicateResponse;

      const newService = duplicateResponse.newCourseScheduling

      return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
        service: {
          serviceId: newService?.metadata?.service_id,
        }
      }})
    } catch (err) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  public changeSchedulingModular = async (params: IChangeSchedulingModular) => {
    try {
      if (!params.modularOrigin || !params.modularEnd) return responseUtility.buildResponseFailed('json', null, {message: 'Los parametros de modular son obligatorios'})
      const output = params.output || 'json'
      const courseSchedulingIds = params.courseSchedulings || []

      const schedulingUpdated = []
      const schedulingNotUpdated = []

      const courseSchedulings = await CourseScheduling.find({
        modular: params.modularOrigin
      })
      .select('id modular metadata.service_id')
      .lean()

      for (const courseScheduling of courseSchedulings) {
        try {
          if (courseSchedulingIds.length > 0) {
            if (!courseSchedulingIds.includes(courseScheduling._id.toString())) {
              schedulingNotUpdated.push({
                key: courseScheduling._id,
                message: `La programación no esta incluida en la lista permitida para actualizar`
              })
              continue;
            }
          }
          if (output === 'db') {
            const dataToUpdate = {
              modular: params.modularEnd
            }
            await CourseScheduling.findByIdAndUpdate(courseScheduling._id, dataToUpdate, {
              useFindAndModify: false,
              new: true,
              lean: true,
            })
          }
          schedulingUpdated.push({
            key: courseScheduling._id
          })
        } catch (err) {
          schedulingNotUpdated.push({
            key: courseScheduling._id,
            message: err?.message
          })
        }
      }

      return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
        schedulingFound: courseSchedulings,
        schedulingUpdated,
        schedulingNotUpdated,
      }})
    } catch (err) {
      return responseUtility.buildResponseFailed('json', null, {additional_parameters: {
        err
      }})
    }
  }

  public changeSchedulingElement = async (params: IChangeSchedulingElement) => {
    try {
      if (!params.databaseElement?.query) return responseUtility.buildResponseFailed('json', null, {message: 'La query a ejecutar es obligatoria'})
      if (!params.databaseElement?.update) return responseUtility.buildResponseFailed('json', null, {message: 'El valor de reemplazo es obligatorio'})

      const output = params.output || 'json'
      const courseSchedulingIds = params.courseSchedulings || []

      const schedulingUpdated = []
      const schedulingNotUpdated = []

      const courseSchedulings = await CourseScheduling.find(params.databaseElement.query)
      .lean()

      for (const courseScheduling of courseSchedulings) {
        try {
          if (courseSchedulingIds.length > 0) {
            if (!courseSchedulingIds.includes(courseScheduling._id.toString())) {
              schedulingNotUpdated.push({
                key: courseScheduling._id,
                message: `La programación no esta incluida en la lista permitida para actualizar`
              })
              continue;
            }
          }
          if (output === 'db') {
            await CourseScheduling.findByIdAndUpdate(courseScheduling._id, params.databaseElement.update, {
              useFindAndModify: false,
              new: true,
              lean: true,
            })
          }
          schedulingUpdated.push({
            key: courseScheduling._id
          })
        } catch (err) {
          schedulingNotUpdated.push({
            key: courseScheduling._id,
            message: err?.message
          })
        }
      }

      return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
        schedulingFound: courseSchedulings,
        schedulingUpdated,
        schedulingNotUpdated,
      }})
    } catch (err) {
      return responseUtility.buildResponseFailed('json', null, {additional_parameters: {
        err
      }})
    }
  }

  public downloadCalendar = async (params: IDownloadCalendar) => {
    try {
      const courseScheduling = await CourseScheduling.findOne({
        'metadata.service_id': params.service_id
      })
      const {scheduling}: any = await courseSchedulingDataService.fetchCourseSchedulingByProgram({
        moodle_id: courseScheduling?.moodle_id,
      })

      let schedulingsAvailable = []
      if (scheduling?.length) {
        schedulingsAvailable = scheduling.filter((scheduling: any) => !this.isSessionFinished(scheduling.startDate, scheduling.durationOnSeconds))
          ?.map((scheduling: any) => ({
            ...scheduling,
          }))
      }
      if (schedulingsAvailable.length === 0) return null;

      const calendar = ical({
        name: `Eventos programados servicio:${courseScheduling?.metadata?.service_id}`
      })

      const events = []

      schedulingsAvailable.forEach((schedule) => {
        const event = {
          start: new Date(schedule.startDate),
          end: new Date(schedule.endDate),
          summary: schedule.course_name,
          description: `Sesión de clase del curso ${schedule.course_name} dictada por ${schedule.teacher_name}. \n\n ID del servicio: ${params.service_id} \n Fecha de generación del calendario: ${moment().format('YYYY-MM-DD')}`,
          location: schedule?.address || undefined,
          url: `${customs?.campus_virtual}/app`
        }
        events.push(event)
        calendar.createEvent(event);
      })
      // console.log('events', events)
      return calendar.toString()
    } catch (error) {
      console.log('DownloadCalendar', error)
      return null
    }
  }

  private isSessionFinished = (startDate: string, duration: number): boolean => {
    if (!startDate) return true
    const end = moment(startDate).add(duration, 'seconds')
    return moment().isAfter(end)
  }
}

export const courseSchedulingService = new CourseSchedulingService();
export { CourseSchedulingService as DefaultAdminCourseCourseSchedulingService };
