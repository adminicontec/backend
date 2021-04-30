// @import_dependencies_node Import libraries
// @end

// @import services
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
import { IdentityStore } from 'aws-sdk';
import { generalUtility } from 'core/utilities/generalUtility';
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

    let select = 'id email firstname lastname documentType documentID courseID'
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
      registers = await Enrollment.find(where)
        .select(select)
        .skip(paging ? (pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0) : null)
        .limit(paging ? nPerPage : null)
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
          var paramToEnrollment = {
            moodleRoleID: 0,
            moodleUserID: 0,
            moodleCourseID: 0
          };

          //#region  [ 1. Consultar por ShortName de curso para enrolamiento ]
          let moodleParamsInfoCourse = {
            wstoken: moodle_setup.wstoken,
            wsfunction: moodle_setup.services.courses.getByField,
            moodlewsrestformat: moodle_setup.restformat,
            'field': 'id',
            'value': params.courseID
          };
          // Consulta a Moodle: [core_course_get_courses_by_field]
          const respMoodleDataCourse = await queryUtility.query({ method: 'get', url: '', api: 'moodle', params: moodleParamsInfoCourse });

          if (respMoodleDataCourse.courses.length == 0) {
            // ERROR al consultar el curso en Moodle
            console.log("Moodle: ERROR." + JSON.stringify(respMoodleDataCourse));
            return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'moodle_course.not_found', params: { name: params.courseID } } })
          }
          else {
            // id de curso en Moodle
            paramToEnrollment.moodleCourseID = respMoodleDataCourse.courses[0].id;
            console.log("[    Moodle resp   ]");
            console.log(">> Course: "+ respMoodleDataCourse.courses[0].shortname);
            console.log(">> CourseID: " + respMoodleDataCourse.courses[0].id);
          }
          //#endregion

          //#region  [ 2. Validación de Usuario en CampusVirtual si Existe ]
          const respCampusDataUser: any = await userService.findBy({ query: QueryValues.ONE, where: [{ field: 'email', value: params.email }] })
          if (respCampusDataUser.status == "error") {
            console.log(">>[CampusVirtual]: El usuario no existe. Creación de Nuevo Usuario");
            // Contraseña aleatoria
            var condicionesPass = {
              characters: 10,   // Cantidad numerica de caracteres de los cuales estara formada una cadena de texto
              symbols: 1,
            }
            var passw = generalUtility.buildRandomChain() + "$";
            // 1.1. Insertar nuevo Usuario con Rol de Estudiante (pendiente getRoleIdByName)
            var userParams = {
              username: params.email,
              email: params.email,
              password: passw,
              roles: ["607e2e80c37a5d75273ade37"],
              profile: {
                first_name: params.firstname,
                last_name: params.lastname
              }
            }
            const respoUser = await userService.insertOrUpdate(userParams);
            if (respoUser.status == "success") {
              console.log("[  Campus  ] Usuario creado con éxito: " + respoUser.user.username + " : " + passw);
            }
            else {
              console.log(respoUser);
            }
          }
          else {
            // Usuario ya existe en CV:
            console.log("[  Campus  ] Usuario ya existe: ");
            console.log(respCampusDataUser.user.profile.first_name + " " +respCampusDataUser.user.profile.last_name);
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
          // Creación exitosa de Enrollment en CV
          const respCampusDataEnrollment: any = await Enrollment.create(params)
          console.log("[  Campus  ] Enrollment: ");
          console.log(respCampusDataEnrollment);
          //#endregion 


          console.log("------------- ENROLLMENT IN MOODLE -------------");
          // 2. Validación si Existe Usuario en Moodle
          let moodleParams = {
            wstoken: moodle_setup.wstoken,
            wsfunction: moodle_setup.services.users.findByField,
            moodlewsrestformat: moodle_setup.restformat,
            field: 'email',
            'values[0]': params.email
          };

          let userIfExistMoodle = await queryUtility.query({ method: 'get', url: '', api: 'moodle', params: moodleParams });
          if (userIfExistMoodle.exception) {
            console.log("Moodle: ERROR." + JSON.stringify(userIfExistMoodle));
          }
          else {

            console.log("Moodle data OK:" + JSON.stringify(userIfExistMoodle));
            // 2.1 Si la respuesta no es vacía, EXISTE el usuario en Moodle .
            if (JSON.stringify(userIfExistMoodle) != "[]") {
              // Usuario en Moodle ya existe, datos en objeto >> userIfExistMoodle[0]
              console.log("Moodle: Usuario existe");
              console.log("Moodle: ID =>" + userIfExistMoodle[0].id);
              console.log("Moodle: username =>" + userIfExistMoodle[0].username);
              console.log("Moodle: Fullname =>" + userIfExistMoodle[0].fullname);
            }
            else {
              console.log("Moodle: no hay usuario");
              // 2.2 Creación de usuario en Moodle
              let moodleParams = {
                wstoken: moodle_setup.wstoken,
                wsfunction: moodle_setup.services.users.create,
                moodlewsrestformat: moodle_setup.restformat,
                'users[0][email]': params.email,
                'users[0][username]': params.email,
                'users[0][password]': passw,
                'users[0][firstname]': params.firstname,
                'users[0][lastname]': params.lastname
              };
              userIfExistMoodle = await queryUtility.query({ method: 'post', url: '', api: 'moodle', params: moodleParams });
              if (userIfExistMoodle.exception) {
                // ERROR al crear el usuario en Moodle
                console.log("Moodle: ERROR." + JSON.stringify(userIfExistMoodle));
                // return
              }
              else {
                // Usuario en moodle CREADO con éxito
                console.log("Moodle create USER OK: ");
                console.log("Moodle UserID: " + userIfExistMoodle[0].id);
                console.log("Moodle UserName: " + userIfExistMoodle[0].username);

                paramToEnrollment.moodleRoleID = 5;
                paramToEnrollment.moodleUserID = userIfExistMoodle[0].id;
              }

            }
          }


          console.log("MOODLE TO ENROLLMENT: ");
          console.log(paramToEnrollment);

          // 4. Creación de matrícula en Moodle (enrollment)
          let moodleParamsEnrollment = {
            wstoken: moodle_setup.wstoken,
            wsfunction: moodle_setup.services.enrollment.create,
            moodlewsrestformat: moodle_setup.restformat,
            'enrolments[0][roleid]': paramToEnrollment.moodleRoleID,
            'enrolments[0][courseid]': paramToEnrollment.moodleCourseID,
            'enrolments[0][userid]': paramToEnrollment.moodleUserID
          };

          let respEnrollment = await queryUtility.query({ method: 'post', url: '', api: 'moodle', params: moodleParamsEnrollment });

          console.log("resp Enroll");
          console.log(respEnrollment);

          if (respEnrollment == null) {
            console.log("Success: ")
            return responseUtility.buildResponseSuccess('json', null, {
              additional_parameters: {
                enrollment: {
                  email: respCampusDataEnrollment.email,
                  username: respCampusDataEnrollment.email,
                  password: passw,
                  courseID: respCampusDataEnrollment.courseID,
                  courseName: respCampusDataEnrollment.courseName,
                  campusURL: campus_setup.url + "/login",
                  enrollmentDate: Date.now()
                }
              }
            })
          }
          else {
            console.log("[MOODLE]: ERROR en Enrolamiento");
            console.log(respEnrollment)
          }


          // Si no Existe, crea el Usuario en C.V
          //          const exist = await Enrollment.findOne({ email: params.email, courseID: params.courseID, _id: { $ne: params.id } })
          //          if (exist) return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'enrollment.insertOrUpdate.already_exists', params: { email: params.email, courseID: params.courseID } } })
        }
        else {
          console.log("ERROR en Enrolamiento");

        }




      }

    } catch (e) {
      console.log("catch Exception ");
      return responseUtility.buildResponseFailed('json')
    }
  }
}

export const enrollmentService = new EnrollmentService();
export { EnrollmentService as DefaultAdminEnrollmentEnrollmentService };
