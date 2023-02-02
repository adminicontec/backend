// @import_dependencies_node Import libraries
import moment from 'moment';
// @end

// @import services
import { roleService } from '@scnode_app/services/default/admin/secure/roleService'
import { mailService } from "@scnode_app/services/default/general/mail/mailService";
import { courseSchedulingService } from '@scnode_app/services/default/admin/course/courseSchedulingService'
import { userService } from '@scnode_app/services/default/admin/user/userService';
import { countryService } from '@scnode_app/services/default/admin/country/countryService'
import { certificateService } from '@scnode_app/services/default/huellaDeConfianza/certificate/certificateService'
import { moodleCourseService } from '@scnode_app/services/default/moodle/course/moodleCourseService'
import { moodleUserService } from '@scnode_app/services/default/moodle/user/moodleUserService';
import { moodleEnrollmentService } from '@scnode_app/services/default/moodle/enrollment/moodleEnrollmentService';


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
import { eventEmitterUtility } from "@scnode_core/utilities/eventEmitterUtility";
// @end

// @import models
import { Enrollment, CourseSchedulingDetails, User, CourseScheduling, MailMessageLog, CertificateQueue, Program } from '@scnode_app/models'
// @end

// @import types
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes'
import { IEnrollment, IEnrollmentQuery, IMassiveEnrollment, IEnrollmentDelete, IEnrollmentFindStudents, IAddCourseSchedulingEnrollment } from '@scnode_app/types/default/admin/enrollment/enrollmentTypes'
import { IUser, TIME_ZONES } from '@scnode_app/types/default/admin/user/userTypes'
import { IMoodleUser } from '@scnode_app/types/default/moodle/user/moodleUserTypes'
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

    let select = 'id user courseID course_scheduling origin enrollmentCode'
    if (filters.select) {
      select = filters.select
    }

    let where = {}

    if (filters.courseID) {
      where['courseID'] = filters.courseID;
    }
    if (filters.origin) {
      where['origin'] = filters.origin;
    }

    if (filters.without_certification && filters.course_scheduling) {
      const certifications = await CertificateQueue.find({
        courseId: filters.course_scheduling,
        status: { $in: ['New', 'In-process', 'Complete', 'Re-issue'] }
      })
        .select('id userId')

      const user_ids = certifications.reduce((accum, element) => {
        accum.push(element.userId)
        return accum
      }, [])
      if (user_ids.length > 0) {
        where['user'] = { $nin: user_ids }
      }
    }

    let registers = []
    try {
      registers = await Enrollment.find(where)
        .select(select)
        .populate({
          path: 'user',
          select: 'id email phoneNumber profile.first_name profile.last_name profile.doc_type profile.doc_number profile.regional profile.origen'
        })
        .populate({
          path: 'course_scheduling',
          select: 'id metadata.service_id'
        })
        .skip(paging ? (pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0) : null)
        .limit(paging ? nPerPage : null)
        .lean()

      let count = 1
      for await (const register of registers) {

        if (register.user && register.user.profile) {
          register.count = count
          register.user.fullname = `${register.user.profile.first_name} ${register.user.profile.last_name}`

          if (filters.check_certification) {
            const certificates = await CertificateQueue.find({
              userId: register.user._id,
              courseId: register.course_scheduling,
              status: { $in: ['New', 'In-process', 'Requested', 'Complete', 'Re-issue'] }
            }); //.select('');

            register.certificate = [];

            for (let itemCertificate of certificates) {
              if (itemCertificate.certificate.pdfPath) {
                itemCertificate.certificate.pdfPath = certificateService.certificateUrl(itemCertificate.certificate.pdfPath)
              }
              if (itemCertificate.certificate.imagePath) {
                itemCertificate.certificate.imagePath = certificateService.certificateUrl(itemCertificate.certificate.imagePath)
              }
              register.certificate.push(itemCertificate);
            }
          }
          count++
        }
        else {
          console.log('Error with profile:');
          console.log(register);

          var i = registers.indexOf(register);
          if (i !== -1) {
            registers.splice(i, 1);
          }
        }
      }
    } catch (e) {
      console.log('→→→ Error ');
      console.log(e.message);
      return responseUtility.buildResponseFailed('json', null,
        {
          error_key: 'enrollment.exception',
          additional_parameters: {
            process: 'list()',
            error: e.message
          }
        });
    }

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
    console.log("findBy...");
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

    let courseScheduling = null
    let teachers = []
    if (params.courseScheduling) {
      const courseSchedulingResponse: any = await courseSchedulingService.findBy({ query: QueryValues.ONE, where: [{ field: '_id', value: params.courseScheduling }] })
      if (courseSchedulingResponse.status === 'success') {
        courseScheduling = courseSchedulingResponse.scheduling
      }
    } else if (params.courseID) {
      const courseSchedulingResponse: any = await courseSchedulingService.findBy({ query: QueryValues.ONE, where: [{ field: 'moodle_id', value: params.courseID }] })
      if (courseSchedulingResponse.status === 'success') {
        courseScheduling = courseSchedulingResponse.scheduling
      }
    }

    if (courseScheduling) {
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

    if (params.timezone) {
      if (!TIME_ZONES.includes(params.timezone)) {
        return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'enrollment.timezone_not_allowed.error', params: { timezones: TIME_ZONES.join(', ') } } })
      }
    } else {
      delete params.timezone
    }


    try {
      if (params.id) {
        console.log("update register: " + params.id)
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

          // If the usename (document ID) has uppercase letters or spaces, must be replace to avoid mooodle's username wrong format
          const newUserID = params.documentID.toLowerCase().replace(/ /g, "_");

          let email_old = null
          let isNew = false;
          const paramToEnrollment = {
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

          const respMoodle: any = await moodleCourseService.findBy(params);
          if (respMoodle.status == "error")
            return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'moodle_course.not_found', params: { name: params.courseID } } })

          paramToEnrollment.course.moodleCourseID = respMoodle.course.id;
          paramToEnrollment.course.moodleCourseName = respMoodle.course.name;

          const passw = newUserID;

          let userEnrollment = null;

          const cvUserParams = {
            id: '',
            username: newUserID,
            email: params.email,
            password: newUserID,
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
              ...(params.timezone ? { timezone: params.timezone } : {}),
            },
            sendEmail: true
          }
          paramToEnrollment.user.moodleFirstName = params.firstname;
          paramToEnrollment.user.moodleLastName = params.lastname;
          paramToEnrollment.user.moodleUserName = newUserID;
          paramToEnrollment.user.moodleEmail = params.email;
          paramToEnrollment.user.moodlePassword = passw;

          const respCampusDataUser: any = await userService.findBy({
            query: QueryValues.ONE,
            // where: [{ field: 'profile.doc_number', value: params.documentID }]
            where: [{ field: 'username', value: params.documentID }]
          });


          if (respCampusDataUser.status === "error") {
            // @INFO: El usuario no existe en campus - se procede a crearlo
            isNew = true;

            // Insertar nuevo Usuario si no existe
            const respoUser = await userService.insertOrUpdate(cvUserParams);
            console.log("Response from userService.insertOrUpdate():", respoUser);

            if (respoUser.status == "success") {
              params.user = respoUser.user._id;
              userEnrollment = respoUser.user;
              console.log(respoUser.user.moodle_id);
              paramToEnrollment.user.moodleUserID = respoUser.user.moodle_id;
            }
            else {
              return responseUtility.buildResponseFailed('json', null, {error_key: {key: 'enrollment.insertOrUpdate.error', params: {
                errorMessage: respoUser.message
              }}})
            }
          } else {
            email_old = respCampusDataUser?.user?.email;
            paramToEnrollment.user.moodleUserID = respCampusDataUser.user.moodle_id;
            respCampusDataUser?.user?.roles.map((role) => {
              if (role._id.toString() !== roles['student'].toString()) {
                cvUserParams.roles.push(role._id)
              }
            })
            cvUserParams.id = respCampusDataUser.user._id.toString();

            try {
              if (teachers.includes(respCampusDataUser.user._id.toString())) {
                return responseUtility.buildResponseFailed('json', null, {error_key: {key: 'enrollment.insertOrUpdate.error', params: {
                  errorMessage: `El usuario ${newUserID} esta registrado como docente y no puede matricularse`
                }}})
              }

              const respoExistingUser = await userService.insertOrUpdate(cvUserParams);

              if (respoExistingUser?.status === 'error') {
                return responseUtility.buildResponseFailed('json', null, {error_key: {key: 'enrollment.insertOrUpdate.error', params: {
                  errorMessage: respoExistingUser.message
                }}})
              }
            } catch (e) {
              return responseUtility.buildResponseFailed('json', null, {error_key: {key: 'enrollment.insertOrUpdate.error', params: {
                errorMessage: e?.message || 'Se ha presentado un error en la matricula'
              }}})
            }

            userEnrollment = respCampusDataUser.user
            params.user = respCampusDataUser.user._id
            paramToEnrollment.user.moodleFirstName = params.firstname;
            paramToEnrollment.user.moodleLastName = params.lastname;
            paramToEnrollment.user.moodleUserName = params.documentID;
            paramToEnrollment.user.moodleEmail = params.email;
            paramToEnrollment.user.moodlePassword = passw;
          }

          const exist = await Enrollment.findOne({ documentID: params.documentID, courseID: params.courseID })
          if (exist) {
            // @INFO: Se envia email de bienvenida
            if (
              (params.sendEmail === true || params.sendEmail === 'true') &&
              courseScheduling.schedulingStatus.name === 'Confirmado' &&
              !isNew &&
              email_old !== params.email
            ) {
              await courseSchedulingService.sendEnrollmentUserEmail([params.email], {
                mailer: customs['mailer'],
                first_name: respCampusDataUser.user.profile.first_name,
                course_name: courseScheduling.program.name,
                username: respCampusDataUser.username || '',
                service_id: courseScheduling?.metadata?.service_id || '',
                course_start: moment.utc(courseScheduling.startDate).format('YYYY-MM-DD'),
                course_end: moment.utc(courseScheduling.endDate).format('YYYY-MM-DD'),
                notification_source: `course_start_${respCampusDataUser.user._id}_${courseScheduling._id}`,
                type: 'student'
              })
            }
            return responseUtility.buildResponseFailed('json', null,
              { error_key: { key: 'enrollment.insertOrUpdate.already_exists', params: { username: params.documentID, coursename: params.courseID } } })
          }
          else {
            let enrollmentCode = 1;
            const lastEnrollmentCode: any = await this.getLastEnrollmentCode({
              courseID: courseScheduling.moodle_id,
            });
            if (lastEnrollmentCode?.enrollmentCode) {
              enrollmentCode = lastEnrollmentCode.enrollmentCode + 1;
            }
            let paramsCVEnrollment = { ...params, enrollmentCode };
            if (courseScheduling && courseScheduling._id) {
              paramsCVEnrollment['course_scheduling'] = courseScheduling._id
            }

            const { _id } = await Enrollment.create(paramsCVEnrollment)

            const enrollment = {
              roleid: paramToEnrollment.moodleRoleID,
              courseid: paramToEnrollment.course.moodleCourseID,
              userid: paramToEnrollment.user.moodleUserID
            }

            const respMoodle3: any = await moodleEnrollmentService.insert(enrollment);
            if (respMoodle3?.status === 'error') {
              const find: any = await Enrollment.findOne({ _id })
              if (find) await find.delete()

              return responseUtility.buildResponseFailed('json', null, {error_key: {key: 'enrollment.insertOrUpdate.error', params: {
                errorMessage: respMoodle3.message || 'Se ha presentado un error al matricular en moodle'
              }}})
            }
            // @INFO: Se envia email de bienvenida
            if ((params.sendEmail === true || params.sendEmail === 'true') && courseScheduling.schedulingStatus.name === 'Confirmado') {
              await courseSchedulingService.sendEnrollmentUserEmail([params.email], {
                mailer: customs['mailer'],
                first_name: userEnrollment.profile.first_name,
                username: userEnrollment.username || '',
                course_name: courseScheduling.program.name,
                service_id: courseScheduling?.metadata?.service_id || '',
                course_start: moment.utc(courseScheduling.startDate).format('YYYY-MM-DD'),
                course_end: moment.utc(courseScheduling.endDate).format('YYYY-MM-DD'),
                notification_source: `course_start_${userEnrollment._id}_${courseScheduling._id}`,
                type: 'student'
              })
            }
          }

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
        }
        else {
          return responseUtility.buildResponseFailed('json', null, {error_key: {key: 'enrollment.insertOrUpdate.error', params: {
            errorMessage: 'Los campos documento de identidad, correo electronico y el ID del curso son obligatorios'
          }}})
        }
      }

    } catch (e) {
      console.log('[EnrollmentService] [insertOrUpdate] ERROR: ', e)
      return responseUtility.buildResponseFailed('json', null, {message: e?.message || 'Se ha presentado un error inesperado'})
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
        .select('id program schedulingStatus metadata')
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
              service_id: (course_scheduling?.metadata?.service_id) ? course_scheduling?.metadata?.service_id : '-',
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
    eventEmitterUtility.emit('enrollment:massive', params)
    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        // successfully: extSuccess
      }
    })
  }

  /**
   * @INFO Obtener los enrollment de un estudiante según unos parámetros de búsqueda
   */
  public findStudents = async (params: IEnrollmentFindStudents) => {
    try {
      let where: any[] = [];
      let availableSearch: boolean = false;

      where.push({
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user_doc'
        }
      });

      where.push({
        $lookup: {
          from: 'course_schedulings',
          localField: 'course_scheduling',
          foreignField: '_id',
          as: 'course_scheduling_doc'
        }
      });

      where.push({
        $lookup: {
          from: 'programs',
          localField: 'course_scheduling_doc.program',
          foreignField: '_id',
          as: 'program_doc'
        }
      });

      if (params.name && params.name.length) {
        where.push({
          $match: {
            $or: [
              { 'user_doc.profile.first_name': { $regex: '.*' + params.name + '.*', $options: 'i' } },
              { 'user_doc.profile.last_name': { $regex: '.*' + params.name + '.*', $options: 'i' } }
            ]
          }
        })
        availableSearch = true;
      }

      if (params.docNumber && params.docNumber.length) {
        where.push({
          $match: {
            $or: [
              { 'user_doc.profile.doc_number': { $regex: '.*' + params.docNumber + '.*', $options: 'i' } }
            ]
          }
        })
        availableSearch = true;
      }

      if (params.email && params.email.length) {
        where.push({
          $match: {
            $or: [
              { 'user_doc.email': { $regex: '.*' + params.email + '.*', $options: 'i' } }
            ]
          }
        })
        availableSearch = true;
      }

      let registers: any[] = [];
      if (availableSearch) {
        registers = await Enrollment.aggregate(where);
      }

      // Formatear respuesta
      if (registers && registers.length) {
        registers.forEach((register, idx) => {
          if (register.user_doc && register.user_doc.length) {
            registers[idx].user_doc = register.user_doc[0];
          }
          if (register.program_doc && register.program_doc.length) {
            registers[idx].program_doc = register.program_doc[0];
          }
          if (register.course_scheduling_doc && register.course_scheduling_doc.length) {
            registers[idx].course_scheduling_doc = register.course_scheduling_doc[0];
          }
        })
      }

      // Buscar certificados generados
      if (registers && registers.length) {
        let idx: number = 0;
        for await (let register of registers) {
          const certificates = await CertificateQueue.find({ userId: register.user, courseId: register.course_scheduling });
          if (certificates && certificates.length) {
            certificates.forEach((certificate) => {
              if (certificate.certificateType === 'academic') {
                registers[idx].academicCertificate = {
                  date: certificate.certificate?.date,
                  title: certificate?.certificate?.title
                }
              } else {
                registers[idx].auditCertificate = {
                  date: certificate.certificate?.date,
                  title: certificate?.certificate?.title
                }
              }
            });
          }
          idx++;
        }
      }

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          enrollments: registers
        }
      })

    } catch (e) {
      console.log('EnrollmentService => findStudents Error: ', e);
      return responseUtility.buildResponseFailed('json');
    }
  }


  public moveOriginRecords = async (params: IEnrollmentQuery) => {

    // 1. List of Enrollments
    let listOfEnrollment;
    let listOfUpdatedRecords = [];
    try {

      let registers: any = await this.list(params);
      if (!registers) return responseUtility.buildResponseFailed('json', null, { error_key: 'enrollment.not_found' })

      listOfEnrollment = registers.enrollment;

      for await (let enrollment of listOfEnrollment) {

        if (enrollment.user) {
          if (!enrollment.origin) {
            enrollment.origin = enrollment.user.profile.origen;
            enrollment.id = enrollment._id;
            console.log("ææææææææææææææææææææææææææææææææææææææææææææææææææææ");
            console.log(`Update register for ${enrollment.user.fullname} to ${enrollment.origin}`);

            let updateRegister: any = await this.insertOrUpdate(enrollment);
            console.log(updateRegister);
            listOfUpdatedRecords.push(enrollment);
          }
        }
      }
    }
    catch (e) {
      console.log(e.message);
      return responseUtility.buildResponseFailed('json', null,
        {
          error_key: 'enrollment.exception',
          additional_parameters: {
            process: 'list()',
            error: e.message
          }
        });
    }

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        enrollment: [
          listOfUpdatedRecords
        ]
      }
    })
  }


  public fixEnrollmentCode = async (params: IEnrollmentQuery) => {

    // 1. List of Enrollment:
    let enrollmentCode = 0;
    let listOfEnrollment;
    let listOfUpdatedRecords = [];
    let where = {};
    let select = 'id user courseID course_scheduling origin enrollmentCode';

    try {

      if (params.courseID) {
        where['courseID'] = params.courseID;
      }

      //this.list(params);
      let registers: any = await Enrollment.find(where)
        .select(select)
        .populate({
          path: 'user',
          select: 'id email phoneNumber profile.first_name profile.last_name profile.doc_type profile.doc_number profile.regional profile.origen'
        })
        .populate({
          path: 'course_scheduling',
          select: 'id metadata.service_id'
        });


      if (registers.length == 0) return responseUtility.buildResponseFailed('json', null, { error_key: 'enrollment.not_found' })

      console.log(`lastEnrollmentCode`);
      let enrollmentCode = 1;
      const lastEnrollmentCode: any = await this.getLastEnrollmentCode(params);
      if (lastEnrollmentCode?.enrollmentCode) {
        enrollmentCode = lastEnrollmentCode.enrollmentCode + 1;
      }
      console.log(`Code: ${enrollmentCode}`);

      listOfEnrollment = registers;

      for await (let enrollment of listOfEnrollment) {
        if (enrollment.enrollmentCode == null) {
          // update enrollmentCode

          const response: any = await Enrollment.findByIdAndUpdate(enrollment._id, { enrollmentCode: enrollmentCode }, { useFindAndModify: false, new: true })
          console.log(response);

          enrollmentCode++;
          listOfUpdatedRecords.push(response);
        }

      }

    }

    catch (e) {
      console.log(e.message);
      return responseUtility.buildResponseFailed('json', null,
        {
          error_key: 'enrollment.exception',
          additional_parameters: {
            process: 'list()',
            error: e.message
          }
        });
    }

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        enrollment: [
          listOfUpdatedRecords
        ]
      }
    })


  }

  public addCourseSchedulingToEnrollment = async (params: IAddCourseSchedulingEnrollment) => {
    try {
      if (!params.courseSchedulingId) return responseUtility.buildResponseFailed('json', null, {error_key: 'enrollment.add_scheduling.bad_params'})
      if (!params.enrollmentIds) return responseUtility.buildResponseFailed('json', null, {error_key: 'enrollment.add_scheduling.bad_params'})

      let enrollmentsList = [];
      const enrollmentsToUpdate: {key: string}[] = []
      const enrollmentsNotUpdated: {key: string, reason: string}[] = []

      const enrollments = await Enrollment.find({
        _id: {$in: params.enrollmentIds}
      })
      .select('id course_scheduling')
      if (!enrollments) return responseUtility.buildResponseFailed('json', null, {error_key: 'enrollment.not_found'})
      // if (enrollment.course_scheduling && !params.force) return responseUtility.buildResponseFailed('json', null, {error_key: 'enrollment.scheduling_already_config'})
      const enrollmentIds = enrollments.reduce((accum, element) => {
        if (element.course_scheduling && !params.force) {
          enrollmentsNotUpdated.push({key: element._id, reason: `Ya se ha configurado el servicio para esta matricula`})
        } else {
          accum.push(element._id)
          enrollmentsToUpdate.push({key: element._id})
        }
        return accum;
      }, [])

      if (enrollmentIds.length > 0) {
        await Enrollment.updateMany({
          _id: {$in: enrollmentIds},
          deleted: false
        }, {
          $set: {
            course_scheduling: params.courseSchedulingId
          }
        })
        enrollmentsList = await Enrollment.find({
          _id: {$in: enrollmentIds},
          deleted: false
        });
      }
      return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
        enrollmentsToUpdate,
        enrollmentsNotUpdated,
        enrollments: enrollmentsList,
      }})
    } catch (err) {
      return responseUtility.buildResponseFailed('json', null, {message: err?.message})
    }
  }

  public getLastEnrollmentCode = async (params: IEnrollmentQuery) => {

    const lastEnrollmentcode = await Enrollment.findOne({
      courseID: params.courseID
    })
      .select('enrollmentCode')
      .sort({ enrollmentCode: -1 })
    return lastEnrollmentcode;
  }

}

export const enrollmentService = new EnrollmentService();
export { EnrollmentService as DefaultAdminEnrollmentEnrollmentService };
