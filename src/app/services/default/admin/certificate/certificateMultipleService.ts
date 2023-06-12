// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import { CertificateQueue, CertificateSettings, CourseScheduling, Enrollment } from '@scnode_app/models';
// @end

// @import types
import { ICertificateMultipleData, ICertificateMultipleDataCertification, ICertificateMultipleDataCertificationModule, ICertificateMultipleDataCertificationModuleCriteriaResume, ICertificateMultipleDataResponse, ICertificateMultipleDataStudent, ICertificateMultipleGenerate, ICertificateQueueMultiple } from '@scnode_app/types/default/admin/certificate/certificateMultipleTypes';
import { CertificateMultipleCriteriaFactory } from './certificateCriteria/certificateMultipleCriteriaFactory';
import { CertificateSettingCriteria } from '@scnode_app/types/default/admin/course/certificateSettingsTypes';
import { certificateService } from '@scnode_app/services/default/huellaDeConfianza/certificate/certificateService';
// @end

class CertificateMultipleService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite insertar/actualizar un registro
   * @param params Elementos a registrar
   * @returns
   */
  public certificateData = async (params: ICertificateMultipleData) => {

    try {
      const { course_scheduling, studentId, without_certification } = params

      const responseValidate: any = await this.validateAccessToCertificateMultiple(course_scheduling)
      if (responseValidate.status === 'error') return responseValidate;

      const courseScheduling = responseValidate.courseScheduling

      // @INFO: Configuración de los certificados para el servicio
      const certificateSettings = await CertificateSettings.find({
        courseScheduling: courseScheduling._id
      })
      .populate({path: 'modules.courseSchedulingDetail', select: 'id course', populate: [
        {path: 'course', select: 'id name'}
      ]})

      // @INFO: Consultar certificados generados
      const certificates = await CertificateQueue.find({
        courseId: courseScheduling._id,
        status: { $in: ['New', 'In-process', 'Complete'] }
      })
      const certificatesByStudent = certificates?.reduce((accum, certificate) => {
        if (certificate?.userId && certificate?.certificateSetting) {
          if (!accum[certificate?.userId.toString()]) {
            accum[certificate?.userId.toString()] = {}
          }
          accum[certificate?.userId.toString()][certificate?.certificateSetting?.toString()] = certificate;
        }
        return accum
      }, {})

      // @INFO: Consulta de estudiantes matriculados al servicio
      const whereEnrollents = {
        course_scheduling,
      }
      if (studentId) {
        whereEnrollents['user'] = studentId
      }
      const enrollments = await Enrollment.find(whereEnrollents)
      .select('id user courseID course_scheduling enrollmentCode')
      .populate({ path: 'user', select: 'id email phoneNumber profile.first_name profile.last_name profile.doc_type profile.doc_number profile.regional profile.origen moodle_id' })
      .lean();

      const students: ICertificateMultipleDataStudent[] = []
      for (const enrollment of enrollments) {
        const studentName = (enrollment?.user?.profile) ? `${enrollment?.user?.profile?.first_name} ${enrollment?.user?.profile?.last_name}` : '-'
        const student: ICertificateMultipleDataStudent = {
          studentCode: enrollment?.enrollmentCode || '-', // OK
          studentName, // OK
          userId: enrollment?.user?._id || '-', // OK
          certifications: [] // TODO: Pending
        }

        const studentCertificates = certificatesByStudent[enrollment?.user?._id.toString()] || {}

        for (const certificateSetting of certificateSettings) {
          const hasCertificate = studentCertificates[certificateSetting._id.toString()] ? true : false
          const certification: ICertificateMultipleDataCertification = {
            certificateSettingId: certificateSetting._id, // OK
            certificateName: certificateSetting?.certificateName, // OK
            approved: false, // OK
            certificateType: certificateSetting?.certificationType, // OK
            certificate: { // OK
              isGenerated: false
            },
            modules: [] // TODO: Pending
          }

          if (hasCertificate) {
            if (without_certification) {
              continue;
            }
            const certificate = studentCertificates[certificateSetting._id.toString()];
            certification.certificate.isGenerated = true;
            certification.certificate.certificateHash = certificate?.certificate?.hash;
            if (certificate?.certificate.pdfPath) {
              certification.certificate.certificateUrl = certificateService.certificateUrl(certificate?.certificate.pdfPath)
            }
            certification.certificate.certificateDate = certificate?.certificate.date
          }

          for (const certificateSettingModule of certificateSetting?.modules) {
            const module: ICertificateMultipleDataCertificationModule = {
              courseSchedulingDetailId: certificateSettingModule?.courseSchedulingDetail?._id, // OK
              courseSchedulingDetailName: certificateSettingModule?.courseSchedulingDetail?.course?.name || '-', // OK
              moduleCriteriaResume: [], // TODO: Pending
              approved: false // OK
            }

            Object.keys(CertificateSettingCriteria).map((criteria) => {
              const item = certificateSettingModule[criteria.toLowerCase()];
              if (item && item?.status === true) {
                const moduleCriteria: ICertificateMultipleDataCertificationModuleCriteriaResume = {
                  type: CertificateSettingCriteria[criteria], // OK
                  percentageRequired: item?.percentage, // OK
                  percentageObtainer: 0, // TODO: Pending
                  approved: (Math.round(Math.random()) === 0) ? false : true, // TODO: Pending
                }

                // TODO: Pendiente función que obtenga los datos de moodle y valide si se cumple o no el criterio
                const factory = new CertificateMultipleCriteriaFactory(CertificateSettingCriteria[criteria])
                factory.instance.evaluateCriteria()

                module.moduleCriteriaResume.push(moduleCriteria)
              }
            })
            certification.modules.push(module)
          }

          certification.modules.forEach((module) => {
            module.approved = module?.moduleCriteriaResume.every((c) => c.approved === true)
          })

          certification.approved = certification?.modules.every((c) => c.approved === true)

          student.certifications.push(certification)
        }

        if (student.certifications.length > 0) {
          students.push(student)
        }
      }

      const response: ICertificateMultipleDataResponse = {
        courseSchedulingId: course_scheduling,
      }

      if (studentId) {
        response.student = students[0] || undefined
      } else {
        response.students = students
      }

      return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
        ...response
      }})
    } catch (err) {
      console.log('CertificateMultipleService::certificateData', err)
      return responseUtility.buildResponseFailed('json', null)
    }
  }

  public generateCertificate = async (params: ICertificateMultipleGenerate) => {
    try {
      const status = 'New'
      const { user, courseSchedulingId, students } = params

      const responseValidate: any = await this.validateAccessToCertificateMultiple(courseSchedulingId)
      if (responseValidate.status === 'error') return responseValidate;

      const courseScheduling = responseValidate.courseScheduling

      // @INFO: Consultanto usuarios a generar certificado
      const studentsIds = students?.map((item) => item.userId) || [];
      if (studentsIds.length === 0) return responseUtility.buildResponseFailed('json', null, {error_key: 'certificate_multiple.generate.users_required'})

      const enrollments = await Enrollment.find({
        user: {$in: studentsIds},
        course_scheduling: courseScheduling._id,
      }).select('user enrollmentCode')

      const enrollmentsGroupByUserId = enrollments.reduce((accum, element) => {
        if (!accum[element?.user]) {
          accum[element?.user] = element
        }
        return accum;
      }, {})

      // @INFO: Consultando configuración de certificados a generar
      const certificateSettingsIds = [].concat(...students?.map((item) => item.certificateSettings || [])) || []
      if (certificateSettingsIds.length === 0) return responseUtility.buildResponseFailed('json', null, {error_key: 'certificate_multiple.generate.certificate_setting_required'})

      const certificateSettings = await CertificateSettings.find({
        _id: {$in: certificateSettingsIds},
        courseScheduling: courseScheduling._id,
      }).select('certificateName certificationType')

      const certificateSettingsGroupById = certificateSettings.reduce((accum, element) => {
        if (!accum[element?._id]) {
          accum[element?._id] = element
        }
        return accum;
      }, {})

      // @INFO: Consultando certificados ya generados
      const certificates = await CertificateQueue.find({
        courseId: courseScheduling._id,
        status: { $in: ['New', 'In-process', 'Complete'] }
      })
      const certificatesByStudent = certificates?.reduce((accum, certificate) => {
        if (certificate?.userId && certificate?.certificateSetting) {
          if (!accum[certificate?.userId.toString()]) {
            accum[certificate?.userId.toString()] = {}
          }
          accum[certificate?.userId.toString()][certificate?.certificateSetting?.toString()] = certificate;
        }
        return accum
      }, {})

      const itemsToCreate = []
      students?.forEach((element) => {
        element?.certificateSettings?.forEach((certificate) => {
          if (
            enrollmentsGroupByUserId[element?.userId] &&
            certificateSettingsGroupById[certificate]
          ) {
            const studentCertificates = certificatesByStudent[element?.userId.toString()] || {}
            const hasCertificate = studentCertificates[certificate.toString()] ? true : false
            if (!hasCertificate) {
              const item: ICertificateQueueMultiple = {
                userId: element?.userId,
                courseId: courseScheduling?._id,
                certificateSetting: certificate,
                auxiliar: user,
                certificateType: certificateSettingsGroupById[certificate]?.certificationType,
                certificateConsecutive: enrollmentsGroupByUserId[element?.userId]?.enrollmentCode,
                status
              }
              itemsToCreate.push(item)
            }
          }
        })
      })
      if (itemsToCreate.length === 0) return responseUtility.buildResponseFailed('json', null, {error_key: 'certificate_multiple.generate.nothing'})

      await CertificateQueue.insertMany(itemsToCreate)

      return responseUtility.buildResponseSuccess('json')
    } catch (err) {
      console.log('CertificateMultipleService::generateCertificate', err)
      return responseUtility.buildResponseFailed('json', null)
    }
  }

  private validateAccessToCertificateMultiple = async (courseSchedulingId: string) => {
    try {
      const courseScheduling = await CourseScheduling.findOne({
        _id: courseSchedulingId
      })
      .populate({path: 'schedulingMode', select: 'id name'})
      .populate({path: 'schedulingStatus', select: 'id name'})
      .select('id')

      if (!courseScheduling) return responseUtility.buildResponseFailed('json', null, {
        error_key: 'course_scheduling.not_found'
      })

      // @INFO: Restringir consulta de certificados solo cuando se encuentra en estados permitidos
      if (['Programado', 'Cancelado'].includes(courseScheduling?.schedulingStatus?.name)) {
        return responseUtility.buildResponseFailed('json', null,
          { error_key: { key: 'certificate.requirements.program_status', params: { error: courseScheduling?.schedulingStatus?.name } } });
      }
      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          courseScheduling
        }
      })
    } catch (err) {
      return responseUtility.buildResponseFailed('json')
    }
  }
}

export const certificateMultipleService = new CertificateMultipleService();
export { CertificateMultipleService as DefaultAdminCertificateCertificateMultipleService };
