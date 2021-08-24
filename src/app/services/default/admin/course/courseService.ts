// @import_dependencies_node Import libraries
// @end

// @import config
import { customs, moodle_setup } from '@scnode_core/config/globals'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { queryUtility } from '@scnode_core/utilities/queryUtility';
// @end

// @import services
import { uploadService } from '@scnode_core/services/default/global/uploadService'
import { courseSchedulingService } from '@scnode_app/services/default/admin/course/courseSchedulingService'
// @end

// @import models
import { Course, CourseSchedulingMode, Program, StoreCourse } from '@scnode_app/models'
// @end

// @import types
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes'
import { ICourse, ICourseQuery, ICourseDelete, IStoreCourse } from '@scnode_app/types/default/admin/course/courseTypes'
import { IMoodleCourse } from '@scnode_app/types/default/moodle/course/moodleCourseTypes'
import { moodleCourseService } from '@scnode_app/services/default/moodle/course/moodleCourseService'
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

      let select = 'id schedulingMode program description coverUrl generalities requirements content'
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
   * Metodo que permite listar todos los registros
   * @param [filters] Estructura de filtros para la consulta
   * @returns
   */
  public list = async (filters: ICourseQuery = {}) => {
    console.log("List of available courses:")

    let listOfCourses = []
    //let courseToExport;

    const paging = (filters.pageNumber && filters.nPerPage) ? true : false

    const pageNumber = filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage = filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let select = 'id schedulingMode program description coverUrl generalities requirements content'
    // let select = 'id moodleID name fullname displayname description courseType mode startDate endDate maxEnrollmentDate hasCost priceCOP priceUSD discount quota lang duration coverUrl content '
    if (filters.select) {
      select = filters.select
    }

    let where = {}
    let registers = []
    try {
      registers = await Course.find(where)
        .select(select)
        .populate({ path: 'schedulingMode', select: 'id name moodle_id' })
        .populate({ path: 'program', select: 'id name moodle_id code' })
        //.populate({ path: 'course_scheduling', select: 'id program startDate endDate schedulingStatus ' })
        .skip(paging ? (pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0) : null)
        .limit(paging ? nPerPage : null)
        .sort({ created_at: -1 })
        .lean()

      for await (const register of registers) {
        console.log(register );

        let courseToExport: IStoreCourse = {
          moodleID: register.program.moodle_id,
          name: register.program.name,
          fullname: register.program.name,
          displayname: register.program.name,
          description: register.description,
          courseType: "",
          mode: register.schedulingMode.name,
          startDate: "",//register.course_scheduling.startDate,
          endDate: "",//register.course_scheduling.endDate,
          maxEnrollmentDate: "",
          hasCost: false,
          priceCOP: 0,
          priceUSD: 0,
          discount: 0,
          quota: 0,
          lang: 'ES'
        }
        listOfCourses.push(courseToExport);

      }
    } catch (e) { }

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        courses: [
          ...listOfCourses
        ],
        total_register: (paging) ? await Course.find(where).count() : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    })

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

    let select = 'id schedulingMode program description coverUrl generalities requirements content'
    // let select = 'id moodleID name fullname displayname description courseType mode startDate endDate maxEnrollmentDate hasCost priceCOP priceUSD discount quota lang duration coverUrl content '
    if (filters.select) {
      select = filters.select
    }

    let where = {}
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

      if (params.content && typeof params.content === 'string') params.content = JSON.parse(params.content)
      if (params.generalities && typeof params.generalities === 'string') params.generalities = JSON.parse(params.generalities)
      if (params.requirements && typeof params.requirements === 'string') params.requirements = JSON.parse(params.requirements)
      if (params.program && typeof params.program === 'string') params.program = JSON.parse(params.program)
      if (params.schedulingMode && typeof params.schedulingMode === 'string') params.schedulingMode = JSON.parse(params.schedulingMode)

      if (params.schedulingMode && typeof params.schedulingMode !== "string" && params.schedulingMode.hasOwnProperty('value')) {
        params.schedulingMode = await courseSchedulingService.saveLocalSchedulingMode(params.schedulingMode)
      }

      if (params.program && typeof params.program !== "string" && params.program.hasOwnProperty('value')) {
        params.program = await courseSchedulingService.saveLocalProgram(params.program)
      }

      // @INFO: Cargando imagen al servidor
      if (params.coverFile) {
        const defaulPath = this.default_cover_path
        const response_upload: any = await uploadService.uploadFile(params.coverFile, defaulPath)
        if (response_upload.status === 'error') return response_upload
        if (response_upload.hasOwnProperty('name')) params.coverUrl = response_upload.name
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
  public coverUrl = ({ coverUrl }) => {
    return coverUrl && coverUrl !== ''
      ? `${customs['uploads']}/${this.default_cover_path}/${coverUrl}`
      : `${customs['uploads']}/${this.default_cover_path}/default.jpg`
  }

}

export const courseService = new CourseService();
export { CourseService as DefaultAdminCourseCourseService };
