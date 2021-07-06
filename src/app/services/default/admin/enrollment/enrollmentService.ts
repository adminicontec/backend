// @import_dependencies_node Import libraries
// @end

// @import services
import {roleService} from '@scnode_app/services/default/admin/secure/roleService'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { queryUtility } from '@scnode_core/utilities/queryUtility';
import { moodle_setup } from '@scnode_core/config/globals';
import { campus_setup } from '@scnode_core/config/globals';
// @end

// @import models
import { Enrollment } from '@scnode_app/models'
// @end

// @import types
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes'
import { IEnrollment, IEnrollmentQuery } from '@scnode_app/types/default/admin/enrollment/enrollmentTypes'
import { userService } from '../user/userService';
import { moodleCourseService } from '@scnode_app/services/default/moodle/course/moodleCourseService'
import { IdentityStore } from 'aws-sdk';
import { generalUtility } from 'core/utilities/generalUtility';
import { moodleUserService } from '../../moodle/user/moodleUserService';
import { IMoodleUser } from '@scnode_app/types/default/moodle/user/moodleUserTypes'
import { moodleEnrollmentService } from '../../moodle/enrollment/moodleEnrollmentService';
// @end

class EnrollmentService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor() { }


  /**
   * Metodo que permite listar todos los registros
   * @param [filters] Estructura de filtros para la consulta
   * @returns
   */
  public list = async (filters: IEnrollmentQuery = {}) => {

    const paging = (filters.pageNumber && filters.nPerPage) ? true : false

    const pageNumber = filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage = filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let select = 'id user email firstname lastname documentType documentID courseID'
    if (filters.select) {
      select = filters.select
    }

    let where = {}

    // if (filters.search) {
    //   const search = filters.search
    //   where = {
    //     ...where,
    //     $or: [
    //       { name: { $regex: '.*' + search + '.*', $options: 'i' } },
    //       { description: { $regex: '.*' + search + '.*', $options: 'i' } },
    //     ]
    //   }
    // }

    if (filters.courseID) {
      where['courseID'] = filters.courseID
    }

    let registers = []
    try {
      registers = await Enrollment.find(where)
        .select(select)
        .populate({path: 'user', select: 'id profile.first_name profile.last_name email'})
        .skip(paging ? (pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0) : null)
        .limit(paging ? nPerPage : null)
        .lean()

        for await (const register of registers) {
          if (register.user && register.user.profile) {
            register.user.fullname = `${register.user.profile.first_name} ${register.user.profile.last_name}`
          }
        }
    } catch (e) { }

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        enrollment: [
          ...registers
        ],
        total_register: (paging) ? await Enrollment.find(where).count() : 0,
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

      let select = 'id email courseID'
      if (params.query === QueryValues.ALL) {
        const registers = await Enrollment.find(where).select(select)
        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            enrollments: registers
          }
        })
      } else if (params.query === QueryValues.ONE) {
        const register = await Enrollment.findOne(where).select(select)
        if (!register) return responseUtility.buildResponseFailed('json', null, { error_key: 'enrollment.not_found' })
        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            enrollment: register
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
  public insertOrUpdate = async (params: IEnrollment) => {

    let roles = {}
    const rolesResponse: any = await roleService.list()
    if (rolesResponse.status === 'success') {
      for await (const iterator of rolesResponse.roles) {
        roles[iterator.name] = iterator._id
      }
    }

    try {
      if (params.id) {

        const register = await Enrollment.findOne({ _id: params.id })
        if (!register) return responseUtility.buildResponseFailed('json', null, { error_key: 'enrollment.not_found' })

        const response: any = await Enrollment.findByIdAndUpdate(params.id, params, { useFindAndModify: false, new: true })

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            enrollment: {
              _id: response._id,
              email: response.email,
              courseID: response.courseID
            }
          }
        })

      } else {

        // @INFO: Validando matrícula única: email y courseID
        if (params.email && params.courseID) {

          var paramFullname = params.firstname + " " + params.lastname;
          console.log("Inicio de Enrollment");

          // check rolename, if not exists, guest as default in moodle, viewer in CV
          //if(params.rolename ==)

          var paramToEnrollment = {

            user: {
              moodleUserID: 0,
              moodleFirstName: '',
              moodleLastName: '',
              moodleUserName: '',
              moodleEmail: '',
              moodlePassword: ''
            },
            course: {
              moodleCourseID: 0,
              moodleCourseName: ''
            },
            moodleRoleID: 5,
            moodleUserID: 0,
            moodleCourseID: 0
          };

          //#region  [ 1. Consultar Id del curso para verificar ]
          // Llamado a Servicio MoodleGetCourse
          const respMoodle: any = await moodleCourseService.findBy(params);
          console.log(respMoodle);

          if (respMoodle.status == "error") {
            // Curso en Moodle NO existe.
            return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'moodle_course.not_found', params: { name: params.courseID } } })
          }
          else {
            // Info del curso existe!
            paramToEnrollment.course.moodleCourseID = respMoodle.course.id;
            paramToEnrollment.course.moodleCourseName = respMoodle.course.name;

            //#region  [ 2. Validación de Usuario en CampusVirtual si Existe ]
            var passw = params.password;

            const respCampusDataUser: any = await userService.findBy({ query: QueryValues.ONE, where: [{ field: 'email', value: params.email }] });

            if (respCampusDataUser.status == "error") {
              // USUARIO NO EXISTE EN CAMPUS VIRTUAL
              console.log(">>[CampusVirtual]: El usuario no existe. Creación de Nuevo Usuario");

              // 2.1. Insertar nuevo Usuario con Rol de Estudiante (pendiente getRoleIdByName)
              var cvUserParams = {
                username: params.email,
                email: params.email,
                password: passw,
                roles: [roles['student']], // Id de ROL sujeto a verificación en CV
                profile: {
                  first_name: params.firstname,
                  last_name: params.lastname
                }
              }
              paramToEnrollment.user.moodleFirstName = params.firstname;
              paramToEnrollment.user.moodleLastName = params.lastname;
              paramToEnrollment.user.moodleUserName = params.email;
              paramToEnrollment.user.moodleEmail = params.email;
              paramToEnrollment.user.moodlePassword = passw;

              // Insertar nuevo Usuario si existe
              const respoUser = await userService.insertOrUpdate(cvUserParams);
              if (respoUser.status == "success") {
                params.user = respoUser.user._id
                console.log("[  Campus  ] Usuario creado con éxito: " + respoUser.user.username + " : " + passw);
              }
              else {
                // Retornar ERROR: revisar con equipo
                console.log(respoUser);
              }
            }
            else {
              params.user = respCampusDataUser.user._id

              // Usuario ya existe en CV:
              console.log("[  Campus  ] Usuario ya existe: ");
              console.log(respCampusDataUser.user.profile.first_name + " " + respCampusDataUser.user.profile.last_name);

              // Si existe Usuario en CV, debe existir en Moodle
              paramToEnrollment.user.moodleFirstName = params.firstname;
              paramToEnrollment.user.moodleLastName = params.lastname;
              paramToEnrollment.user.moodleUserName = params.email;
              paramToEnrollment.user.moodleEmail = params.email;
              paramToEnrollment.user.moodlePassword = passw;

            }
            //#endregion

            //#region [ 3. Creación de la matrícula en CV (enrollment) ]
            const exist = await Enrollment.findOne({ email: params.email, courseID: params.courseID })
            if (exist) {
              // Si existe la matrícula en CV, intentar matricular en Moodle
              console.log("[  Campus  ] Matrícula ya existe: ");
              console.log(exist);
              //return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'enrollment.insertOrUpdate.already_exists', params: { username: paramFullname, coursename: params.course } } })
            }
            else {
              // Creación exitosa de Enrollment en CV
              // parámetros para Enrollment en CV, requiere nombre de Curso
              var paramsCVEnrollment = params;
              //paramsCVEnrollment.shortName = paramToEnrollment.course.moodleCourseName;

              const respCampusDataEnrollment: any = await Enrollment.create(paramsCVEnrollment)
              console.log("[  Campus  ] Enrollment: ");
              console.log(respCampusDataEnrollment);
            }
            //#endregion

            //#region ENORLLMENT EN MOODLE
            console.log("------------- ENROLLMENT IN MOODLE -------------");
            // 2. Validación si Existe Usuario en Moodle
            console.log("=================== VALIDACION USUARIO EN MOODLE =================== ");
            var paramUserMoodle = {
              email: params.email
            }
            let respMoodle2: any = await moodleUserService.findBy(paramUserMoodle);
            console.log(respMoodle2);
            if (respMoodle2.status == "success") {
              if (respMoodle2.user == null) {
                console.log("Moodle: user NO exists ");
                // [revisión[]
                var paramsMoodleUser:IMoodleUser = { //: IMoodleUser;
                  firstname: paramToEnrollment.user.moodleFirstName,
                  lastname: paramToEnrollment.user.moodleLastName,
                  password: passw,
                  email: paramToEnrollment.user.moodleEmail,
                  username: paramToEnrollment.user.moodleEmail
                }
                // crear nuevo uusario en MOODLE
                let respMoodle2: any = await moodleUserService.insertOrUpdate(paramsMoodleUser);
                console.log("Moodle: Usuario creado con Éxito.");
                console.log(respMoodle2);
                paramToEnrollment.user.moodleUserID = respMoodle2.user.id;
              }
              else {
                console.log("Moodle: user exists with name: " + JSON.stringify(respMoodle2.user.fullname));
                paramToEnrollment.user.moodleUserID = respMoodle2.user.id;
              }

              //paramToEnrollment.user.moodleUserID = respMoodle2.

              // Creación de Enrollment en Moodle
              //paramToEnrollment.
              var enrollment = {
                roleid: paramToEnrollment.moodleRoleID,
                courseid: paramToEnrollment.course.moodleCourseID,
                userid: paramToEnrollment.user.moodleUserID
              }

              let respMoodle3: any = await moodleEnrollmentService.insert(enrollment);
              console.log(respMoodle3);


              const timeElapsed = Date.now();
              const currentDate = new Date(timeElapsed);


              return responseUtility.buildResponseSuccess('json', null, {
                additional_parameters: {
                  enrollment: {
                    email: paramToEnrollment.user.moodleEmail,
                    username: paramToEnrollment.user.moodleUserName,
                    password: paramToEnrollment.user.moodlePassword,
                    courseID: paramToEnrollment.course.moodleCourseID,
                    courseName: paramToEnrollment.course.moodleCourseName,
                    campusURL: campus_setup.url,
                    enrollmentDate: currentDate.toISOString()
                  }
                }
              });
            }
            else {
              // Error al consultar el usuario
              return responseUtility.buildResponseSuccess('json', null, {
                additional_parameters: {
                  enrollment: {
                    ...respMoodle2
                  }
                }
              });
            }
            //#endregion

          }
          //#endregion

        }
        else {
          console.log("ERROR en Enrolamiento");
        }
      }

    } catch (e) {
      console.log("catch Exception ");
      console.log(e);
      return responseUtility.buildResponseFailed('json')
    }
  }
}

export const enrollmentService = new EnrollmentService();
export { EnrollmentService as DefaultAdminEnrollmentEnrollmentService };
