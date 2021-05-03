// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { queryUtility } from '@scnode_core/utilities/queryUtility';
import { moodle_setup } from '@scnode_core/config/globals';
// @end

// @import models
import { Course } from '@scnode_app/models'
// @end

// @import types
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes'
import { ICourse, ICourseQuery, ICourseDelete } from '@scnode_app/types/default/admin/course/courseTypes'
import { Console } from 'console';
import { stringify } from 'querystring';
//import { generalUtility } from 'core/utilities/generalUtility';
// @end

class CourseService {

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

      let select = 'id name description startDate endDate maxEnrollmentDate priceCOP priceUSD discount'
      if (params.query === QueryValues.ALL) {
        const registers = await Course.find(where).select(select)
        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            courses: registers
          }
        })
      } else if (params.query === QueryValues.ONE) {
        const register = await Course.findOne(where).select(select)
        if (!register) return responseUtility.buildResponseFailed('json', null, { error_key: 'course.not_found' })
        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            courses: register
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

    let queryMoodle = await queryUtility.query({ method: 'get', url: '', api: 'moodle', params: { wstoken: moodle_setup.wstoken, wsfunction: moodle_setup.services.courses.get, moodlewsrestformat: moodle_setup.restformat } });
    // Sincronizar búsquda en CV con datos en el Moodle.

    const paging = (filters.pageNumber && filters.nPerPage) ? true : false

    const pageNumber = filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage = filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let select = 'id name fullname displayname description courseType mode startDate endDate maxEnrollmentDate priceCOP priceUSD discount quota lang'
    if (filters.select) {
      select = filters.select
    }

    let where = {}

    if (filters.search) {
      const search = filters.search
      where = {
        ...where,
        $or: [
          { name: { $regex: '.*' + search + '.*', $options: 'i' } },
          { description: { $regex: '.*' + search + '.*', $options: 'i' } },
        ]
      }
    }

    let registers = []
    try {
      registers = await Course.find(where)
        .select(select)
        .skip(paging ? (pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0) : null)
        .limit(paging ? nPerPage : null)
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
      if (params.id) {
        const register = await Course.findOne({ _id: params.id })
        if (!register) return responseUtility.buildResponseFailed('json', null, { error_key: 'course.not_found' })

        // @INFO: Validando nombre unico
        if (params.name) {
          const exist = await Course.findOne({ name: params.name, _id: { $ne: params.id } })
          if (exist) return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'course.insertOrUpdate.already_exists', params: { name: params.name } } })
        }

        const response: any = await Course.findByIdAndUpdate(params.id, params, { useFindAndModify: false, new: true })

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            course: {
              _id: response._id,
              name: response.name,
              description: response.description
            }
          }
        })

      } else {


        const exist = await Course.findOne({ name: params.name })
        if (exist) return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'course.insertOrUpdate.already_exists', params: { name: params.name } } })

        console.log("*****");
        console.log("Data from Request: " + JSON.stringify(params));
        console.log("*****");

        const response: any = await Course.create(params);

        var startDate = Math.floor(Date.parse(params.startDate) / 1000.0);
        ///generalUtility.timeUnix(params.startDate);
        var endDate =  Math.floor(Date.parse(params.endDate) / 1000.0);
        //generalUtility.timeUnix(params.endDate);


        console.log("FROM: " + startDate);
        console.log("DATE: " + endDate);

        // moodle rechaza la creación del urso y no espeicifca el KeyValue errado.
        let moodleParams = {
          wstoken: moodle_setup.wstoken,
          wsfunction: moodle_setup.services.courses.create,
          moodlewsrestformat: moodle_setup.restformat,
          'courses[0][idnumber]': response._id,
          'courses[0][shortname]': params.name,
          'courses[0][fullname]': params.fullname,
          'courses[0][categoryid]': 9,
          'courses[0][summary]': params.description,
          'courses[0][startdate]': startDate,
          'courses[0][enddate]': endDate,
          'courses[0][lang]': params.lang
        };
        var respCourseMoodle = await queryUtility.query({ method: 'post', url: '', api: 'moodle', params: moodleParams });
        console.log("Curso Moodle: " + respCourseMoodle);

        console.log("*****");
        console.log("Data from Request: " + JSON.stringify(respCourseMoodle));
        console.log("*****");
        if (respCourseMoodle.exception) {
          console.log("Error: " + respCourseMoodle.exception + ". " + respCourseMoodle.message);

          return responseUtility.buildResponseSuccess('json', null,
            {
              error_key: respCourseMoodle
            })

        }
        else {
          console.log("Moodle: creación de curso exitosa");

          return responseUtility.buildResponseSuccess('json', null, {
            additional_parameters: {
              course: {
                _id: response._id,
                name: response.name
              }
            }
          })
        }


      }

    } catch (e) {
      console.log("error: " + e);
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

}

export const courseService = new CourseService();
export { CourseService as DefaultAdminCourseCourseService };
