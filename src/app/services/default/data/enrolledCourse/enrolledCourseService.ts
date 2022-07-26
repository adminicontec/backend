// @import_dependencies_node Import libraries
import moment from 'moment';
// @end

// @import services
import { certificateService } from '@scnode_app/services/default/huellaDeConfianza/certificate/certificateService'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import { CertificateQueue, CourseScheduling, CourseSchedulingDetails, Enrollment, User } from '@scnode_app/models'
// @end

// @import types
import { IFetchEnrollementByUser, IFetchCertifications } from '@scnode_app/types/default/data/enrolledCourse/enrolledCourseTypes'
// @end

class EnrolledCourseService {

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
  public fetchEnrollmentByUser = async (params: IFetchEnrollementByUser) => {
    let registers = []
    let history = []
    let steps = []

    let added = {}

    try {
      steps.push('1')
      steps.push(params.user)
      const enrolled = await Enrollment.find({
        user: params.user
      }).select('id course_scheduling')
        .populate({
          path: 'course_scheduling', select: 'id program startDate moodle_id metadata schedulingStatus', populate: [
            { path: 'program', select: 'id name code moodle_id' },
            { path: 'schedulingStatus', select: 'id name'}
          ]
        })
        .lean()
      steps.push('2')
      steps.push(enrolled)

      enrolled.map((e) => {
        if (e.course_scheduling && e.course_scheduling.program && e.course_scheduling.program) {
          if (!added[e.course_scheduling.moodle_id]) {

            console.log('----------------------------');
            console.log(e.course_scheduling);
            let item = {
              _id: e.course_scheduling.moodle_id,
              name: e.course_scheduling.program.name,
              service_id: e.course_scheduling.metadata.service_id,
              startDate: e.course_scheduling.startDate,
              courseScheduling: e.course_scheduling._id,
            }
            if (['Ejecutado', 'Cancelado'].includes(e.course_scheduling?.schedulingStatus?.name)) {
              history.push(item)
            } else {
              registers.push(item)
            }
            added[e.course_scheduling.moodle_id] = e.course_scheduling.moodle_id
          }
        }
      })
      steps.push('3')

      const courses = await CourseSchedulingDetails.find({
        teacher: params.user
      }).select('id course_scheduling')
        .populate({
          path: 'course_scheduling', select: 'id program startDate moodle_id metadata schedulingStatus', populate: [
            { path: 'program', select: 'id name code moodle_id' },
            { path: 'schedulingStatus', select: 'id name'}
          ]
        })
        .lean()
      steps.push('4')
      steps.push(courses)

      courses.map((e) => {
        if (e.course_scheduling && e.course_scheduling.program && e.course_scheduling.program) {
          if (!added[e.course_scheduling.moodle_id]) {

            console.log('----------------------------');
            console.log(e.course_scheduling);
            let item = {
              _id: e.course_scheduling.moodle_id,
              name: e.course_scheduling.program.name,
              service_id: e.course_scheduling.metadata.service_id,
              startDate: e.course_scheduling.startDate,
              courseScheduling: e.course_scheduling._id,
            }

            if (['Ejecutado', 'Cancelado'].includes(e.course_scheduling?.schedulingStatus?.name)) {
              history.push(item)
            } else {
              registers.push(item)
            }

            added[e.course_scheduling.moodle_id] = e.course_scheduling.moodle_id
          }
        }
      })
      steps.push(5)

      registers.sort((a, b) => moment.utc(b.startDate).diff(moment.utc(a.startDate)))
    } catch (e) {
      steps.push('error')
    }
    steps.push('6')

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        current_courses: [
          ...registers
        ],
        history_courses: [
          ...history
        ],
        steps
      }
    })
  }

  /**
   * Metodo que permite listar todos los registros
   * @param [filters] Estructura de filtros para la consulta
   * @returns
   */
  public fetchCertifications = async (params: IFetchCertifications) => {

    const paging = (params.pageNumber && params.nPerPage) ? true : false
    const pageNumber = params.pageNumber ? (parseInt(params.pageNumber)) : 1
    const nPerPage = params.nPerPage ? (parseInt(params.nPerPage)) : 10

    let select = 'id userId courseId auxiliar certificateType certificateModule status message certificate created_at'

    let _where = [];

    let whereCourseScheduling = {}

    if (params.company) {
      whereCourseScheduling['client'] = params.company
    }

    if (params.search) {
      whereCourseScheduling['metadata.service_id'] = params.search;
    }

    if (params.searchDoc) {
      _where.push({
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user_doc"
        }
      }, {
        $match: {
          'user_doc.profile.doc_number': { $regex: '.*' + params.searchDoc + '.*', $options: 'i' }
        }
      })
    }

    if (params.certificate_clients) {
      whereCourseScheduling['certificate_clients'] = true
    }

    if (params.certificate_students) {
      whereCourseScheduling['certificate_students'] = true
    }

    if (params.status) {
      _where.push({
        $match: {
          "status": { $in: params.status }
        }
      })
    }

    _where.push({
      $match: {
        "deleted": false
      }
    })

    if (Object.keys(whereCourseScheduling).length > 0) {
      const course_scheduling = await CourseScheduling.find(whereCourseScheduling).select('id')
      const course_scheduling_ids = course_scheduling.reduce((accum, element) => {
        accum.push(element._id)
        return accum
      }, [])
      _where.push({
        $match: {
          "courseId": { $in: course_scheduling_ids }
        }
      })
      if (course_scheduling_ids.length > 0) {
      }
    }

    let registers = []

    try {
      // registers = await CertificateQueue.find(_where)
      //   .populate({ path: 'userId', select: 'id profile.first_name profile.last_name profile.doc_number' })
      //   .populate({ path: 'auxiliar', select: 'id profile.first_name profile.last_name' })
      //   .populate({
      //     path: 'courseId', select: 'id metadata program', populate: [{
      //       path: 'program', select: 'id name moodle_id code'
      //     }]
      //   })
      //   .skip(paging ? (pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0) : null)
      //   .limit(paging ? nPerPage : null)
      //   .sort({ startDate: -1 })
      //   .select(select)
      //   .lean()
      registers = await CertificateQueue.aggregate(_where)
        .skip(paging ? (pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0) : null)
        .limit(paging ? nPerPage : null)
        .sort({ startDate: -1 })

      await CertificateQueue.populate(registers, [
        { path: 'userId', select: 'id profile.first_name profile.last_name profile.doc_number' },
        { path: 'auxiliar', select: 'id profile.first_name profile.last_name' },
        {
          path: 'courseId', select: 'id metadata program', populate: [{
            path: 'program', select: 'id name moodle_id code'
          }]
        }
      ])

      const newRegisters = [];
      for await (let registerInit of registers) {
        let register = registerInit._doc ? { ...registerInit._doc } : { ...registerInit }
        if (register.userId && register.userId.profile) {
          register = {
            ...register,
            userId: {
              ...register.userId._doc ? register.userId._doc : register.userId,
              fullname: `${register.userId.profile.first_name} ${register.userId.profile.last_name}`
            }
          }
          // register.userId['fullname'] = `${register.userId.profile.first_name} ${register.userId.profile.last_name}`
        }
        if (register.auxiliar && register.auxiliar.profile) {
          register = {
            ...register,
            auxiliar: {
              ...register.auxiliar._doc ? register.auxiliar._doc : register.auxiliar,
              fullname: `${register.auxiliar.profile.first_name} ${register.auxiliar.profile.last_name}`
            }
          }
          // register.auxiliar.fullname = `${register.auxiliar.profile.first_name} ${register.auxiliar.profile.last_name}`
        }


        if (register.created_at) register.date = moment.utc(register.created_at).format('YYYY-MM-DD')

        if (register?.certificate?.pdfPath) {
          register.certificate.pdfPath = certificateService.certificateUrl(register.certificate.pdfPath)
        }
        if (register?.certificate?.imagePath) {
          register.certificate.imagePath = certificateService.certificateUrl(register.certificate.imagePath)
        }

        newRegisters.push(register);
      }

      registers = newRegisters

      console.log('Registros: ', registers)
    } catch (error) { }

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        certifications: [
          ...registers
        ],
        // total_register: (paging) ? await CertificateQueue.find(_where).countDocuments() : 0,
        total_register: (paging) ? (_where.length ? (await CertificateQueue.aggregate(_where)).length : 0) : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    })
  }

  public downloadMasiveCertifications = async (params) => {
    try {

      // TODO: Validar si no viene ningun certificado a generar

      const certifications = await CertificateQueue.find({
        _id: { $in: params.certification_queue }
      })

      const certification_urls = []


      for await (const certification of certifications) {
        if (certification.certificate?.pdfPath) {
          const url = certificateService.getCertificatePath(certification.certificate?.pdfPath)
          certification_urls.push(url)
        }
      }

      if (certification_urls.length === 0) return responseUtility.buildResponseFailed('json', null, { error_key: 'certificate.download_masive.no_certificate_to_download' }) // TODO: Validar error

      const time = new Date().getTime()

      const result = await certificateService.generateZipCertifications({
        files: certification_urls,
        to_file: {
          file: {
            name: `${time}.zip`,
          },
          path: certificateService.default_certificate_zip_path,
        }
      })

      return result

    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }
}

export const enrolledCourseService = new EnrolledCourseService();
export { EnrolledCourseService as DefaultDataEnrolledCourseEnrolledCourseService };
