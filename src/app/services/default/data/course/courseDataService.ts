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
import { Course, CourseScheduling, CourseSchedulingMode, CourseSchedulingType, Program } from '@scnode_app/models';
// @end

// @import types
import { IFetchCourses, IFetchCourse, IGenerateCourseFile, ICourse, ISlugType } from '@scnode_app/types/default/data/course/courseDataTypes'
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
      return responseUtility.buildResponseFailed('json')
    }
  }

  private fetchCourseByCourseScheduling = async (params: IFetchCourse) => {
    try {
      let select = 'id schedulingMode city program schedulingType schedulingStatus startDate endDate moodle_id hasCost priceCOP priceUSD discount startPublicationDate endPublicationDate enrollmentDeadline endDiscountDate duration'

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
          bottom: "15mm",
          left: "15mm"
        },
        footer: {
          height: "30px",
          // contents: `
          //   <div style="text-align: center">
          //     <img src="https://campus.icontecvirtual.edu.co/uploads/course-pdf/icontec_logo_color.png" style="height: 20px; width: 20px" alt="" />
          //     Another
          //   </div>
          // `,
          // contents: `<img src="https://campus.icontecvirtual.edu.co/uploads/course-pdf/icontec_logo_color.png" style="width: 80px; height: 20px; background-color: red;" alt="" />`
          // contents: `<img src="data:image/png;base64,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" style="width: 80px; height: 20px" alt="" />`
          // contents: '<div style="width:80px; height:25px; background-color:red; background: url("data:image/png;base64,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") no-repeat center center;"></div>'
          contents: `<div style="width:80px; height:25px; background-color:red; background: url('https://campus.icontecvirtual.edu.co/uploads/course-pdf/icontec_logo_color.png') no-repeat center center;"></div>`
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

      let select = 'id schedulingMode city program schedulingType schedulingStatus startDate endDate moodle_id hasCost priceCOP priceUSD discount startPublicationDate endPublicationDate enrollmentDeadline endDiscountDate duration'
      if (params.select) {
        select = params.select
      }

      let where: any = {
        schedulingType: { $in: schedulingTypesIds }
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

      if (params.highlighted) {
        const coursesHighlighted: any = await Course.find({ highlighted: true }).select('id program').lean()
        const programsHighlighted = coursesHighlighted.reduce((accum, element) => {
          accum.push(element.program)
          return accum;
        }, [])

        if (!where['program']) {
          where['program'] = { $in: programsHighlighted }
        } else if (!where['program']['$in']) {
          where['program']['$in'] = programsHighlighted
        } else {
          where['program']['$in'] = where['program']['$in'].concat(programsHighlighted)
        }
      }

      // @INFO: Filtro para Mode
      if (params.mode) {
        where['schedulingMode'] = params.mode
      }

      // @Filtro para precio
      if (params.price) {
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

      if (params.startDate) {
        let direction = 'gte'
        let date = moment()
        if (params.startDate.date !== 'today') {
          date = moment(params.startDate.date)
        }
        if (params.startDate.direction) direction = params.startDate.direction
        where['startDate'] = { [`$${direction}`]: date.format('YYYY-MM-DD') }
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
        registers = await CourseScheduling.find(where)
          .populate({ path: 'program', select: 'id name moodle_id code' })
          .populate({ path: 'schedulingMode', select: 'id name moodle_id' })
          .populate({ path: 'city', select: 'id name' })
          .skip(paging ? (pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0) : null)
          .limit(paging ? nPerPage : null)
          .sort(sort)
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
                accumCourses.push(schedule);
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


}

export const courseDataService = new CourseDataService();
export { CourseDataService as DefaultDataCourseCourseDataService };
