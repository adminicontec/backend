// @import_dependencies_node Import libraries
import moment from 'moment'
// @end

// @import services
import { courseService } from '@scnode_app/services/default/admin/course/courseService'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import { Course } from '@scnode_app/models';
// @end

// @import types
import { QueryValues } from '@scnode_app/types/default/global/queryTypes'
import { IFetchCourses } from '@scnode_app/types/default/data/course/courseDataTypes'
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
   * Metodo que permite consultar las publicaciones
   * @param params Parametros que permiten consultar la data
   * @returns
   */
  public fetchCourses = async (params: IFetchCourses) => {

    try {
      const paging = (params.pageNumber && params.nPerPage) ? true : false

      const pageNumber = params.pageNumber ? (parseInt(params.pageNumber)) : 1
      const nPerPage = params.nPerPage ? (parseInt(params.nPerPage)) : 10

      let select = 'id name fullname displayname description courseType mode startDate endDate maxEnrollmentDate priceCOP priceUSD discount quota lang'
      if (params.select) {
        select = params.select
      }

      let where = {}

      if (params.search) {
        const search = params.search
        where = {
          ...where,
          $or: [
            { name: { $regex: '.*' + search + '.*', $options: 'i' } },
            { description: { $regex: '.*' + search + '.*', $options: 'i' } },
          ]
        }
      }

      // Filtro para Mode

      // Filtro para courseType

      // Filtro para FEcha de inicio de curso
      if (params.startDate) {
        let direction = 'gte'
        let date = moment.utc()
        if (params.startDate.date !== 'today') {
          date = moment.utc(params.startDate.date)
        }
        if (params.startDate.direction) direction = params.startDate.direction
        where['startDate'] = { [`$${direction}`]: date.format('YYYY-MM-DD') }
      }

      if (params.endDate) {
        let direction = 'lte'
        let date = moment.utc()
        if (params.endDate.date !== 'today') {
          date = moment.utc(params.endDate.date)
        }
        if (params.endDate.direction) direction = params.endDate.direction
        where['endDate'] = { [`$${direction}`]: date.format('YYYY-MM-DD') }
      }


      let sort = null
      if (params.sort) {
        sort = {}
        sort[params.sort.field] = params.sort.direction
      }

      let registers = []
      console.log("--------------------------");
      console.log(where);


      try {
        registers = await Course.find(where)
          .select(select)
          .skip(paging ? (pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0) : null)
          .limit(paging ? nPerPage : null)
          .sort(sort)
          .lean()


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

    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }


}

export const courseDataService = new CourseDataService();
export { CourseDataService as DefaultDataCourseCourseDataService };
