// @import_dependencies_node Import libraries
import moment from 'moment'
// @end

// @import config
import { customs, moodle_setup } from '@scnode_core/config/globals'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { generalUtility } from '@scnode_core/utilities/generalUtility';
import { queryUtility } from '@scnode_core/utilities/queryUtility';
// @end

// @import services
import { uploadService } from '@scnode_core/services/default/global/uploadService'
import { courseSchedulingService } from '@scnode_app/services/default/admin/course/courseSchedulingService'
// @end

// @import models
import { Course, CourseScheduling, CourseSchedulingMode, Program, StoreCourse, CourseSchedulingType, CustomLog } from '@scnode_app/models'
// @end

// @import types
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes'
import { ICourse, ICourseQuery, ICourseDelete, IStoreCourse, IValidateSlugParams, COURSE_FORMATION_TYPE_TRANSLATIONS } from '@scnode_app/types/default/admin/course/courseTypes'
import { IMoodleCourse } from '@scnode_app/types/default/moodle/course/moodleCourseTypes'
import { moodleCourseService } from '@scnode_app/services/default/moodle/course/moodleCourseService'
import { IFetchCourses, IFetchCourse } from '@scnode_app/types/default/data/course/courseDataTypes'
import { utils } from 'xlsx/types';
import { CourseSchedulingModes } from '@scnode_app/types/default/admin/course/courseSchedulingModeTypes';
import { customLogService } from '@scnode_app/services/default/admin/customLog/customLogService';
import { mailService } from '@scnode_app/services/default/general/mail/mailService';
import { CourseSchedulingTypesNames } from '@scnode_app/types/default/admin/course/courseSchedulingTypes';
// @end

class CourseService {

  private default_cover_path = 'courses'

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

      let select = 'id schedulingMode program courseType short_description alternative_title is_alternative_title_active platform_video url_video description coverUrl competencies objectives content focus materials important_info methodology generalities highlighted new_start_date new_end_date duration filterCategories slug formationType'
      if (params.query === QueryValues.ALL) {
        const registers: any = await Course.find(where)
          .populate({ path: 'schedulingMode', select: 'id name moodle_id' })
          .populate({ path: 'program', select: 'id name moodle_id code' })
          .select(select)
          .lean()

        for await (const register of registers) {
          if (register.coverUrl) {
            register.coverUrl = this.coverUrl(register)
          }
        }

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            courses: registers
          }
        })
      } else if (params.query === QueryValues.ONE) {
        const register: any = await Course.findOne(where)
          .populate({ path: 'schedulingMode', select: 'id name moodle_id' })
          .populate({ path: 'program', select: 'id name moodle_id code' })
          .select(select)
          .lean()

        if (!register) return responseUtility.buildResponseFailed('json', null, { error_key: 'course.not_found' })

        if (register.coverUrl) {
          register.coverUrl = this.coverUrl(register)
        }

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            course: register
          }
        })
      }

      return responseUtility.buildResponseFailed('json')
    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * !Important: Este metodo es usado unicamente por hipertexto(tienda virtual) y solo debe ser modificada por solicitud externa
   * Metodo que permite listar todos los registros
   * @param [filters] Estructura de filtros para la consulta
   * @returns
   */
  public list = async (params: IFetchCourses = {}) => {

    try {
      let listOfCourses = []
      const logContentToSave = []
      const paging = (params.pageNumber && params.nPerPage) ? true : false

      const pageNumber = params.pageNumber ? (parseInt(params.pageNumber)) : 1
      const nPerPage = params.nPerPage ? (parseInt(params.nPerPage)) : 10

      const schedulingTypes = await CourseSchedulingType.find({ name: { $in: ['Abierto'] } })
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

      let select = 'id schedulingMode program courseType objectives generalities content schedulingType schedulingStatus startDate endDate moodle_id hasCost priceCOP priceUSD discount startPublicationDate endPublicationDate enrollmentDeadline slug formationType'
      if (params.select) {
        select = params.select
      }

      let where: any = {
        schedulingType: { $in: schedulingTypesIds },
      }

      if (params.search) {
        const search = params.search
        const programs = await Program.find({
          name: { $regex: '.*' + search + '.*', $options: 'i' }
        }).select('id')
        const program_ids = programs.reduce((accum, element) => {
          accum.push(element._id)
          return accum
        }, [])
        where['program'] = { $in: program_ids }
      }

      if (params.mode) {
        where['schedulingMode'] = params.mode
      }

      if (params.price) {
        if (params.price === 'free') {
          where['hasCost'] = false
        } else if (params.price === 'pay') {
          where['hasCost'] = true
        }
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
          .populate({ path: 'modular', select: 'id name' })
          .skip(paging ? (pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0) : null)
          .limit(paging ? nPerPage : null)
          .sort(sort)
          .lean()

        const publishedSchedules = await CourseScheduling.find({
            ...where,
            endPublicationDate: { [`$gte`]: moment().format('YYYY-MM-DD') },
            startPublicationDate: { [`$lte`]: moment().format('YYYY-MM-DD') },
            publish: true,
          })
          .select('_id')
          .lean()
        const publishedSchedulingIds = publishedSchedules?.map((scheduling) => scheduling._id.toString())

        // Obtener todos los program IDs para hacer una sola consulta
        const programIds = registers.map(register => register.program._id);

        // Realizar una sola consulta para obtener todos los cursos relacionados
        const coursesInfo: any = await Course.find({
          program: { $in: programIds }
        });

        // Crear un mapa para acceso rápido
        const courseInfoMap = {};
        coursesInfo.forEach(course => {
          courseInfoMap[course.program.toString()] = course;
        });

        for await (const register of registers) {
          let isActive = false;
          let courseType = ''
          let courseObjectives = [];
          let courseContent = [];
          let generalities = [];
          let description = ''
          let shortDescription = ''
          let formationType = null
          const serviceId = register?.metadata?.service_id;

          const schedulingExtraInfo = courseInfoMap[register.program._id.toString()];

          if (schedulingExtraInfo) {
            let extra_info = schedulingExtraInfo;
            courseType = extra_info.courseType;

            // Objectives
            extra_info.objectives.blocks.forEach(element => {
              if (element.data.items) {
                courseObjectives.push(element.data.items[0]);
              }
              if (element.data.text?.length) {
                courseObjectives.push(element.data.text);
              }
            });;

            // Course content
            extra_info.content.forEach(element => {
              let blockText = [];
              element.data.blocks.forEach(element => {
                blockText.push(element.data.text);
              });

              let item = {
                header: element.name,
                modules: blockText
              };
              courseContent.push(item);
            });

            // Generalities
            extra_info.generalities.blocks.forEach(element => {
              generalities.push(element.data.text);
            });

            description = extra_info.description.blocks?.map((block) => block?.data?.text)?.join(' ')
            shortDescription = extra_info.short_description.blocks?.map((block) => block?.data?.text)?.join(' ')
            if (register?.withoutTutor) {
              formationType = CourseSchedulingTypesNames.WITHOUT_TUTOR
            } else if (register?.quickLearning) {
              formationType = CourseSchedulingTypesNames.QUICK_LEARNING
            } else if (extra_info.formationType?.length) {
              formationType = COURSE_FORMATION_TYPE_TRANSLATIONS[extra_info.formationType]
            }
          }

          if (register.hasCost) {
            if (publishedSchedulingIds?.includes(register?._id?.toString())) {
              if ([CourseSchedulingModes.VIRTUAL, CourseSchedulingModes.ON_LINE].includes(register.schedulingMode.name))
                isActive = true;
              else
                isActive = false;
            }
            else
              isActive = false;
          }
          else {
            isActive = false;
          }

          const {serviceTypeLabel} = courseSchedulingService.getServiceType(register)

          let courseToExport: IStoreCourse = {
            id: register._id,
            serviceId,
            moodleID: register.moodle_id,
            name: register.program.name,
            fullname: register.program.name,
            displayname: register.program.name,
            courseType: courseType,
            mode: register.schedulingMode.name,
            startDate: register.startDate,
            endDate: register.endDate,
            startPublicationDate: register.startPublicationDate,
            endPublicationDate: register.endPublicationDate,
            maxEnrollmentDate: register.enrollmentDeadline,
            hasCost: register.hasCost,
            priceCOP: register.priceCOP == null ? 0 : register.priceCOP,
            priceUSD: register.priceUSD == null ? 0 : register.priceUSD,
            discount: register.discount == null ? 0 : register.discount,
            endDiscountDate: register.endDiscountDate == null ? null : register.endDiscountDate,
            quota: register.amountParticipants,
            lang: 'ES',
            duration: generalUtility.getDurationFormatedForVirtualStore(register.duration),
            isActive,
            objectives: courseObjectives,
            content: courseContent,
            generalities: generalities,
            schedule: register.schedule,
            description,
            shortDescription,
            modular: register?.modular?.name ? register?.modular?.name : '',
            withoutTutor: register.schedulingMode.name === CourseSchedulingModes.VIRTUAL ? register?.withoutTutor : false,
            quickLearning: register.schedulingMode.name === CourseSchedulingModes.VIRTUAL ? register?.quickLearning : false,
            serviceType: serviceTypeLabel,
            formationType,
            serviceOffer: register?.serviceInformation?.length ? register?.serviceInformation : null,
            serviceOfferLong: register?.longServiceInformation?.length ? register?.longServiceInformation : null,
          }
          listOfCourses.push(courseToExport);
          if (courseToExport?.isActive) {
            logContentToSave.push({
              name: register.program.name,
              mode: register.schedulingMode.name,
              serviceId: register?.metadata?.service_id,
              startDate: moment.utc(register.startDate).format('YYYY-MM-DD'),
              modality: register.schedulingMode.name,
            })
          }
        }
      } catch (e) {
        console.log('Error: ' + e);
        return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'program.general_error', params: { error: e } } });
      }

      if (!params.notSendNotification) {
        await this.saveLogAndSendHipertextoEmail(logContentToSave)
      }

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          courses: [
            ...listOfCourses
          ],
          total_register: listOfCourses.length,
          pageNumber: pageNumber,
          nPerPage: nPerPage
        }
      })
    }
    catch (e) {
      console.log('Error: ' + e);
      return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'program.general_error', params: { error: e } } });
    }


  }

  private saveLogAndSendHipertextoEmail = async (logContentToSave) => {
    try {
      const notificationData = {
        activeCourses: logContentToSave,
        coursesWithVisibilityChange: []
      }
      const logsResponse = await CustomLog.find({ label: "csth - active courses sent to hipertexto" })
        .sort({ created_at: -1 })
        .limit(1)
      if (logsResponse?.length) {
        const lastLogSaved = logsResponse[0]
        if (lastLogSaved?.content?.length) {
          const lastContent = lastLogSaved.content
          notificationData.coursesWithVisibilityChange = lastContent.filter((course) => !notificationData.activeCourses?.some((activeCourse) => activeCourse.serviceId === course.serviceId))
        }
      }
      await customLogService.create({
        content: logContentToSave,
        label: 'csth - active courses sent to hipertexto',
        description: 'Cursos activos que son enviados a hipertexto'
      })

      const emailsToSend = customs?.mailer?.email_courses_sent_to_hipertexto
      if (!emailsToSend?.length) {
        return
      }

      const params = {
        activeCourses: notificationData.activeCourses?.length ? notificationData.activeCourses : null,
        coursesWithVisibilityChange: notificationData.coursesWithVisibilityChange?.length ? notificationData.coursesWithVisibilityChange : null,
      }

      const mail = await mailService.sendMail({
        emails: emailsToSend?.map(({ email }) => email),
        mailOptions: {
          // @ts-ignore
          subject: 'Cursos publicados en tienda',
          html_template: {
            path_layout: 'icontec',
            path_template: 'course/coursesSentToHipertexto',
            params,
          },
          amount_notifications: null,
        },
        notification_source: 'courses_sent_to_hipertexto_notification'
      })

      return mail
    } catch (e) {
      console.log('CourseService -> saveLogAndSendHipertextoEmail -> ERROR: ', e)
    }
  }


  /**
   * Metodo que permite listar todos los registros
   * @param [filters] Estructura de filtros para la consulta
   * @returns
   */
  public listOfCourseCards = async (filters: ICourseQuery = {}) => {

    const paging = (filters.pageNumber && filters.nPerPage) ? true : false

    const pageNumber = filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage = filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let where = {}
    let select = 'id schedulingMode program courseType description coverUrl competencies objectives content focus materials important_info methodology generalities highlighted new_start_date new_end_date filterCategories slug formationType'
    if (filters.select) {
      select = filters.select
    }

    if (filters.course_scheduling_code) {
      const programs = await Program.find({ code: { $regex: '.*' + filters.course_scheduling_code + '.*', $options: 'i' } }).select('id')
      const program_ids = programs.reduce((accum, element) => {
        accum.push(element._id)
        return accum
      }, [])
      where['program'] = { $in: program_ids }
    }

    if (filters.schedulingMode) where['schedulingMode'] = filters.schedulingMode
    if (filters?.program) where['program'] = filters.program

    let registers = []
    try {
      registers = await Course.find(where)
        .select(select)
        .populate({ path: 'schedulingMode', select: 'id name moodle_id' })
        .populate({ path: 'program', select: 'id name moodle_id code' })
        .skip(paging ? (pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0) : null)
        .limit(paging ? nPerPage : null)
        .sort({ created_at: -1 })
        .lean()

      for await (const register of registers) {
        if (register.coverUrl) {
          register.coverUrl = this.coverUrl(register)
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
  }



  /**
   * Metodo que permite insertar/actualizar un registro
   * @param params Elementos a registrar
   * @returns
   */
  public insertOrUpdate = async (params: ICourse) => {
    try {

      if (params.program && typeof params.program === 'string') params.program = JSON.parse(params.program)
      if (params.schedulingMode && typeof params.schedulingMode === 'string') params.schedulingMode = JSON.parse(params.schedulingMode)
      if (params.description && typeof params.description === 'string') params.description = JSON.parse(params.description)
      if (params.short_description && typeof params.short_description === 'string') params.short_description = JSON.parse(params.short_description)
      if (params.competencies && typeof params.competencies === 'string') params.competencies = JSON.parse(params.competencies)
      if (params.objectives && typeof params.objectives === 'string') params.objectives = JSON.parse(params.objectives)
      if (params.content && typeof params.content === 'string') params.content = JSON.parse(params.content)
      if (params.focus && typeof params.focus === 'string') params.focus = JSON.parse(params.focus)
      if (params.materials && typeof params.materials === 'string') params.materials = JSON.parse(params.materials)
      if (params.important_info && typeof params.important_info === 'string') params.important_info = JSON.parse(params.important_info)
      if (params.methodology && typeof params.methodology === 'string') params.methodology = JSON.parse(params.methodology)
      if (params.generalities && typeof params.generalities === 'string') params.generalities = JSON.parse(params.generalities)

      // alternative_title
      // short_description
      // platform_video
      // url_video

      if (Array.isArray(params.content)) {
        params.content = params.content.map((c) => {
          try {
            if (c.data && typeof c.data === 'string') c.data = JSON.parse(c.data)
          } catch (e) { }
          return c;
        }, [])
      }
      if (params.schedulingMode && typeof params.schedulingMode !== "string" && params.schedulingMode.hasOwnProperty('value')) {
        // TODO: Modificar para que se ajuste a presencial - en linea
        params.schedulingMode = await courseSchedulingService.saveLocalSchedulingMode(params.schedulingMode, null)
      }

      if (params.program && typeof params.program !== "string" && params.program.hasOwnProperty('value')) {
        params.program = await courseSchedulingService.saveLocalProgram(params.program)
      } else if (params?.forceProgram) {
        params.program = params.forceProgram
      }

      // @INFO: Cargando imagen al servidor
      if (params.coverFile) {
        const defaulPath = this.default_cover_path
        const response_upload: any = await uploadService.uploadFile(params.coverFile, defaulPath)
        if (response_upload.status === 'error') return response_upload
        if (response_upload.hasOwnProperty('name')) params.coverUrl = response_upload.name
      }

      if (params.filterCategories) {
        params.filterCategories = typeof params.filterCategories === 'string' ? JSON.parse(params.filterCategories) : params.filterCategories
      }

      if (params.id) {
        const register: any = await Course.findOne({ _id: params.id })
        if (!register) return responseUtility.buildResponseFailed('json', null, { error_key: 'course.not_found' })

        // @INFO: Validando nombre unico
        // if (params.name) {
        //   const exist = await Course.findOne({ name: params.name, _id: { $ne: params.id } })
        //   if (exist) return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'course.insertOrUpdate.already_exists', params: { name: params.name } } })
        // }

        // @INFO: Validando programa unico
        if (params.program) {
          const exist = await Course.findOne({ program: params.program, _id: { $ne: params.id } })
          if (exist) return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'course.insertOrUpdate.already_exists' } })
        }

        const response: any = await Course.findByIdAndUpdate(params.id, params, { useFindAndModify: false, new: true })
        await CourseSchedulingMode.populate(response, { path: 'schedulingMode', select: 'id name moodle_id' })
        await Program.populate(response, { path: 'program', select: 'id name moodle_id code' })

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            course: {
              ...response,
            }
          }
        })

      } else {

        // const categoryIdMoodle = 12;
        // @INFO: Validando programa unico
        if (params.program) {
          const exist = await Course.findOne({ program: params.program })
          if (exist) return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'course.insertOrUpdate.already_exists' } })
        }

        // const startDate = Math.floor(Date.parse(params.startDate) / 1000.0);
        // const endDate = Math.floor(Date.parse(params.endDate) / 1000.0);

        // A. Creación de Curso en Campus Digital
        const { _id } = await Course.create(params);

        const response: any = await Course.findOne({ _id })
          .populate({ path: 'schedulingMode', select: 'id name moodle_id' })
          .populate({ path: 'program', select: 'id name moodle_id code' })
          .lean()

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            course: {
              ...response
            }
          }
        })

        //   // @INFO: Parámetros para enviar al endpoint de Moodle (core_course_create_courses)
        //   const paramsMoodleCourse: IMoodleCourse = {
        //     shortName: params.name,
        //     fullName: params.fullname,
        //     summary: params.description,
        //     startDate: startDate,
        //     endDate: endDate,
        //     lang: params.lang,
        //     categoryId: categoryIdMoodle,
        //     idNumber: respCampusCourseCreate._id.toString(),
        //   }
        //   const respMoodle: any = await moodleCourseService.insert(paramsMoodleCourse);

        //   if (respMoodle.error_key) {

        //     // @INFO: En caso de error borro el curso creado
        //     await this.delete({id: respCampusCourseCreate._id})

        //     console.log("Error: " + respMoodle.exception + ". " + respMoodle.message);

        //     return responseUtility.buildResponseSuccess('json', null,{error_key: respMoodle})
        //   }
        //   else {
        //     console.log("Moodle: creación de curso exitosa");
        //     console.log(respMoodle);

        //     // @Actualizar el curso en CampusDigital con el ID de curso en Moodle.
        //     respCampusCourseCreate.moodleID = respMoodle.course.id
        //     respCampusCourseCreate.save()

        //     return responseUtility.buildResponseSuccess('json', null, {
        //       additional_parameters: {
        //         course: {
        //           _id: respMoodle.course.id,
        //           name: respMoodle.course.name,
        //           idNumber: paramsMoodleCourse.idNumber
        //         }
        //       }
        //     })
        //   }

        //   //#endregion
      }

    } catch (e) {
      console.log('[courseService] [insertOrUpdate] ERROR: ', e)
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
 * Metodo que permite hacer borrar un registro
 * @param params Filtros para eliminar
 * @returns
 */
  public delete = async (params: ICourseDelete) => {
    try {
      const find: any = await Course.findOne({ _id: params.id })
      if (!find) return responseUtility.buildResponseFailed('json', null, { error_key: 'course.not_found' })

      await find.delete()

      return responseUtility.buildResponseSuccess('json')
    } catch (error) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que convierte el valor del cover de un curso a la URL donde se aloja el recurso
   * @param {config} Objeto con data del Course
   */
  public coverUrl = ({ coverUrl }, options?: any) => {
    const format = (options?.format) ? options.format : 'link'
    let base = customs['uploads']
    if (format === 'file') {
      base = customs['pdf_base']
    }
    return coverUrl && coverUrl !== ''
      ? `${base}/${this.default_cover_path}/${coverUrl}`
      : `${base}/${this.default_cover_path}/default.jpg`
  }

  public validateSlug = async ({ courseId, slug }: IValidateSlugParams) => {
    try {
      const course = await Course.findOne({
        _id: { $ne: courseId },
        slug,
      })
      if (course) return responseUtility.buildResponseFailed('json')
      return responseUtility.buildResponseSuccess('json', null, {
    additional_parameters: {
      message: 'ok'
    }})
    } catch (e) {
      console.log(`CourseService -> validateSlug -> Error: `, e)
      return responseUtility.buildResponseFailed('json')
    }
  }

}

export const courseService = new CourseService();
export { CourseService as DefaultAdminCourseCourseService };
