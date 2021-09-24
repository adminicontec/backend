// @import_dependencies_node Import libraries
// @end

// @import services
import { roleService } from '@scnode_app/services/default/admin/secure/roleService'
import { mailService } from "@scnode_app/services/default/general/mail/mailService";
import { courseSchedulingService } from '@scnode_app/services/default/admin/course/courseSchedulingService'
import { userService } from '../user/userService';
import { countryService } from '@scnode_app/services/default/admin/country/countryService'

import { moodleCourseService } from '@scnode_app/services/default/moodle/course/moodleCourseService'
import { moodleUserService } from '../../moodle/user/moodleUserService';
import { moodleEnrollmentService } from '../../moodle/enrollment/moodleEnrollmentService';


// @end

// @import config
import { customs } from '@scnode_core/config/globals'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { queryUtility } from '@scnode_core/utilities/queryUtility';
import { campus_setup } from '@scnode_core/config/globals';
import { xlsxUtility } from '@scnode_core/utilities/xlsx/xlsxUtility';
import { i18nUtility } from "@scnode_core/utilities/i18nUtility";
// @end

// @import models
import { Enrollment, CourseSchedulingDetails, User, CourseScheduling, MailMessageLog } from '@scnode_app/models'
// @end

// @import types
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes'
import { IEnrollment, IEnrollmentQuery, IMassiveEnrollment, IEnrollmentDelete } from '@scnode_app/types/default/admin/enrollment/enrollmentTypes'
import { IUser } from '@scnode_app/types/default/admin/user/userTypes'
import { IMoodleUser } from '@scnode_app/types/default/moodle/user/moodleUserTypes'
import moment from 'moment';
import { generalUtility } from '@scnode_core/utilities/generalUtility';
import { IFileProcessResult } from '@scnode_app/types/default/admin/fileProcessResult/fileProcessResultTypes'
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

    let select = 'id user courseID'
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
        .populate({ path: 'user', select: 'id email phoneNumber profile.first_name profile.last_name profile.doc_type profile.doc_number' })
        .skip(paging ? (pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0) : null)
        .limit(paging ? nPerPage : null)
        .lean()

      let count = 1
      for await (const register of registers) {
        register.count = count
        if (register.user && register.user.profile) {
          register.user.fullname = `${register.user.profile.first_name} ${register.user.profile.last_name}`
        }
        count++
      }
    } catch (e) { }

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        enrollment: [
          ...registers
        ],
        total_register: (paging) ? await Enrollment.find(where).countDocuments() : 0,
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

    console.log("Begin: enrollmentService.insertOrUpdate()");
    let roles = {}
    const rolesResponse: any = await roleService.list()
    if (rolesResponse.status === 'success') {
      for await (const iterator of rolesResponse.roles) {
        roles[iterator.name] = iterator._id
      }
    }

    let courseScheduling = null
    let teachers = []
    if (params.courseScheduling) {
      const courseSchedulingResponse: any = await courseSchedulingService.findBy({ query: QueryValues.ONE, where: [{ field: '_id', value: params.courseScheduling }] })
      if (courseSchedulingResponse.status === 'success') {
        courseScheduling = courseSchedulingResponse.scheduling

        const courses = await CourseSchedulingDetails.find({
          course_scheduling: courseScheduling._id
        }).select('id teacher')
          .populate({ path: 'teacher', select: 'id email profile.first_name profile.last_name' })
          .lean()
        for await (const course of courses) {
          if (course.teacher) {
            teachers.push(course.teacher._id.toString())
          }
        }

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
        if (params.documentID && params.email && params.courseID) {
          console.log("Inicio de Enrollment");

          // If the usename (document ID) has uppercase letters or spaces, must be replace to avoid mooodle's username wrong format
          var newUserID = params.documentID.toLowerCase().replace(/ /g, "_");

          var isNew = false;
          // check rolename, if not exists, guest as default in moodle, viewer in CV
          //if(params.rolename ==)

          var paramToEnrollment = {
            user: {
              moodleUserID: 0,
              moodleFirstName: '',
              moodleLastName: '',
              moodleUserName: '',
              moodleEmail: '',
              moodlePassword: '',
              moodleCity: '',
              moodleCountry: '',
              moodleCustomRegional: '',
              moodleCustomBirthDate: '',
              moodleCustomEmailAlt: '',
              moodleCustomJob: '',
              moodleCustomTitle: '',
              moodleCustomEducationalLevel: '',
              moodleCustomCompany: '',
              moodleCustomGenre: '',
              moodleCustomOrigin: '',
            },
            course: {
              moodleCourseID: 0,
              moodleCourseName: ''
            },
            moodleRoleID: 5, /// <-- Ojo, valor del rol aquí (5 estudiante, 4 teacher)
            moodleUserID: 0,
            moodleCourseID: 0
          };

          //#region  [ 1. Consultar Id del curso para verificar ]
          // Llamado a Servicio MoodleGetCourse
          const respMoodle: any = await moodleCourseService.findBy(params);
          if (respMoodle.status == "error") {
            // No hay curso para hacer matrícula
            console.log('Curso ' + params.courseID + ' en Moodle NO existe.');
            return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'moodle_course.not_found', params: { name: params.courseID } } })
          }

          // Info del curso existe!
          paramToEnrollment.course.moodleCourseID = respMoodle.course.id;
          paramToEnrollment.course.moodleCourseName = respMoodle.course.name;

          //#region  [ 2. Validación de Usuario en CampusVirtual si Existe ]
          var passw = params.password;

          let userEnrollment = null;
          let respCampusDataUser: any = null;

          // 2.1. Insertar nuevo Usuario con Rol de Estudiante (pendiente getRoleIdByName)
          var cvUserParams: IUser = {
            id: '',
            username: newUserID,//params.user,
            email: params.email,
            password: passw,
            roles: [roles['student']], // Id de ROL sujeto a verificación en CV
            phoneNumber: params.phoneNumber,
            profile: {
              first_name: params.firstname,
              last_name: params.lastname,
              doc_type: params.documentType,
              doc_number: params.documentID,
              city: params.city,
              country: params.country,
              birthDate: params.birthdate,
              alternativeEmail: params.emailAlt,
              genre: params.genre,
              regional: params.regional,
              company: params.company,
              carreer: params.title,
              currentPosition: params.job,
              educationalLevel: params.educationalLevel,
              origen: params.origin,
            },
            sendEmail: true
          }
          paramToEnrollment.user.moodleFirstName = params.firstname;
          paramToEnrollment.user.moodleLastName = params.lastname;
          paramToEnrollment.user.moodleUserName = newUserID;  // docId as UserName
          paramToEnrollment.user.moodleEmail = params.email;
          paramToEnrollment.user.moodlePassword = passw;

          respCampusDataUser = await userService.findBy({
            query: QueryValues.ONE,
            where: [{ field: 'profile.doc_number', value: params.documentID }]
          });
          console.log('Search by doc_number: ');

          if (respCampusDataUser.status == "error") {
            // USUARIO NO EXISTE EN CAMPUS VIRTUAL
            console.log(">>[CampusVirtual]: El usuario no existe. Creación de Nuevo Usuario");
            isNew = true;

            // Insertar nuevo Usuario si no existe
            const respoUser = await userService.insertOrUpdate(cvUserParams);
            console.log("Response from userService.insertOrUpdate():");

            if (respoUser.status == "success") {
              params.user = respoUser.user._id;
              userEnrollment = respoUser.user;
              console.log(respoUser.user.moodle_id);
              paramToEnrollment.user.moodleUserID = respoUser.user.moodle_id;
            }
            else {
              // Retornar ERROR: revisar con equipo

              // const respoUser = await userService.insertOrUpdate(cvUserParams);
              // if (respoUser.status == "success") {
              // }
            }
          }
          else {
            console.log(">>[CampusVirtual]: El usuario existe: " + respCampusDataUser.user._id);
            console.log(">>>>>>>>>>>>>>>>>>>>");

            paramToEnrollment.user.moodleUserID = respCampusDataUser.user.moodle_id;
            cvUserParams.id = respCampusDataUser.user._id.toString();
            //  cvUserParams.profile.country = countryID;
            console.log(cvUserParams);
            try {
              const respoExistingUser = await userService.insertOrUpdate(cvUserParams);

              if (respoExistingUser.status == "success") {
                console.log("---------------- SUCCESS ----------------------- ");
              }
              else {
                console.log(respoExistingUser);
              }

            }
            catch (e) {
              return responseUtility.buildResponseFailed('json')
            }


            if (teachers.includes(respCampusDataUser.user._id.toString())) {
              return responseUtility.buildResponseFailed('json')
            }
            userEnrollment = respCampusDataUser.userD
            params.user = respCampusDataUser.user._id

            // Usuario ya existe en CV:
            // console.log("[  Campus  ] Usuario ya existe: ");
            // console.log(respCampusDataUser.user.profile.first_name + " " + respCampusDataUser.user.profile.last_name);

            // Si existe Usuario en CV, debe existir en Moodle
            paramToEnrollment.user.moodleFirstName = params.firstname;
            paramToEnrollment.user.moodleLastName = params.lastname;
            paramToEnrollment.user.moodleUserName = params.documentID;
            paramToEnrollment.user.moodleEmail = params.email;
            paramToEnrollment.user.moodlePassword = passw;
          }
          //#endregion

          //#region [ 3. Creación de la matrícula en CV (enrollment) ]
          const exist = await Enrollment.findOne({ documentID: params.documentID, courseID: params.courseID })
          if (exist) {
            // Si existe la matrícula en CV, intentar matricular en Moodle
            console.log("[  Campus  ] Matrícula ya existe: ");
            console.log(exist);
            return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'enrollment.insertOrUpdate.already_exists', params: { username: params.documentID, coursename: params.courseID } } })
          }
          else {
            // Creación exitosa de Enrollment en CV
            // parámetros para Enrollment en CV, requiere nombre de Curso
            let paramsCVEnrollment = { ...params };
            if (courseScheduling && courseScheduling._id) {
              paramsCVEnrollment['course_scheduling'] = courseScheduling._id
            }
            const respCampusDataEnrollment: any = await Enrollment.create(paramsCVEnrollment)

            // Creación de Enrollment en Moodle
            var enrollment = {
              roleid: paramToEnrollment.moodleRoleID,
              courseid: paramToEnrollment.course.moodleCourseID,
              userid: paramToEnrollment.user.moodleUserID
            }
            let respMoodle3: any = await moodleEnrollmentService.insert(enrollment);
            console.log('respMoodle3', respMoodle3);

            // @INFO: Se envia email de bienvenida
            if ((params.sendEmail === true || params.sendEmail === 'true') && courseScheduling.schedulingStatus.name === 'Confirmado') {
              await courseSchedulingService.sendEnrollmentUserEmail([params.email], {
                mailer: customs['mailer'],
                first_name: userEnrollment.profile.first_name,
                course_name: courseScheduling.program.name,
                course_start: moment.utc(courseScheduling.startDate).format('YYYY-MM-DD'),
                course_end: moment.utc(courseScheduling.endDate).format('YYYY-MM-DD'),
                type: 'student'
              })
            }
            // console.log("[  Campus  ] Enrollment: ");
            // console.log(respCampusDataEnrollment);
          }
          //#endregion

          const timeElapsed = Date.now();
          const currentDate = new Date(timeElapsed);

          return responseUtility.buildResponseSuccess('json', null, {
            additional_parameters: {
              enrollment: {
                email: paramToEnrollment.user.moodleEmail,
                username: paramToEnrollment.user.moodleUserName,
                password: (isNew == true) ? paramToEnrollment.user.moodlePassword : null,
                userIsNew: isNew,
                courseID: paramToEnrollment.course.moodleCourseID,
                courseName: paramToEnrollment.course.moodleCourseName,
                campusURL: campus_setup.url,
                enrollmentDate: currentDate.toISOString()
              }
            }
          });

          //#endregion
        }
        else {
          // console.log("ERROR en Enrolamiento");
        }
      }

    } catch (e) {
      // console.log("catch Exception ");
      // console.log(e);
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que permite retirar la matrícula de un estudiante en un curso.
   * @param params ID de estudiante enrolado y notificación de envío de correo (true/false)
   * @returns
   */
  public delete = async (params: IEnrollmentDelete) => {

    try {
      const find: any = await Enrollment.findOne({ _id: params.id })
      if (!find) return responseUtility.buildResponseFailed('json', null, { error_key: 'enrollment.not_found' })

      // @INFO: Buscando usuario dentro de campus
      const user: any = await User.findOne({ _id: find.user }).select('id email profile.first_name profile.last_name')

      // @INFO: Buscando programa dentro de campus
      const course_scheduling: any = await CourseScheduling.findOne({ _id: find.course_scheduling })
        .select('id program schedulingStatus')
        .populate({ path: 'program', select: 'id name' })
        .populate({ path: 'schedulingStatus', select: 'id name' })

      // Search UserId on Moodle
      var username = find.documentID.toLowerCase().replace(/ /g, "_");
      const paramUserMoodle = {
        username: username
      }
      const respMoodle2: any = await moodleUserService.findBy(paramUserMoodle);
      if (respMoodle2.status == "success") {
        const enrollment = {
          courseid: find.courseID,
          userid: respMoodle2.user.id,
        }
        let respMoodle3: any = await moodleEnrollmentService.delete(enrollment);

        await find.delete()

        if (user && course_scheduling) {
          if (course_scheduling.schedulingStatus.name === 'Confirmado') {
            // @INFO: Eliminando notificación de inicio del curso en caso que se vuelva a matricular en el mismo programa
            const amountNotification = await MailMessageLog.findOne({ notification_source: `course_start_${user._id}_${course_scheduling._id}` })
            if (amountNotification) await amountNotification.delete()

            // @INFO: Enviando mensaje de desmatriculación
            await courseSchedulingService.sendUnenrollmentUserEmail(user.email, {
              mailer: customs['mailer'],
              first_name: user.profile.first_name,
              course_name: course_scheduling.program.name,
              notification_source: `course_unenrollment_${user._id}_${course_scheduling._id}`
            })
          }
        }

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            enrollment: {
              ...respMoodle3
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

    } catch (error) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que permite cargar de forma masiva un listado de estudiantes para matrícula.
   * @param params Archivo XLXS y curso para matricular
   * @returns
   */
  public massive = async (params: IMassiveEnrollment) => {

    let processResult: IFileProcessResult;
    let processResultLog = [];

    console.log(">>>>>>>>>>> Begin Massive Enrollment")
    let userEnrollmentResponse = [];
    let singleUserEnrollmentContent: IEnrollment;
    // console.log("Begin file process for courseID: " + params.courseID)
    let content = params.contentFile;

    let dataFromWorksheet = await xlsxUtility.extractXLSX(content.data, 'Estudiantes', 0, 100);
    if (dataFromWorksheet != null) {
      console.log("Sheet content:" + dataFromWorksheet.length + " records");

      let index = 1;
      for await (const element of dataFromWorksheet) {

        let dob = '';
        // check for element['Fecha Nacimiento']
        if (element['Fecha Nacimiento']) {
          dob = moment.utc(element['Fecha Nacimiento'].toString()).format('YYYY-MM-DD');
        }
        else {
          dob = moment.utc('1990-01-01').format('YYYY-MM-DD');
        }

        //#region   Revisión Documento de identidad para Casos especiales
        if (element['Documento de Identidad']) {
          var newUserID = element['Documento de Identidad'].toLowerCase().replace(/ /g, "_");
          console.log(">>> Insert Username " + newUserID);
          let checkEmail = element['Correo Electrónico'];
          if (checkEmail != null) {
            checkEmail = checkEmail.trim().toLowerCase();
            if (generalUtility.validateEmailFormat(checkEmail)) {

              singleUserEnrollmentContent =
              {
                documentType: element['Tipo Documento'].trim().toUpperCase(),
                documentID: element['Documento de Identidad'].trim(),
                user: element['Documento de Identidad'].trim(),
                password: element['Documento de Identidad'].trim(), // <-- Contraseña provisional
                email: checkEmail,
                firstname: element['Nombres'].trim(),
                lastname: element['Apellidos'].trim(),
                phoneNumber: (element['N° Celular']) ? element['N° Celular'].toString().trim() : '',
                city: (element['Ciudad']) ? element['Ciudad'].trim() : null,
                country: element['País'],
                emailAlt: element['Correo Alt'],
                regional: element['Regional'],
                birthdate: dob,
                job: element['Cargo'],
                title: element['Profesión'],
                educationalLevel: element['Nivel Educativo'],
                company: element['Empresa'],
                genre: element['Género'],
                origin: element['Origen'],

                courseID: params.courseID,
                rolename: 'student',
                courseScheduling: params.courseScheduling,
                sendEmail: params.sendEmail
              }
              const resp = await this.insertOrUpdate(singleUserEnrollmentContent);
              if (resp.status == 'success') {
                processResult = {
                  ID: index,
                  status: 'OK',
                  messageProcess: '',
                  details: {
                    user: singleUserEnrollmentContent.user,
                    fullname: singleUserEnrollmentContent.firstname + " " + singleUserEnrollmentContent.lastname
                  }
                }
              }
              else {
                processResult = {
                  ID: index,
                  status: 'ERROR',
                  messageProcess: "resp.enrollment",
                  details: {
                    user: singleUserEnrollmentContent.user,
                    fullname: singleUserEnrollmentContent.firstname + " " + singleUserEnrollmentContent.lastname
                  }
                }

              }
              // build process Response
              userEnrollmentResponse.push(resp);
            }
            else {
              processResult = {
                ID: index,
                status: 'ERROR',
                messageProcess: 'Campo email no tiene formato adecuado.',
                details: {
                  user: 'Empty',
                  fullname: singleUserEnrollmentContent.firstname + " " + singleUserEnrollmentContent.lastname
                }
              }
            }
          }
          else {
            // error por email vacío
            processResult = {
              ID: index,
              status: 'ERROR',
              messageProcess: 'Campo email está vacío.',
              details: {
                user: 'Empty',
                fullname: singleUserEnrollmentContent.firstname + " " + singleUserEnrollmentContent.lastname
              }
            }
          }
          console.log("<<<<<<<<< Resultado individual >>>>>>>>>>>>>>>>>>><<<<");
          console.log(processResult);
          processResultLog.push(processResult);
        }
        else {
          // Log the Error
          processResult = {
            ID: index,
            status: 'ERROR',
            messageProcess: 'El campo Documento de Identidad está vacío.',
            details: {
              user: 'Empty',
              fullname: singleUserEnrollmentContent.firstname + " " + singleUserEnrollmentContent.lastname
            }
          }
          //console.log(processResult)
          processResultLog.push(processResult);

        }
        index++;
        //#endregion
      }
      console.log("--------------------------------------------------------");
      console.log("Resultados de carga de archivo:");
      //console.log(processResultLog);
      console.log("--------------------------------------------------------");

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          ...processResultLog
        }
      })

    }
    else {
      // Return Error
      // console.log("Worksheet not found");
    }
  }

}

export const enrollmentService = new EnrollmentService();
export { EnrollmentService as DefaultAdminEnrollmentEnrollmentService };
