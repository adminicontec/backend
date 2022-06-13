// @import_dependencies_node Import libraries
// @end

// @import services
import { modularService } from '@scnode_app/services/default/admin/modular/modularService';
import { userService } from '@scnode_app/services/default/admin/user/userService';
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import { QualifiedTeachers } from '@scnode_app/models'
// @end

// @import types
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes'
import { ITeacherProfile, ITeacherProfileDelete } from '@scnode_app/types/default/admin/teacherProfile/teacherProfileTypes'
import { IQualifiedTeacher, IQualifiedTeacherQuery, IQualifiedTeacherDelete } from '@scnode_app/types/default/admin/qualifiedTeachers/qualifiedTeachersTypes'

// @end

class QualifiedTeachersService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor() { }


  public list = async (filters: IQualifiedTeacherQuery = {}) => {


    const paging = (filters.pageNumber && filters.nPerPage) ? true : false

    const pageNumber = filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage = filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let select = 'id teacher modular courseCode courseName evaluationDate status isEnabled observations';

    if (filters.select) {
      select = filters.select
    }

    let where = {}

    if (filters.courseCode) {
      where = { courseCode: filters.courseCode };
    }

    if (filters.teacher) {
      where = { teacher: filters.teacher };
    }

    console.log('criteria: ');
    console.dir(where, { depth: null, colors: true });

    let registers = []
    try {
      registers = await QualifiedTeachers.find(where)
        .select(select)
        .populate({ path: 'teacher', select: 'id profile.first_name profile.last_name profile.contractType.type profile.contractType.isTeacher profile.contractType.isTutor' })
        .populate({ path: 'modular', select: 'id name' })
        // .populate({ path: 'modulars', select: 'id name' })
        .skip(paging ? (pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0) : null)
        .limit(paging ? nPerPage : null)
    } catch (e) { }

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        qualifiedTeachers: [
          ...registers
        ],
        total_register: (paging) ? await QualifiedTeachers.find(where).count() : registers.length,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    })

  }


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

      let select = 'id status teacher modular courseCode courseName evaluationDate isEnabled observations'

      if (params.query === QueryValues.ALL) {
        const registers = await QualifiedTeachers.find(where).select(select)
        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            qualified_teacher: registers
          }
        })
      } else if (params.query === QueryValues.ONE) {
        const register = await QualifiedTeachers.findOne(where).select(select)
        if (!register) return responseUtility.buildResponseFailed('json', null, { error_key: 'qualified_teacher.not_found' })
        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            qualified_teacher: register
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
  public insertOrUpdate = async (params: IQualifiedTeacher) => {

    try {

      console.log('teacher');
      console.log(params.teacher);

      if (params.id) {

        const register = await QualifiedTeachers.findOne({ _id: params.id })
        //console.log(register);
        if (!register) return responseUtility.buildResponseFailed('json', null, { error_key: 'qualified_teacher.not_found' })

        const response: any = await QualifiedTeachers.findByIdAndUpdate(params.id, params, { useFindAndModify: false, new: true })

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            qualifiedTeacher: {
              _id: response._id,
              teacher: response.teacher,
              modular: response.modular,
              courseCode: response.courseCode,
              courseName: response.courseName,
              evaluationDate: response.evaluationDate,
              isEnabled: response.isEnabled,
              observations: response.observations,
              action: 'update'
            }
          }
        })

      } else {

        // Query if User ID exists
        const respUser = await userService.findBy({ query: QueryValues.ONE, where: [{ field: '_id', value: params.teacher }] })
        console.log(respUser);
        if (respUser.status == 'error') {
          return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'user.not_found' } });
        }

        // Query if Modular ID exists
        const respModular = await modularService.findBy({ query: QueryValues.ONE, where: [{ field: '_id', value: params.modular }] })
        if (respModular.status == 'error') {
          return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'modular.not_found' } });
        }

        // Query as unique register
        const respQualifiedTeacher = await QualifiedTeachers.findOne({ teacher: params.teacher, courseCode: params.courseCode })
        if (respQualifiedTeacher) return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'qualified_teacher.insertOrUpdate.already_exists', params: { user: params.teacher, courseCode: params.courseCode } } })

        console.log("***********");
        console.log('Qualified Teacher Create:');
        console.table(params);
        const response: any = await QualifiedTeachers.create(params)
        console.log(response);
        console.log("***********");

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            qualifiedTeacher: {
              _id: response._id,
              teacher: response.teacher,
              modular: response.modular,
              courseCode: response.courseCode,
              courseName: response.courseName,
              evaluationDate: response.evaluationDate,
              isEnabled: response.isEnabled,
              observations: response.observations,
              action: 'insert'
            }
          }
        })
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
  public delete = async (params: IQualifiedTeacherDelete) => {
    try {
      const find: any = await QualifiedTeachers.findOne({ _id: params.id })
      if (!find) return responseUtility.buildResponseFailed('json', null, { error_key: 'qualified_teacher.not_found' })

      await find.delete()

      return responseUtility.buildResponseSuccess('json')
    } catch (error) {
      return responseUtility.buildResponseFailed('json')
    }
  }


}

export const qualifiedTeachersService = new QualifiedTeachersService();
export { QualifiedTeachersService as DefaultAdminQualifiedTeachersQualifiedTeachersService };
