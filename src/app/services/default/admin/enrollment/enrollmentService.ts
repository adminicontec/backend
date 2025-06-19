// @import_dependencies_node Import libraries
import moment from 'moment';
const ObjectID = require('mongodb').ObjectID
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
import { customs, efipaySetup, host } from '@scnode_core/config/globals'
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
import { Enrollment, CourseSchedulingDetails, User, CourseScheduling, MailMessageLog, CertificateQueue, Program, CertificateSettings } from '@scnode_app/models'
// @end

// @import types
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes'
import { IEnrollment, IEnrollmentQuery, IMassiveEnrollment, IEnrollmentDelete, IEnrollmentFindStudents, IAddCourseSchedulingEnrollment, IGetCurrentEnrollmentStatusParams, EnrollmentStatus, IBuyCoursesByShoppingCart, PROCESS_PURCHASE, ObjectsToBuy, BUY_ACTION, IShoppingCarItem, ICreateShoppingCartTransaction, PROCESS_ITEM_PURCHASE } from '@scnode_app/types/default/admin/enrollment/enrollmentTypes'
import { IUser, TIME_ZONES } from '@scnode_app/types/default/admin/user/userTypes'
import { IMoodleUser } from '@scnode_app/types/default/moodle/user/moodleUserTypes'
import { generalUtility } from '@scnode_core/utilities/generalUtility';
import { IFileProcessResult } from '@scnode_app/types/default/admin/fileProcessResult/fileProcessResultTypes'
import { gradesService } from '@scnode_app/services/default/moodle/grades/gradesService';
import { CertificateQueueStatus } from '@scnode_app/types/default/admin/certificate/certificateTypes';
import { transactionService } from '@scnode_app/services/default/admin/transaction/transactionService';
import { CourseSchedulingNotificationEvents, CourseSchedulingTypesKeys } from '@scnode_app/types/default/admin/course/courseSchedulingTypes';
import { courseSchedulingNotificationsService } from '../course/courseSchedulingNotificationsService';
import { enrollmentTrackingService } from './enrollmentTrackingService';
import { notificationEventService } from '../../events/notifications/notificationEventService';
import { mapUtility } from '@scnode_core/utilities/mapUtility';
import { completionstatusService } from '../completionStatus/completionstatusService';
import { IEnrollmentData } from '@scnode_app/types/default/admin/enrollment/enrollmentTrackingTypes';
import { ITransaction, TransactionStatus } from '@scnode_app/types/default/admin/transaction/transactionTypes';
import { EfipayCheckoutType, EfipayTaxes, IGeneratePaymentParams } from '@scnode_app/types/default/efipay/efipayTypes';
import { efipayService } from '../../efipay/efipayService';
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
    if (filters.course_scheduling) {
      where['course_scheduling'] = filters.course_scheduling;
    }
    if (filters.origin) {
      where['origin'] = filters.origin;
    }

    if (filters.without_certification && filters.course_scheduling) {
      const certifications = await CertificateQueue.find({
        courseId: filters.course_scheduling,
        status: { $in: ['New', 'In-process', 'Complete', 'Re-issue', 'Error'] }
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
    let data = []
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
              status: { $in: ['New', 'In-process', 'Requested', 'Complete', 'Re-issue', 'Error'] }
            }); //.select('');

            register.certificate = [];

            for (let itemCertificate of certificates) {
              if (itemCertificate.certificate.hash) {
                itemCertificate.certificate.pdfPath = certificateService.certificateUrlV2(itemCertificate.certificate)
              }
              // if (itemCertificate.certificate.pdfPath) {
              //   itemCertificate.certificate.pdfPath = certificateService.certificateUrl(itemCertificate.certificate.pdfPath)
              // }
              if (itemCertificate.certificate.imagePath) {
                itemCertificate.certificate.imagePath = certificateService.certificateUrl(itemCertificate.certificate.imagePath)
              }
              register.certificate.push(itemCertificate);
            }
          }
          count++
          data.push(register)
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
          ...data
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
            enrollment: response
          }
        })

      } else {

        // @INFO: Validando matrícula única: email y courseID
        if (params.documentID && params.email && params.courseID) {

          const emailAlreadyExist = await Enrollment.findOne({
            email: params.email,
            course_scheduling: courseScheduling._id
          }).select('id enrollmentCode')
          if (emailAlreadyExist) {
            return responseUtility.buildResponseFailed('json', null, { message: `La matricula con código ${emailAlreadyExist.enrollmentCode} tiene asociado el mismo correo electrónico. No es posible tener dos matriculas con el mismo correo electrónico.` })
          }

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
            sendEmail: true,
          }
          paramToEnrollment.user.moodleFirstName = params.firstname;
          paramToEnrollment.user.moodleLastName = params.lastname;
          paramToEnrollment.user.moodleUserName = newUserID;
          paramToEnrollment.user.moodleEmail = params.email;
          paramToEnrollment.user.moodlePassword = passw;

          const respCampusDataUser: any = await userService.findBy({
            query: QueryValues.ONE,
            // where: [{ field: 'profile.doc_number', value: params.documentID }]
            where: [{ field: 'username', value: newUserID }]
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
            cvUserParams['reviewData'] = {
              status: 'pending'
            }
            if (cvUserParams.password) delete cvUserParams.password

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
              const sendMailsStudents = await courseSchedulingNotificationsService.checkIfNotificationsCanSendToStudents(courseScheduling._id,CourseSchedulingNotificationEvents.ENROLLMENT)
              if (sendMailsStudents) {
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
              if (
                // respMoodle3?.message.includes('La extensión (plugin) para la matriculación manual no existe o está deshabilitada para el curso') &&
                params.origin === 'Tienda Virtual'
              ) {
                try {
                  await enrollmentTrackingService.trackEnrollmentError(
                    respMoodle3,
                    {
                      email: params.email,
                      documentId: params.documentID,
                      courseId: params.courseID,
                      course_scheduling: params.courseScheduling,
                      origin: params.origin,
                    },
                    enrollmentTrackingService.getTrackingSource(params.origin),
                    {...params}
                  );

                  const recipients = []
                  const recipientsCC = []
                  const email_enrollment_tracking = customs['mailer']['email_enrollment_tracking'] || {}
                  if (courseScheduling?.schedulingMode?.name === 'Virtual') {
                    if (email_enrollment_tracking['virtual']?.length > 0) {
                      recipients.push(...email_enrollment_tracking['virtual']?.map((e) => e.email))
                    }
                  } else {
                    const material_assistant = courseScheduling?.material_assistant || {}
                    if (material_assistant?.email) {
                      recipients.push(material_assistant?.email)
                    }
                    if (email_enrollment_tracking['presencialEnlinea']?.length > 0) {
                      recipients.push(...email_enrollment_tracking['presencialEnlinea']?.map((e) => e.email))
                    }
                  }
                  if (email_enrollment_tracking['always']?.length > 0) {
                    recipientsCC.push(...email_enrollment_tracking['always']?.map((e) => e.email))
                  }

                  if (recipients.length > 0) {
                    await notificationEventService.sendNotificationEnrollmentTracking({
                      recipients,
                      recipientsCC,
                      emailData: {
                        studentName: params.firstname,
                        error: `Error de matriculación en el servicio: ${courseScheduling?.metadata?.service_id}`,
                        studentFullName: `${params.firstname} ${params.lastname}`,
                        studentEmail: params.email,
                        studentDocumentId: params.documentID,
                        studentPhoneNumber: params.phoneNumber,
                        courseSchedulingServiceId: courseScheduling?.metadata?.service_id,
                        origin: params.origin
                      }
                    })
                  }
                } catch (err) {
                  console.log('EnrollmentService::InsertOrUpdate::MoodleEnrollmentFailed', err)
                }
              }
              const find: any = await Enrollment.findOne({ _id })
              if (find) await find.delete()

              return responseUtility.buildResponseFailed('json', null, {error_key: {key: 'enrollment.insertOrUpdate.error', params: {
                errorMessage: respMoodle3.message || 'Se ha presentado un error al matricular en moodle'
              }}})
            }

            try {
              if (params?.trackingEnrollment) {
                // Caso de éxito en la matrícula
                const enrollmentData: IEnrollmentData = {
                  userId: params.user,
                  email: params.email,
                  documentId: params.documentID,
                  courseId: params.courseID,
                  course_scheduling: params.courseScheduling,
                  enrollmentId: _id,
                  enrollmentCode: enrollmentCode,
                  status: EnrollmentStatus.REGISTERED,
                  origin: params.origin,
                };
                await enrollmentTrackingService.trackEnrollmentSuccess(
                  enrollmentData,
                  enrollmentTrackingService.getTrackingSource(params.origin),
                  {...params}
                );
              }
            } catch (err) {}


            const {serviceTypeKey} = courseSchedulingService.getServiceType(courseScheduling)
            const withoutTutor = courseScheduling?.withoutTutor ?? false
            if (
              (serviceTypeKey && serviceTypeKey === CourseSchedulingTypesKeys.QUICK_LEARNING) ||
              withoutTutor
            ) {
              params.sendEmail = 'true'
            }
            // @INFO: Se envia email de bienvenida
            if ((params.sendEmail === true || params.sendEmail === 'true') && courseScheduling.schedulingStatus.name === 'Confirmado') {
              const sendMailsStudents = await courseSchedulingNotificationsService.checkIfNotificationsCanSendToStudents(courseScheduling._id,CourseSchedulingNotificationEvents.ENROLLMENT)
              if (sendMailsStudents) {
                let customTemplate = undefined
                let course_start = moment.utc(courseScheduling.startDate).format('YYYY-MM-DD')
                let course_end = moment.utc(courseScheduling.endDate).format('YYYY-MM-DD')
                let serviceValidity = courseScheduling?.serviceValidity ? generalUtility.getDurationFormated(courseScheduling.serviceValidity, 'large', true) : undefined

                if (serviceTypeKey && serviceTypeKey === CourseSchedulingTypesKeys.QUICK_LEARNING) {
                  customTemplate = 'user/enrollmentUserQuickLearning'
                }
                const {courseEndDate, courseStartDate} = enrollmentService.getCourseEndStatus(
                  moment.utc().format('YYYY-MM-DD'),
                  {
                    serviceStartDate: courseScheduling.startDate,
                    serviceEndDate: courseScheduling.endDate
                  },
                  courseScheduling?.serviceValidity ? Number(courseScheduling?.serviceValidity) : undefined,
                  0
                )
                course_start = courseStartDate
                course_end = courseEndDate

                await courseSchedulingService.sendEnrollmentUserEmail([params.email], {
                  mailer: customs['mailer'],
                  first_name: userEnrollment.profile.first_name,
                  username: userEnrollment.username || '',
                  course_name: courseScheduling.program.name,
                  service_id: courseScheduling?.metadata?.service_id || '',
                  course_start,
                  course_end,
                  notification_source: `course_start_${userEnrollment._id}_${courseScheduling._id}`,
                  type: 'student',
                  customTemplate,
                  serviceValidity
                })
              }
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
      try {
        const username = find.documentID.toLowerCase().replace(/ /g, "_");
        const paramUserMoodle = {
          username: username
        }
        const respMoodle2: any = await moodleUserService.findBy(paramUserMoodle);
        if (respMoodle2?.status === 'success' && respMoodle2?.user?.id) {
          const enrollment = {
            courseid: find.courseID,
            userid: respMoodle2.user.id,
          }
          await moodleEnrollmentService.delete(enrollment);
        }

      } catch (err) {
        console.log('EnrollmentService::Delete::Moodle', err)
      }

      await find.delete()

      if (user && course_scheduling) {
        if (course_scheduling.schedulingStatus.name === 'Confirmado') {
          // @INFO: Eliminando notificación de inicio del curso en caso que se vuelva a matricular en el mismo programa
          const amountNotification = await MailMessageLog.findOne({ notification_source: `course_start_${user._id}_${course_scheduling._id}` })
          if (amountNotification) await amountNotification.delete()

          const sendMailsStudents = await courseSchedulingNotificationsService.checkIfNotificationsCanSendToStudents(course_scheduling._id,CourseSchedulingNotificationEvents.UNENROLLMENT)
          if (sendMailsStudents) {
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
      }
      return responseUtility.buildResponseSuccess('json')
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
        where.push({
          $match: {
            deleted: false
          }
        })
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
          const certificates = await CertificateQueue
            .find({ userId: register.user, courseId: register.course_scheduling, status: 'Complete' })
            .populate({ path: 'certificateSetting', select: '_id certificateName certificationType' });
          if (certificates && certificates.length) {
            registers[idx].certificates = [...certificates]
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

  /**
   * Este método solo funciona para servicios con certificación multiple
   * @param param0
   * @returns
   */
  public getCurrentEnrollmentStatus = async ({
    enrollmentId,
  }: IGetCurrentEnrollmentStatusParams) => {
    try {
      if (!enrollmentId) return responseUtility.buildResponseFailed('json')

      const enrollment = await Enrollment
        .findOne({ _id: enrollmentId })
        .select('_id user course_scheduling')
        .populate([
          {
            path: 'user',
            select: '_id moodle_id'
          },
          {
            path: 'course_scheduling',
            select: '_id moodle_id'
          }
        ])
      if (!enrollment) return responseUtility.buildResponseFailed('json')

      const userMoodleId = enrollment.user.moodle_id
      const courseSchedulingMoodleId = enrollment.course_scheduling.moodle_id
      if (!userMoodleId || !courseSchedulingMoodleId) return responseUtility.buildResponseFailed('json')

      const moodleItemsToSearch = ['attendance', 'assign', 'quiz', 'course', 'forum']

      const [certificateSettings, userCertificates, moodleActivities, moodleCompletion] = await Promise.all([
        CertificateSettings
          .find({ courseScheduling: enrollment.course_scheduling._id })
          .select('_id'),
        CertificateQueue
          .find({ userId: enrollment.user._id, courseId: enrollment.course_scheduling._id, status: { $ne: CertificateQueueStatus.ERROR } })
          .select('_id certificateSetting'),
        gradesService.fetchGradesByFilter({
            courseID: courseSchedulingMoodleId,
            userID: userMoodleId,
            filter: moodleItemsToSearch
          }),
        completionstatusService.activitiesCompletion({
          courseID: courseSchedulingMoodleId, //register.courseID,
          userID: userMoodleId, //register.user.moodle_id
        })
      ])

      const grades = (moodleActivities as any).grades
      const completion = (moodleCompletion as any)?.completion ?? []
      const doesExistProgress = grades?.some((grade) => {
        const itemTypes = grade?.itemType ? grade?.itemType : {}
        return Object.values(itemTypes).some((itemsProgress: Array<any>) =>
          itemsProgress?.some((itemProgress) => itemProgress?.graderaw > 0)
        )
      })

      const totalActivities = completion.length
      const activitiesCompleted = completion.filter((c) => c.state === 1).length
      let generalProgress = 0;
      if (totalActivities > 0) {
        generalProgress = Math.trunc((activitiesCompleted / totalActivities) * 100);
      }

      const allCertificatesGenerated = !!userCertificates?.length && !certificateSettings?.some((setting) =>
        !userCertificates?.some((userCertificate) => userCertificate?.certificateSetting?.toString() === setting._id?.toString())
      )

      const allCertifiedWerePaid = await transactionService.certificateWasPaid(userCertificates?.map(({ _id }) => _id?.toString()))

      const currentStatus = !doesExistProgress ? EnrollmentStatus.REGISTERED :
        doesExistProgress && !allCertificatesGenerated ? EnrollmentStatus.IN_PROGRESS :
        doesExistProgress && allCertificatesGenerated && !allCertifiedWerePaid ? EnrollmentStatus.COMPLETED :
        doesExistProgress && allCertificatesGenerated && allCertifiedWerePaid ? EnrollmentStatus.CERTIFIED :
        null

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          currentStatus,
          generalProgress
        }
      })

    } catch (e) {
      console.log('EnrollmentService -> getCurrentEnrollmentStatus -> ERROR: ', e)
      return responseUtility.buildResponseFailed('json')
    }
  }


  public buyCoursesByShoppingCart = async (request: IBuyCoursesByShoppingCart) => {
    const {buyerId, itemsToBuy, force, billingInfo} = request

    let _buyerId = buyerId;
    let roles = {}

    const rolesResponse: any = await roleService.list()
    if (rolesResponse.status === 'success') {
      for await (const iterator of rolesResponse.roles) {
        roles[iterator.name] = iterator._id
      }
    }

    if (!billingInfo) {
      return responseUtility.buildResponseFailed('json', null, {message: 'La información de facturación es requerida'})
    }

    // const buyer = await User.findOne({_id: buyerId})
    // if (!buyer) {
    //   return responseUtility.buildResponseFailed('json', null, {message: 'El comprador NO es valido'})
    // }

    // Clean and handle duplicates
    const itemsToBuyClean = mapUtility.handleDuplicates(itemsToBuy ?? [], 'identifier', 'remove')

    // Separate items by buyAction
    const itemsForBuyer = itemsToBuyClean.filter(item =>
      item.buyAction === BUY_ACTION.FOR_MYSELF || item.buyAction === BUY_ACTION.FOR_ME_AND_OTHERS
    )
    const itemsForOthers = itemsToBuyClean.filter(item =>
      item.buyAction === BUY_ACTION.FOR_OTHERS || item.buyAction === BUY_ACTION.FOR_ME_AND_OTHERS
    )

    // If there are items for the buyer, validate them
    let objectsToBuy: ObjectsToBuy = {}

    if (itemsForBuyer.length > 0) {
      // Apply business validations for the buyer
      const validationResult = await this.validateItemsForBuyer(itemsForBuyer, _buyerId, force)

      if (!validationResult.canEnrollment) {
        return responseUtility.buildResponseSuccess('json', null, {
          message: 'Verificar compra',
          additional_parameters: {
            processPurchase: PROCESS_PURCHASE.VERIFY_PURCHASE,
            review: validationResult.objectsToBuy
          }
        })
      }

      objectsToBuy = validationResult.objectsToBuy
    }

    // Add items for others without validation
    itemsForOthers.forEach(item => {
      if (!objectsToBuy[item.identifier]) {
        objectsToBuy[item.identifier] = {
          processPurchase: PROCESS_ITEM_PURCHASE.AVAILABLE,
          reason: `${item.description} está listo para la compra.`,
          programCode: item.programCode,
          programName: item.description,
          externalId: item.externalId,
          identifier: item.identifier,
        }
      }
    })

    try {
      if (!_buyerId) {
        const newUserCreated = await userService.insertOrUpdate({
          username: billingInfo.docNumber,
          email: billingInfo.email ?? '',
          password: billingInfo.docNumber,
          roles: [roles['student']],
          profile: {
            doc_type: billingInfo.docType,
            doc_number: billingInfo.docNumber,
            first_name: billingInfo.firstName,
            last_name: billingInfo.lastName,
          }
        })
        if (newUserCreated.status === 'error') {
          if (newUserCreated.status_code === "user_insertOrUpdate_already_exists") {
            return responseUtility.buildResponseFailed('json', null, {
              message: 'Debes iniciar sesión para continuar.'
            });
          }
          return newUserCreated;
        }
        _buyerId = newUserCreated?.user?._id;

      }
    } catch (err) {
      console.log(`EnrollmentService -> buyCoursesByShoppingCart --> createUser -> ERROR: ${err}`)
      return responseUtility.buildResponseFailed('json', null, {
        message: 'Error al crear el usuario'
      })
    }

    try {
      // Create transaction with Efipay
      const transactionResult = await this.createShoppingCartTransaction({
        buyerId: _buyerId,
        items: itemsToBuyClean,
        billingInfo
      })

      if (transactionResult.status === 'error') {
        return responseUtility.buildResponseFailed('json', null, {
          message: transactionResult.message || 'Error al crear la transacción'
        })
      }

      return responseUtility.buildResponseSuccess('json', null, {
        message: 'Redirección a pasarela de pagos',
        additional_parameters: {
          processPurchase: PROCESS_PURCHASE.REDIRECT,
          redirectUrl: transactionResult.redirectUrl
        }
      })
    } catch (err) {
      console.log(`EnrollmentService -> buyCoursesByShoppingCart -> ERROR: ${err}`)
      return responseUtility.buildResponseFailed('json', null, {
        message: 'Error al procesar la compra'
      })
    }

  }

  // New method to validate items for the buyer
  private validateItemsForBuyer = async (items: IShoppingCarItem[], buyerId: string, force?: boolean) => {
    const enrolledPrograms = []
    const certifiedPrograms = []

    const itemsByProgramDuplicated = mapUtility.findDuplicates(items ?? [], 'programCode')
    const groupProgramDuplicated = itemsByProgramDuplicated.reduce((accum, element) => {
      if (!accum[element.programCode]) {
        accum[element.programCode] = []
      }
      accum[element.programCode].push(element)
      return accum;
    }, {})

    const {serviceIds, programCodes, objectsToBuy} = items.reduce((accum, element) => {
      accum.serviceIds.push(element.identifier);
      accum.programCodes.push(element.programCode);
      accum.objectsToBuy[element.identifier] = {
        processPurchase: groupProgramDuplicated[element.programCode] ? PROCESS_ITEM_PURCHASE.WARNING : PROCESS_ITEM_PURCHASE.AVAILABLE,
        reason: groupProgramDuplicated[element.programCode] ?
          `Ya has seleccionado este programa (${element.description}) en otro servicio. ¿Estás seguro de que deseas inscribirte nuevamente?` :
          `${element.description} está listo para la compra.`,
        programCode: element.programCode,
        programName: element.description,
        externalId: element.externalId,
        identifier: element.identifier,
      }
      return accum;
    }, {serviceIds: [], programCodes: [], objectsToBuy: {}})

    // Query enrollments for the buyer
    const enrollments = await Enrollment.aggregate([
      {
        $match: {
          user: ObjectID(buyerId),
          deleted: false,
        }
      },
      {
        $lookup: {
          from: "course_schedulings",
          localField: "course_scheduling",
          foreignField: "_id",
          as: "service"
        }
      },
      {
        $unwind: { path: "$service", "preserveNullAndEmptyArrays": true }
      },
      {
        "$lookup": {
          "from": "course_scheduling_statuses",
          "localField": "service.schedulingStatus",
          "foreignField": "_id",
          "as": "status"
        }
      },
      {
        "$unwind": { "path": "$status", "preserveNullAndEmptyArrays": true }
      },
      {
        "$lookup": {
          "from": "programs",
          "localField": "service.program",
          "foreignField": "_id",
          "as": "program"
        }
      },
      {
        "$unwind": { "path": "$program", "preserveNullAndEmptyArrays": true }
      },
      {
        $project: {
          _id: "$_id",
          courseID: "$courseID",
          origin: "$origin",
          created_at: "$created_at",
          "serviceId": "$service._id",
          "serviceCode": "$service.metadata.service_id",
          "serviceStatusName": "$status.name",
          "serviceProgramName": "$program.name",
          "serviceProgramCode": "$program.code"
        }
      }
    ])

    enrollments.forEach(element => {
      enrolledPrograms.push(element.serviceProgramCode)
      if (objectsToBuy[element.serviceId]) {
        // If the participant is already enrolled in the service, they cannot enroll again
        objectsToBuy[element.serviceId].processPurchase = PROCESS_ITEM_PURCHASE.RESTRICTED;
        switch (element.serviceStatusName) {
          case 'Ejecutado':
            objectsToBuy[element.serviceId].reason = `No puedes comprar ${element.serviceProgramName} porque este servicio (${element.serviceCode}) ya ha finalizado, por lo que no es posible inscribirse nuevamente.`;
            break;
          case 'Confirmado':
            objectsToBuy[element.serviceId].reason = `No puedes comprar ${element.serviceProgramName} porque ya estás inscrito (${element.serviceCode}) y tu matrícula está en proceso.`;
            break;
          case 'Programado':
            objectsToBuy[element.serviceId].reason = `No puedes comprar ${element.serviceProgramName} porque ya estás inscrito (${element.serviceCode}) y está próximo a iniciar.`;
            break;
          default:
            objectsToBuy[element.serviceId].reason = `No puedes comprar ${element.serviceProgramName} porque este servicio (${element.serviceCode}) no está disponible para matrícula en este momento.`;
            break;
        }
      }
    })

    // Check certificates for the buyer
    const certificates = await CertificateQueue.find({
      userId: buyerId
    }).populate([
      {path: 'courseId', select: 'program', populate: [
        {path: 'program', select: 'code'}
      ]}
    ]).select('courseId status')

    certificates.forEach(element => {
      if (element?.courseId?.program?.code) {
        certifiedPrograms.push(element?.courseId?.program?.code)
      }
    });

    programCodes.forEach(element => {
      let process = false
      let processPurchase = PROCESS_ITEM_PURCHASE.RESTRICTED
      let reason = ``;
      if (certifiedPrograms.includes(element)) {
        // Validation to determine if the participant is already certified in the program
        process = true
        reason = `No puedes comprar :programName porque ya estás certificado.`
      } else if (enrolledPrograms.includes(element)) {
        // Validation to determine if the participant has already taken the same program in another service
        process = true
        reason = `No puedes comprar :programName porque ya estás inscrito.`;
      }
      if (process) {
        Object.keys(objectsToBuy)
          .filter((o) => objectsToBuy[o].programCode === element)
          .map((o) => {
            if (objectsToBuy[o].processPurchase === PROCESS_ITEM_PURCHASE.AVAILABLE) {
              objectsToBuy[o].processPurchase = processPurchase
              objectsToBuy[o].reason = reason.replace(':programName', objectsToBuy[o].programName);
            }
          })
      }
    });

    if (force) {
      Object.keys(objectsToBuy).map((i) => {
        if (objectsToBuy[i].processPurchase === PROCESS_ITEM_PURCHASE.WARNING) {
          objectsToBuy[i].processPurchase = PROCESS_ITEM_PURCHASE.AVAILABLE
        }
      })
    }

    const canEnrollment = Object.keys(objectsToBuy).every((i) => objectsToBuy[i].processPurchase === PROCESS_ITEM_PURCHASE.AVAILABLE)

    return {
      canEnrollment,
      objectsToBuy
    }
  }

  // New method to create a transaction with Efipay
  private createShoppingCartTransaction = async ({
    buyerId,
    items,
    billingInfo
  }: ICreateShoppingCartTransaction) => {
    try {
      // Create a new transaction record
      const transactionResponse: any = await transactionService.insertOrUpdate({})
      if (transactionResponse.status === 'error') {
        return {
          status: 'error',
          message: 'Error al generar la transacción'
        }
      }

      const transaction: ITransaction = transactionResponse.transaction

      // Calculate total price
      const totalBaseAmount = items.reduce((total, item) => {
        return total + (item.priceWithDiscountNumeric || item.priceNumeric) * item.numberOfPlaces
      }, 0)

      const iva = totalBaseAmount * 0.19
      const totalAmount = (iva + totalBaseAmount).toFixed(2)

      // Get first item for description
      const firstItem = items[0]
      const description = items.length > 1
        ? `${firstItem.description} y ${items.length - 1} curso(s) más`
        : firstItem.description

      // Prepare payment parameters
      const minutesLimit = efipaySetup.payment_limit_minutes
      const limitDate = moment().add(minutesLimit, 'minutes').format('YYYY-MM-DD')
      const campusUrl = customs.campus_virtual

      const paymentParams: IGeneratePaymentParams = {
        payment: {
          amount: Number(totalAmount),
          checkout_type: EfipayCheckoutType.REDIRECT,
          currency_type: billingInfo.currency,
          description: description,
          selected_taxes: [EfipayTaxes.IVA_19]
        },
        advanced_options: {
          has_comments: false,
          limit_date: limitDate,
          picture: items[0].image,
          references: [transaction._id],
          result_urls: {
            approved: `${campusUrl}/payment-status/${transaction._id}`,
            pending: `${campusUrl}/payment-status/${transaction._id}`,
            rejected: `${campusUrl}/payment-status/${transaction._id}`,
            webhook: `${host}/api/admin/transaction/on-transaction-success`,
          }
        },
        office: efipaySetup.office_number
      }

      // Generate payment with Efipay
      const paymentResponse = await efipayService.generatePayment(paymentParams)

      if (!paymentResponse?.payment_id) {
        await transactionService.delete(transaction._id)
        return {
          status: 'error',
          message: 'Error al generar la transacción con la pasarela de pagos'
        }
      }

      // Update transaction with payment details
      transaction.id = transaction._id
      transaction.buyer = buyerId;
      transaction.paymentId = paymentResponse.payment_id
      transaction.redirectUrl = paymentResponse.url
      transaction.status = TransactionStatus.IN_PROCESS
      transaction.billingInfo = {
        fullName: billingInfo.fullName,
        docNumber: billingInfo.docNumber,
        nature: billingInfo.nature,
        classification: billingInfo.classification,
        country: billingInfo.country,
        department: billingInfo.department,
        city: billingInfo.city,
        currency: billingInfo.currency,
        email: billingInfo.email,
      }
      transaction.baseAmount = totalBaseAmount
      transaction.taxesAmount = iva
      transaction.totalAmount = parseFloat(totalAmount)

      // Store shopping cart items in transaction
      transaction.shoppingCartItems = items.map(item => ({
        identifier: item.identifier,
        programCode: item.programCode,
        externalId: item.externalId,
        description: item.description,
        price: item.priceWithDiscountNumeric || item.priceNumeric,
        numberOfPlaces: item.numberOfPlaces,
        buyAction: item.buyAction,
        buyerId: buyerId
      }))

      const updateResponse = await transactionService.insertOrUpdate(transaction)
      if (updateResponse.status === 'error') {
        await transactionService.delete(transaction._id)
        return {
          status: 'error',
          message: 'Error al actualizar la transacción'
        }
      }

      return {
        status: 'success',
        redirectUrl: paymentResponse.url
      }

    } catch (err) {
      console.log(`EnrollmentService -> createShoppingCartTransaction -> ERROR: ${err}`)
      return {
        status: 'error',
        message: 'Error al procesar la transacción'
      }
    }
  }

  public getEndingServiceWithDateValidity = (enrollmentDate: string, validityTime: number) => {
    try {
      const startDate = moment(enrollmentDate) //enrollment.created_at
      const days = this.getDays(validityTime)
      return startDate.add(days, 'days').format('YYYY-MM-DDT23:59:59')
    } catch (e) {
      return false
    }
  }

  private getDays(seconds) {
    return Math.floor(seconds / (24 * 60 * 60));
  }

  public getCourseEndStatus(
    enrollmentDate: string,
    serviceData: {serviceEndDate: string, serviceStartDate: string},
    durationSeconds: number,
    daysBeforeEnd: number
  ): {hasEnded: boolean;isEndingSoon: boolean;daysToEnding: number; daysSinceEnd: number; courseEndDate: string, courseStartDate: string} {
    const today = moment()
    const calculateByUserEnrollmentDate = durationSeconds ? true : false
    // Convert enrollmentDate to a moment object
    const startDate = calculateByUserEnrollmentDate ? moment(enrollmentDate).set('hours', 0).set('minutes', 0) : moment(serviceData.serviceStartDate).set('hours', 0).set('minutes', 0);

    if (!startDate.isValid()) {
      throw new Error('Invalid enrollment date');
    }

    // Calculate the course end date
    const courseEndDate = calculateByUserEnrollmentDate ? startDate.clone().add(durationSeconds, 'seconds').set('hours', 23).set('minutes', 59) : moment(serviceData.serviceEndDate).set('hours', 23).set('minutes', 59);

    // Calculate the trigger date (courseEndDate - daysBeforeEnd)
    const triggerDate = courseEndDate.clone().subtract(daysBeforeEnd, 'days');

    // Determine if the course has ended
    const hasEnded = today.startOf('day').isSameOrAfter(courseEndDate.startOf('day'));

    // Determine if the course is ending soon
    const isEndingSoon = today.startOf('day').isSameOrAfter(triggerDate.startOf('day')) && !hasEnded;

    // Calculate days since the course ended (0 if not ended)
    const daysSinceEnd = hasEnded
      ? today.diff(courseEndDate, 'days')
      : 0;

    const daysToEnding = courseEndDate.diff(today, 'days')

    return {
      hasEnded,
      isEndingSoon,
      daysToEnding,
      daysSinceEnd,
      courseEndDate: courseEndDate.format('YYYY-MM-DD'),
      courseStartDate: startDate.format('YYYY-MM-DD')
    };
  }
}

export const enrollmentService = new EnrollmentService();
export { EnrollmentService as DefaultAdminEnrollmentEnrollmentService };
