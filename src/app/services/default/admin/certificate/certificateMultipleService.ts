// @import_dependencies_node Import libraries
import moment from 'moment'
import path from "path";
import { program_type_abbr, certificate_template, public_dir, attached } from '@scnode_core/config/globals';
// @end

// @import services
import { CertificateMultipleCriteriaFactory } from './certificateCriteria/certificateMultipleCriteriaFactory';
import { certificateService } from '@scnode_app/services/default/huellaDeConfianza/certificate/certificateService';
// @end

// @import utilities
import { generalUtility } from '@scnode_core/utilities/generalUtility';
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import { CertificateQueue, CertificateSettings, CourseScheduling, Enrollment, User } from '@scnode_app/models';
// @end

// @import types
import { ICertificateMultipleBuildData, ICertificateMultipleCreate, ICertificateMultipleData, ICertificateMultipleDataCertification, ICertificateMultipleDataCertificationModule, ICertificateMultipleDataCertificationModuleCriteriaResume, ICertificateMultipleDataResponse, ICertificateMultipleDataStudent, ICertificateMultipleGenerate, ICertificateQueueMultiple } from '@scnode_app/types/default/admin/certificate/certificateMultipleTypes';
import { CertificateSettingCriteria, CertificateSettingType, CertificateSettingTypeTranslate } from '@scnode_app/types/default/admin/course/certificateSettingsTypes';
import { ICertificate, ILogoInformation, ISetCertificateParams, ISignatureInformation } from '@scnode_app/types/default/admin/certificate/certificateTypes';
// @end

class CertificateMultipleService {

  private left_parentheses = '&#40;';
  private right_parentheses = '&#41;';

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

  public createCertificate = async (params: ICertificateMultipleCreate) => {
    try {
      const buildDataResponse: any = await this.buildCertificateData(params)
      if (buildDataResponse.status === 'error') return buildDataResponse;

      const respProcessCertificate = await certificateService.requestSetCertificate(buildDataResponse.certificatesData);

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          respProcessCertificate
        }
      })
    } catch (err) {
      console.log('CertificateMultipleService::createCertificate', err)
      return responseUtility.buildResponseFailed('json')
    }
  }

  private buildCertificateData = async (params: ICertificateMultipleBuildData) => {
    try {
      const {courseId, userId, certificateSettingId, certificateHash, certificateConsecutive}  = params;
      const certificateParamsArray: ISetCertificateParams[] = [];  // return this Array

      const currentDate = new Date(Date.now());
      const logoDataArray: ILogoInformation[] = [];
      const signatureDataArray: ISignatureInformation[] = [];

      let location3 = null;
      let location8 = null;

      // @INFO: Buscando estudiante a generar certificado
      const student: any = await User.findOne({
        _id: userId
      })
      if (!student) return responseUtility.buildResponseFailed('json')

      // @INFO: Buscando configuración del certificado
      const certificateSetting = await CertificateSettings.findOne({
        _id: certificateSettingId,
      })
      .populate({path: 'modules.courseSchedulingDetail', select: 'course', populate: [
        {path: 'course', select: 'name'}
      ]})
      if (!certificateSetting) return responseUtility.buildResponseFailed('json', null, {error_key: 'certificate_multiple.certificate_setting_required'})

      // @INFO: Consultando servicio
      const courseScheduling = await CourseScheduling.findOne({
        _id: courseId
      })
      .populate({path: 'program', select: 'code'})
      .populate({path: 'country', select: 'name'})
      .populate({path: 'city', select: 'name'})
      if (!courseScheduling) return responseUtility.buildResponseFailed('json', null, {error_key: 'course_scheduling.not_found'})

      const driver = attached['driver'];
      const attached_config = attached[driver];
      const upload_config_base_path = (attached_config.base_path) ? attached_config.base_path : 'uploads'

      let base_path = path.resolve(`./${public_dir}/${upload_config_base_path}`)
      if (attached_config.base_path_type === "absolute") {
        base_path = upload_config_base_path
      }

      const logoImage64_1 = certificateService.encodeAdditionaImageForCertificate(base_path, courseScheduling?.path_certificate_icon_1);
      if (logoImage64_1) {
        logoDataArray.push({
          imageBase64: logoImage64_1
        });
      }

      const logoImage64_2 = certificateService.encodeAdditionaImageForCertificate(base_path, courseScheduling.path_certificate_icon_2);
      if (logoImage64_2) {
        logoDataArray.push({
          imageBase64: logoImage64_2
        });
      }

      const signatureImage64_1 = certificateService.encodeAdditionaImageForCertificate(base_path, courseScheduling.path_signature_1);
      if (signatureImage64_1) {
        signatureDataArray.push({
          imageBase64: signatureImage64_1,
          signatoryName: courseScheduling?.signature_1_name || undefined,
          signatoryPosition: courseScheduling?.signature_1_position || undefined,
          signatoryCompanyName: courseScheduling?.signature_1_company || undefined
        });
      }

      const signatureImage64_2 = certificateService.encodeAdditionaImageForCertificate(base_path, courseScheduling.path_signature_2);
      if (signatureImage64_2) {
        signatureDataArray.push({
          imageBase64: signatureImage64_2,
          signatoryName: courseScheduling?.signature_2_name || undefined,
          signatoryPosition: courseScheduling?.signature_2_position || undefined,
          signatoryCompanyName: courseScheduling?.signature_2_company || undefined
        });
      }

      // if (respCourse.scheduling.schedulingStatus.name == 'Programado' || respCourse.scheduling.schedulingStatus.name == 'Cancelado') {
      //   return responseUtility.buildResponseFailed('json', null,
      //     { error_key: { key: 'certificate.requirements.program_status', params: { error: respCourse.scheduling.schedulingStatus.name } } });
      // }

      let programTypeName;
      const programType = certificateService.getProgramTypeFromCode(courseScheduling?.program?.code);
      if (!programType) return responseUtility.buildResponseFailed('json', null, {error_key: {
        key: 'certificate_multiple.generate.program_invalid',
        params: {code: courseScheduling?.program?.code || '-'}
      }})

      let mapping_dato_13 = ''; // "Certifica" or "Certifican" text (singular/plural)
      let mapping_template = '';
      const mapping_dato_1 = this.getCertificateTypeTranslate(certificateSetting?.certificationType);
      const mapping_intensidad = certificateSetting?.duration || 0;
      const mapping_titulo_certificado = certificateSetting?.certificateName || '-';
      const mapping_pais = courseScheduling?.country?.name || '-';
      const mapping_ciudad = courseScheduling?.city?.name || '';
      const mapping_numero_certificado = (certificateHash) ?
        certificateConsecutive :
        `${courseScheduling?.metadata.service_id}-${certificateConsecutive.padStart(4, '0')}-${certificateSetting._id}` // TODO: Revisar como diferenciar entre certificateSetting

      if (programType?.abbr) {
        if (programType.abbr === program_type_abbr.curso || programType.abbr === program_type_abbr.curso_auditor) {
          programTypeName = 'curso';
          mapping_template = certificate_template.curso;
        }
        if (programType.abbr === program_type_abbr.programa || programType.abbr === program_type_abbr.programa_auditor) {
          programTypeName = 'programa';
          mapping_template = certificate_template.programa_diplomado;
        }
        if (programType.abbr === program_type_abbr.diplomado || programType.abbr === program_type_abbr.diplomado_auditor) {
          programTypeName = 'diplomado';
          mapping_template = certificate_template.programa_diplomado;
        }
      }

      if (logoDataArray.length !== 0) {
        mapping_template = certificate_template.convenios;
        mapping_dato_13 = "Certifican que"
      } else {
        mapping_dato_13 = "Certifica que"
      }

      const approvedModules = certificateSetting?.modules?.map((module) => {
        return {name: module?.courseSchedulingDetail?.course?.name || '-', duration: module.duration || 0}
      })

      const mappingAcademicList = certificateService.formatAcademicModulesList(approvedModules, programTypeName);
      const mapping_listado_cursos = mappingAcademicList.mappingModules;

      if (logoDataArray.length !== 0) {
        if (logoDataArray.length == 1) {
          location8 = (logoDataArray[0]) ? logoDataArray[0].imageBase64 : null;
        } else {
          location3 = (logoDataArray[0]) ? logoDataArray[0].imageBase64 : null;
          location8 = (logoDataArray[1]) ? logoDataArray[1].imageBase64 : null;
        }
      }

      const studentFullName = `${student?.profile?.first_name} ${student?.profile?.last_name}`
      const certificateParams: ICertificate = {
        modulo: mapping_template,
        numero_certificado: mapping_numero_certificado, // TODO: Revisar
        correo: student?.email,
        documento: `${student?.profile.doc_type} ${student?.profile?.doc_number}`,
        nombre: studentFullName.toUpperCase(),
        asistio: null,
        certificado: mapping_titulo_certificado.toUpperCase().replace(/\(/g, this.left_parentheses).replace(/\)/g, this.right_parentheses),
        certificado_ingles: '',
        alcance: '',
        alcance_ingles: '',
        intensidad: generalUtility.getDurationFormatedForCertificate(mapping_intensidad),
        listado_cursos: mapping_listado_cursos,
        regional: '',
        ciudad: mapping_ciudad,
        pais: mapping_pais,
        fecha_certificado: currentDate,
        fecha_aprobacion: courseScheduling.endDate,
        fecha_ultima_modificacion: null,
        fecha_renovacion: null,
        fecha_vencimiento: null,
        fecha_impresion: currentDate,
        dato_1: mapping_dato_1, // TODO: Revisar
        dato_2: moment(courseScheduling.endDate).locale('es').format('LL'),
        // primer logo
        dato_3: location3,
        // primera firma
        dato_4: (signatureDataArray.length != 0 && signatureDataArray[0]) ? signatureDataArray[0].imageBase64 : null,
        dato_5: (signatureDataArray.length != 0 && signatureDataArray[0]) ? signatureDataArray[0].signatoryName : null,
        dato_6: (signatureDataArray.length != 0 && signatureDataArray[0]) ? signatureDataArray[0].signatoryPosition : null,
        dato_7: (signatureDataArray.length != 0 && signatureDataArray[0]) ? signatureDataArray[0].signatoryCompanyName : null,

        // segundo logo
        dato_8: location8,
        // segunda firma
        dato_9: (signatureDataArray.length != 0 && signatureDataArray[1]) ? signatureDataArray[1].imageBase64 : null,
        dato_10: (signatureDataArray.length != 0 && signatureDataArray[1]) ? signatureDataArray[1].signatoryName : null,
        dato_11: (signatureDataArray.length != 0 && signatureDataArray[1]) ? signatureDataArray[1].signatoryPosition : null,
        dato_12: (signatureDataArray.length != 0 && signatureDataArray[1]) ? signatureDataArray[1].signatoryCompanyName : null,

        dato_13: mapping_dato_13
      }
      certificateParamsArray.push({
        queueData: params,
        template: mapping_template,
        certificateType: certificateSetting?.certificationType,
        paramsHuella: certificateParams,
        programName: mapping_titulo_certificado,
        isComplete: true
      });

      return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
        certificatesData: certificateParamsArray
      }})
    } catch (err) {
      console.log('CertificateMultipleService::createCertificate', err)
      return responseUtility.buildResponseFailed('json')
    }
  }

  private getCertificateTypeTranslate = (certificateType: CertificateSettingType) => {
    switch (certificateType) {
      case CertificateSettingType.ATTENDANCE:
        return CertificateSettingTypeTranslate.ATTENDANCE
      case CertificateSettingType.ATTENDANCE_APPROVAL:
        return CertificateSettingTypeTranslate.ATTENDANCE_APPROVAL
      default:
        return ''
    }
  }
}

export const certificateMultipleService = new CertificateMultipleService();
export { CertificateMultipleService as DefaultAdminCertificateCertificateMultipleService };
