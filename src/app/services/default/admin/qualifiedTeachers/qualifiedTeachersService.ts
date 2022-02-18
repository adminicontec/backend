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
import { IQualifiedTeacher, IQualifiedTeacherDelete } from '@scnode_app/types/default/admin/qualifiedTeachers/qualifiedTeachersTypes'

// @end

class QualifiedTeachersService {

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

  }

  /**
* Metodo que permite insertar/actualizar un registro
* @param params Elementos a registrar
* @returns
*/
  public insertOrUpdate = async (params: IQualifiedTeacher) => {

    try {

      if (params.id) {

        const register = await QualifiedTeachers.findOne({ _id: params.id })
        console.log(register);
        if (!register) return responseUtility.buildResponseFailed('json', null, { error_key: 'qualified_teacher.not_found' })

        const response: any = await QualifiedTeachers.findByIdAndUpdate(params.id, params, { useFindAndModify: false, new: true })

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            qualifiedTeacher: {
              _id: response._id,
              username: response.username,
              modular: response.modular,
              courseCode: response.courseCode,
              courseName: response.courseName,
              evaluationDate: response.evaluationDate,
              isEnabled: response.isEnabled,
              observations: response.observations
            }
          }
        })

      } else {

        // Query if User ID exists
        console.log('User Data:');
        const respUser = await userService.findBy({ query: QueryValues.ONE, where: [{ field: '_id', value: params.user }] })
        console.log(respUser);
        if (respUser.status == 'error') {
          return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'user.not_found' } });
        }

        // Query if Modular ID exists
        console.log('Modular Data:');
        const respModular = await modularService.findBy({ query: QueryValues.ONE, where: [{ field: '_id', value: params.modular }] })
        console.log(respModular);
        if (respModular.status == 'error') {
          return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'modular.not_found' } });
        }

        // Query as unique register
        const respQualifiedTeacher = await QualifiedTeachers.findOne({ user: params.user, courseCode: params.courseCode })
        if (respQualifiedTeacher) return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'qualified_teacher.insertOrUpdate.already_exists', params: { user: params.user, courseCode: params.courseCode } } })

        const response: any = await QualifiedTeachers.create(params)

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            qualifiedTeacher: {
              _id: response._id,
              username: response.username,
              modular: response.modular,
              courseCode: response.courseCode,
              courseName: response.courseName,
              evaluationDate: response.evaluationDate,
              isEnabled: response.isEnabled,
              observations: response.observations
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
