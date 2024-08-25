// @import_dependencies_node Import libraries
import moment from 'moment'
// @end

import { customs } from '@scnode_core/config/globals'

// @import services
import { courseService } from '@scnode_app/services/default/admin/course/courseService'
import { editorjsService } from '@scnode_app/services/default/general/editorjs/editorjsService'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { generalUtility } from '@scnode_core/utilities/generalUtility';
import { mapUtility } from '@scnode_core/utilities/mapUtility'
import { htmlPdfUtility } from '@scnode_core/utilities/pdf/htmlPdfUtility'
// @end

// @import models
import { Course, CourseScheduling, CourseSchedulingMode, CourseSchedulingType, Program, Term } from '@scnode_app/models';
// @end

// @import types
import { IFetchCourses, IFetchCourse, IGenerateCourseFile, ICourse, ISlugType, IFilterItem, IFetchCoursesByCourseSlug } from '@scnode_app/types/default/data/course/courseDataTypes'
import { CourseSchedulingModes } from '@scnode_app/types/default/admin/course/courseSchedulingModeTypes';
import { CourseSchedulingServiceTypeMap } from '@scnode_app/types/default/admin/course/courseSchedulingTypes';
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
      const slug_type = (params.slug_type) ? params.slug_type : 'course_scheduling'
      let courseResponse = null

      if (slug_type === 'course_scheduling') {
        courseResponse = await this.fetchCourseByCourseScheduling(params)
      } else if (slug_type === 'program') {
        courseResponse = await this.fetchCourseByProgram(params)
      }

      if (!courseResponse) return responseUtility.buildResponseFailed('json')
      if (courseResponse.status === 'error') return courseResponse

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          course: courseResponse.course,
        }
      })

    } catch (e) {
      console.log('courseDataService -> fetchCourse -> ERROR: ', e)
      return responseUtility.buildResponseFailed('json')
    }
  }

  private fetchCourseByCourseScheduling = async (params: IFetchCourse) => {
    try {
      let select = 'id schedulingMode city program schedulingType schedulingStatus startDate endDate moodle_id hasCost priceCOP priceUSD discount startPublicationDate endPublicationDate enrollmentDeadline endDiscountDate duration schedule'

      let where = {}

      if (params.id) {
        where['_id'] = params.id
      } else if (params.slug) {
        where['_id'] = params.slug
      } else {
        return responseUtility.buildResponseFailed('json', null, { error_key: 'course.filter_to_search_required' })
      }

      let register = null
      try {
        register = await CourseScheduling.findOne(where)
          .select(select)
          .populate({ path: 'program', select: 'id name moodle_id code' })
          .populate({ path: 'schedulingMode', select: 'id name moodle_id' })
          .populate({ path: 'schedulingType', select: 'id name' })
          .populate({ path: 'city', select: 'id name' })
          .lean()

        if (register) {
          register['enrollment_enabled'] = false
          register['slug_type'] = 'course_scheduling'

          const schedulingExtraInfo: any = await Course.findOne({
            program: register.program._id
          })
            .lean()

          if (schedulingExtraInfo) {
            let extra_info = schedulingExtraInfo
            extra_info.originalCoverUrl = extra_info.coverUrl
            extra_info.coverUrl = courseService.coverUrl(extra_info)
            register['extra_info'] = extra_info
          }

          const today = moment()
          if (register.enrollmentDeadline) {
            const enrollmentDeadline = moment(register.enrollmentDeadline.toISOString().replace('T23:59:59.999Z', ''))
            if (today.format('YYYY-MM-DD') <= enrollmentDeadline.format('YYYY-MM-DD')) {
              // if (register.schedulingType.name.toLowerCase() == 'abierto' && register.schedulingMode.name.toLowerCase() == 'virtual')
              if (register.schedulingType.name.toLowerCase() == 'abierto')
                register['enrollment_enabled'] = true
            }
          }
          if (register.endDiscountDate) {
            register.endDiscountDate = register.endDiscountDate.toISOString().replace('T00:00:00.000Z', '')
          }
        }
      } catch (e) { }

      if (!register) return responseUtility.buildResponseFailed('json')

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          course: register
        }
      })
    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  private fetchCourseByProgram = async (params: IFetchCourse) => {
    try {
      let where = {}

      if (params.id) {
        where['program'] = params.id
      } else if (params.slug) {
        where['program'] = params.slug
      } else {
        return responseUtility.buildResponseFailed('json', null, { error_key: 'course.filter_to_search_required' })
      }

      let register = null
      try {

        const schedulingExtraInfo: any = await Course.findOne(where)
          .populate({ path: 'program', select: 'id name code' })
          .populate({ path: 'schedulingMode', select: 'id name' })
          .lean()

        if (schedulingExtraInfo) {
          register = {
            _id: schedulingExtraInfo.program._id,
            slug_type: 'program',
            program: schedulingExtraInfo.program,
            schedulingMode: schedulingExtraInfo.schedulingMode
          }
          let extra_info = schedulingExtraInfo
          extra_info.originalCoverUrl = extra_info.coverUrl
          extra_info.coverUrl = courseService.coverUrl(extra_info)
          register['extra_info'] = extra_info
        }

      } catch (e) { }

      if (!register) return responseUtility.buildResponseFailed('json')

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          course: register
        }
      })
    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  public generateCourseFile = async (params: IGenerateCourseFile) => {
    try {
      const courseData: any = await this.fetchCourse({
        slug: params.slug,
        slug_type: params.slug_type
      })
      if (courseData.status === 'error') return courseData

      const file = await this.buildCourseFile(courseData.course, params.slug_type)

      return file
    } catch (e) {
      console.log('courseDataService -> generateCourseFile -> ERROR: ', e)
      return responseUtility.buildResponseFailed('json')
    }
  }

  private buildCourseFile = async (course: ICourse, slug_type: ISlugType) => {
    let path = '/data/course/courseReport'
    const time = new Date().getTime()

    let contentItems = []
    if (course?.extra_info?.content?.length) {
      for (const _item of course?.extra_info?.content) {
        contentItems.push({
          name: _item.name,
          content: (_item.data?.blocks) ? editorjsService.jsonToHtml(_item.data?.blocks) : _item.data
        })
      }
    }

    let scheduling = {};
    if (course.hasCost && course.priceCOP) {
      if (course.discount && course.endDiscountDate && moment().isSameOrBefore(moment.utc(course?.endDiscountDate).endOf('day'))) {
        scheduling['discount'] = course.discount
        scheduling['price_without_discount'] = this.getPrice(course, false)
        scheduling['price'] = this.getPrice(course, false)
        scheduling['discountLimit'] = `*Válido hasta <b>${moment.utc(course?.endDiscountDate).format('DD/MM/YYYY')}</b>. No es acumulable con otras promociones`
      }
      scheduling['price'] = this.getPrice(course)
    }

    if (course.startDate) {
      scheduling['startDate'] = moment(course?.startDate.toISOString().replace('T00:00:00.000Z', '')).format('DD/MM/YYYY')
    }

    if (course?.schedulingMode?.name) {
      scheduling['schedulingMode'] = course?.schedulingMode?.name
    }

    if (course?.city?.name) {
      scheduling['city'] = course?.city?.name
    }
    console.log('file', courseService.coverUrl({ coverUrl: course?.extra_info?.originalCoverUrl }, { format: 'file' }))
    const responsePdf = await htmlPdfUtility.generatePdf({
      from: 'file',
      file: {
        path,
        type: 'hbs',
        context: {
          title: course.program.name,
          // cover_url: course?.extra_info?.coverUrl ? course?.extra_info?.coverUrl : null,
          cover_url: courseService.coverUrl({ coverUrl: course?.extra_info?.originalCoverUrl }, { format: 'link' }),
          duration: course.duration ? generalUtility.getDurationFormated(course.duration, 'large') : null,
          long_description: course?.extra_info?.description?.blocks ? editorjsService.jsonToHtml(course.extra_info.description.blocks) : null,
          competencies: course?.extra_info?.competencies?.blocks ? editorjsService.jsonToHtml(course.extra_info.competencies.blocks) : null,
          objectives: course?.extra_info?.objectives?.blocks ? editorjsService.jsonToHtml(course?.extra_info?.objectives?.blocks) : null,
          content: contentItems.length > 0 ? contentItems : null,
          focus: course?.extra_info?.focus?.blocks ? editorjsService.jsonToHtml(course?.extra_info?.focus?.blocks) : null,
          materials: course?.extra_info?.materials?.blocks ? editorjsService.jsonToHtml(course?.extra_info?.materials?.blocks) : null,
          methodology: course?.extra_info?.methodology?.blocks ? editorjsService.jsonToHtml(course?.extra_info?.methodology?.blocks) : null,
          generalities: course?.extra_info?.generalities?.blocks ? editorjsService.jsonToHtml(course?.extra_info?.generalities?.blocks) : null,
          ...(course?.extra_info?.is_alternative_title_active && course?.extra_info?.alternative_title ? { alternativeName: course?.extra_info?.alternative_title } : {}),
          scheduling,
          customs,
        }
      },
      to_file: {
        file: {
          name: `${time}.pdf`,
        },
        path: 'data/course/courseReport'
      },
      options: {
        // orientation: "landscape",
        format: "Tabloid",
        base: `${customs['pdf_base']}/`,
        border: {
          top: "15mm",            // default is 0, units: mm, cm, in, px
          right: "15mm",
          bottom: "16mm",
          left: "15mm"
        },
        footer: {
          height: "30px",
          contents: `
            <div style="color:#0085CA; font-weight:700; text-align:center; font-family: 'Catamaran', sans-serif; font-size:16px; padding-top:8px;">
              ICONTEC
            </div>
          `,
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

  private getPrice = (course: ICourse, withDiscount: boolean = true) => {
    const price = course?.priceCOP
    const discount = course?.discount
    let finalPrice = ''
    if (!price) return null

    let priceWithIva = parseFloat(price.toString())
    if (customs['iva']) {
      priceWithIva = priceWithIva + ((priceWithIva * parseInt(customs['iva'])) / 100)
    }

    if (withDiscount === true && moment().isSameOrBefore(moment(course?.endDiscountDate).endOf('day'))) {
      if (discount) {
        const _priceFloat = parseFloat(Math.round(priceWithIva * (1 - (discount / 100))).toString());
        const currency = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP',  }).format(_priceFloat)
        finalPrice += currency.replace('.00', '').replace('COP', 'COP$').replace(/,/g,'.')
      } else {
        const currency = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP',  }).format(priceWithIva)
        finalPrice += currency.replace('.00', '').replace('COP', 'COP$').replace(/,/g,'.')
      }
    } else {
      const currency = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP',  }).format(priceWithIva)
      finalPrice += currency.replace('.00', '').replace('COP', 'COP$').replace(/,/g,'.')
    }
    return finalPrice
  }

  /**
   * Metodo que permite consultar las publicaciones
   * @param params Parametros que permiten consultar la data
   * @returns
   */
  public fetchCourses = async (params: IFetchCourses) => {

    try {
      let paging = (params.pageNumber && params.nPerPage) ? true : false

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

      let select = 'id schedulingMode city program schedulingType schedulingStatus startDate endDate moodle_id hasCost priceCOP priceUSD discount startPublicationDate endPublicationDate enrollmentDeadline endDiscountDate duration schedule withoutTutor quickLearning'
      if (params.select) {
        select = params.select
      }

      let where: any = {
        schedulingType: { $in: schedulingTypesIds }
      }

      const allowedCourses = await Course.find<ICourse>({ slug: { $exists: true } }).select('program')
      const allowedProgramIds = allowedCourses?.map(({ program }) => program)
      const arrayProgramsToIntersect = [allowedProgramIds]

      if (params.search) {
        const search = params.search
        const programs = await Program.find({
          name: { $regex: '.*' + search + '.*', $options: 'i' }
        }).select('id')
        const program_ids = programs.reduce((accum, element) => {
          accum.push(element._id)
          return accum
        }, [])
        arrayProgramsToIntersect.push(program_ids ? program_ids : [])
      }

      if (params.filterCategories?.length) {
        const coursesWithCategories = await Course.find<ICourse>({ filterCategories: { $in: params.filterCategories } })
        const currentFilterProgram = where['program']?.$in?.length ? where['program']?.$in : []
        const programsCategories = coursesWithCategories?.map((c) => c.program)?.length ? coursesWithCategories?.map((c) => c.program) : []
        const programsToFilter = currentFilterProgram?.length ? currentFilterProgram.filter(x => programsCategories.some(y => y.toString() === x.toString())) : programsCategories
        arrayProgramsToIntersect.push(programsToFilter)
      }

      if (params.highlighted) {
        const coursesHighlighted: any = await Course.find({ highlighted: true }).select('id program').lean()
        const programsHighlighted = coursesHighlighted.reduce((accum, element) => {
          accum.push(element.program)
          return accum;
        }, [])
        arrayProgramsToIntersect.push(programsHighlighted)
      }

      if (arrayProgramsToIntersect?.length > 1) {
        const programsIntersection = arrayProgramsToIntersect.reduce((acc, currArray) =>
          acc.filter(item => currArray.some(item2 => item2.toString() === item.toString()))
        )
        where['program'] = {
          $in: programsIntersection
        }
      } else {
        where['program'] = {
          $in: allowedProgramIds
        }
      }

      // @INFO: Filtro para Mode
      if (params.mode) {
        if (Array.isArray(params.mode)) {
          if (params.mode.length) {
            const modalitiesToSearch = params.mode?.filter(
              (mode) => ![CourseSchedulingServiceTypeMap.QUICK_LEARNING, CourseSchedulingServiceTypeMap.WITHOUT_TUTOR].includes(mode)
            )
            const searchQuickLearning = params.mode?.some((mode) => mode === CourseSchedulingServiceTypeMap.QUICK_LEARNING)
            const searchWithoutTutor = params.mode?.some((mode) => mode === CourseSchedulingServiceTypeMap.WITHOUT_TUTOR)
            where['$or'] = [
              ...(modalitiesToSearch?.length ? [{ schedulingMode: { $in: modalitiesToSearch } }] : []),
              ...(searchQuickLearning ? [{ quickLearning: true }] : []),
              ...(searchWithoutTutor ? [{ withoutTutor: true }] : []),
            ]
          }
        } else {
          where['schedulingMode'] = params.mode
        }
      }

      // @Filtro para precio
      if (params.price) {
        if (Array.isArray(params.price)) {
          if (params.price?.length) {
            const priceOrParam = []
            params.price?.forEach((priceItem) => {
              if (priceItem === 'free') {
                priceOrParam.push({ hasCost: false })
              } else if (priceItem === 'pay') {
                priceOrParam.push({ hasCost: true })
              } else if (priceItem === 'discount') {
                let date = moment()
                priceOrParam.push({ discount: { $gt: 0 }, endDiscountDate: { $gte: date.format('YYYY-MM-DD') } })
              }
            })
            where['$or'] = priceOrParam
          }
        } else {
          if (params.price === 'free') {
            where['hasCost'] = false
          } else if (params.price === 'pay') {
            where['hasCost'] = true
          } else if (params.price === 'discount') {
            let date = moment()
            where['discount'] = { $gt: 0 }
            where['endDiscountDate'] = { $gte: date.format('YYYY-MM-DD') }
          }
        }
      }

      // Filtro para Fecha de inicio de curso
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

      if (params.startDate && !params.endDate) {
        let direction = 'gte'
        let date = moment()
        if (params.startDate.date !== 'today') {
          date = moment(params.startDate.date)
        }
        if (params.startDate.direction) direction = params.startDate.direction
        where['startDate'] = { [`$${direction}`]: date.format('YYYY-MM-DD') }
      }

      if (params.endDate && !params.startDate) {
        let direction = 'lte'
        let date = moment()
        if (params.endDate.date !== 'today') {
          date = moment(params.endDate.date)
        }
        if (params.endDate.direction) direction = params.endDate.direction
        where['startDate'] = { [`$${direction}`]: date.format('YYYY-MM-DD') }
      }

      if (params.startDate?.direction && params.endDate?.direction) {
        const startDate = params.startDate
        const endDate = params.endDate
        where['startDate'] = {
          [`$${params.startDate.direction}`]: moment(startDate.date).format('YYYY-MM-DD'),
          [`$${params.endDate.direction}`]: moment(endDate.date).format('YYYY-MM-DD'),
        }
      }

      // @INFO: Filtro según ciudad
      if (params.city) {
        where['city'] = params.city
      }

      // @INFO: Filtro según regional
      if (params.regional) {
        where['regional'] = params.regional
      }

      if (params.modular) {
        where['modular'] = params.modular
      }

      if (params.exclude) {
        where['_id'] = { $nin: params.exclude }
      }

      if (typeof params.publish === 'boolean') {
        where['publish'] = params.publish
      }

      let sort = null
      if (params.sort) {
        sort = {}
        sort[params.sort.field] = params.sort.direction
      }

      let registers = []

      try {
        if (params.new) paging = false

        if (params.moreViewed) {
          const schedulingWithMoreViews = await this.getMoreViewedPrograms(where, nPerPage, pageNumber)
          if (schedulingWithMoreViews?.length) {
            where['_id'] = {
              $in: schedulingWithMoreViews
            }
          } else {
            where['_id'] = {
              $exists: false
            }
          }
        }


        registers = await CourseScheduling.find(where)
          .populate({ path: 'program', select: 'id name moodle_id code' })
          .populate({ path: 'schedulingMode', select: 'id name moodle_id' })
          .populate({ path: 'city', select: 'id name' })
          .skip(paging && !params.moreViewed ? (pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0) : null)
          .limit(paging && !params.moreViewed ? nPerPage : null)
          .sort(!params.moreViewed ? sort : null)
          .lean()

        if (params.random && params.random.size) {
          registers = mapUtility.shuffle(registers).slice(0, params.random.size)
        }

        const program_ids = registers.reduce((accum, element) => {
          accum.push(element.program._id.toString())
          return accum
        }, [])

        if (program_ids.length > 0) {
          const schedulingExtraInfo: any = await Course.find({
            program: { $in: program_ids }
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
            if (register.endDiscountDate) {
              register.endDiscountDate = register.endDiscountDate.toISOString().replace('T00:00:00.000Z', '')
            }
          }
        }

      } catch (e) { }

      // @INFO Filtrar solo los cursos nuevos
      if (params.new && registers && registers.length) {
        const newPaging = (params.pageNumber && params.nPerPage) ? true : false
        const programs = registers.map((r) => r.program._id)
        const courses = await Course.find({ program: { $in: programs } }).lean()
        registers = registers.reduce((accumCourses, schedule) => {
          if (courses && courses.length) {
            const course: any = courses.find((c: any) => c.program.toString() === schedule.program._id.toString())
            if (course) {
              const startNew = moment(course.new_start_date)
              const endNew = moment(course.new_end_date)
              const startPublic = moment(schedule.startPublicationDate)
              const endPublic = moment(schedule.endPublicationDate)
              const today = moment(new Date())
              if (today.isBetween(startNew, endNew) && today.isBetween(startPublic, endPublic)) {
                if (!newPaging || newPaging && accumCourses.length < params.nPerPage) {
                  accumCourses.push(schedule);
                }
              }
            }
          }
          return accumCourses;
        }, [])
      }

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          courses: [
            ...registers
          ],
          total_register: (paging) ? await CourseScheduling.find(where).count() : 0,
          pageNumber: pageNumber,
          nPerPage: nPerPage
        }
      })

    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  public getActivePublicFilter = async (params: IFetchCourses) => {
    try {
      const coursesResponse: any = await this.fetchCourses({
        ...params,
        nPerPage: '1000'
      })
      if (coursesResponse.status === 'error') return coursesResponse
      const courses = coursesResponse.courses?.length ? coursesResponse.courses : []
      const filterCategories = courses?.length ? courses?.map(
        (course) => course.extra_info.filterCategories?.length ? course.extra_info.filterCategories : []
      ).flat() : []
      const activeModalities = courses?.length ? courses.map(
        (course) => {
          if (course.schedulingMode?.name === CourseSchedulingModes.VIRTUAL) {
            if (course?.withoutTutor) {
              return {
                name: 'Virtual sin tutor',
                _id: 'withoutTutor'
              }
            } else if (course?.quickLearning) {
              return {
                name: 'Quick Learning',
                _id: 'quickLearning'
              }
            }
          }
          return {
            name: course.schedulingMode.name,
            _id: course.schedulingMode._id
          }
        }
      ).reduce((accum, item) => {
        if (!accum.some((modality) => modality.value === item._id)) {
          accum.push({
            name: item.name,
            value: item._id
          })
        }
        return accum
      }, []) : []
      const terms = await Term.find({ _id: { $in: filterCategories }, enabled: true }).sort({ position: 1 })
      const termCategories = await Term.find({ 'custom.typeRelated': { $in: terms?.map((t) => t.type) }, enabled: true, 'custom.publish': true }).sort({ position: 1 })
      const filters: IFilterItem[] = termCategories.map((term): IFilterItem => {
        return {
          name: term.name,
          value: term._id,
          type: term.type,
          typeRelated: term.custom.typeRelated,
          childs: terms.filter((childTerm) => childTerm.type === term.custom.typeRelated)
                    .map((childTerm) => ({ name: childTerm.name, value: childTerm._id }))
        }
      })
      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          activeModalities,
          filters,
        }
      })
    } catch (e) {
      console.log(`CourseDataService - getActivePublicFilter - ERROR: ${e}`)
      return responseUtility.buildResponseFailed('json')
    }
  }

  public fetchCoursesByCourseSlug = async ({ slug }: IFetchCoursesByCourseSlug) => {
    try {
      const course = await Course.findOne<ICourse>({ slug }).select('program')
      if (!course) return responseUtility.buildResponseFailed('json')
      const coursesResponse: any = await this.fetchCourses({
        startPublicationDate: {
          date: 'today',
          direction: 'lte'
        },
        endPublicationDate: {
          date: 'today',
          direction: 'gte'
        },
        publish: true,
        program: course.program as string
      })

      if (coursesResponse?.status === 'error') return coursesResponse

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          courses: coursesResponse.courses
        }
      })
    } catch (e) {
      console.log(`CourseDataService -> fetchCoursesByCourseSlug -> ERROR: ${e}`)
      return responseUtility.buildResponseFailed('json')
    }
  }

  private getMoreViewedPrograms = async (where: any, nPerPage: number, pageNumber: number): Promise<string[]> => {
    try {
      const schedulings = await CourseScheduling.find(where).select('program')
      const programIds = schedulings?.map(({program}) => program)
      const moreViewedPrograms = await CourseScheduling.aggregate([
        {
          $match: {
            program: { $in: programIds },
            deleted: false
          }
        },
        {
          $group: {
            _id: "$program",
            count: { $sum: 1 }
          }
        },
        {
          $sort: {
            count: -1
          }
        }
      ])
      const moreViewedProgramIds = moreViewedPrograms?.map(({ _id }) => _id.toString())
      schedulings?.sort((a, b) => {
        return moreViewedProgramIds?.indexOf(a.program.toString()) - moreViewedProgramIds?.indexOf(b.program.toString())
      })
      const idxStart = pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0
      const idxEnd = idxStart + nPerPage
      const schedulingIds = schedulings?.slice(idxStart, idxEnd)?.map(({_id}) => _id)

      return schedulingIds ? schedulingIds : []

    } catch (e) {
      console.log(`CourseDataService -> getMoreViewedPrograms -> ERROR: ${e}`)
      return []
    }
  }

}

export const courseDataService = new CourseDataService();
export { CourseDataService as DefaultDataCourseCourseDataService };
