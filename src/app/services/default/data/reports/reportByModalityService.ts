// @import_dependencies_node Import libraries
import * as XLSX from "xlsx";
const ObjectID = require('mongodb').ObjectID
import moment from "moment";
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { generalUtility } from "@scnode_core/utilities/generalUtility";
import { xlsxUtility } from "@scnode_core/utilities/xlsx/xlsxUtility";
// @end

// @import models
import { User, CourseSchedulingMode, CourseSchedulingStatus, CourseScheduling, CourseSchedulingDetails, Enrollment, CertificateQueue, Program } from '@scnode_app/models';
// @end

// @import types
import { IFactoryGenerateReport } from '@scnode_app/types/default/data/reports/reportsFactoryTypes';
// @end

export interface IReportByModalityStructure {
  title: string,
  pages: IReportByModalityPerPage[]
}

export interface IReportByModalityPerPage {
  title: string;
  queryRange?: {
    reportStartDate: string | undefined,
    reportEndDate: string | undefined,
  };
  reportDate: string;
  personWhoGeneratesReport: string;
  data: IReportPage
}

export interface IReportPage {
  _id: string;
  programName: string;
  modular: string;
  programCode: string;
  serviceId: string;
  modalityName: string;
  regional: string;
  city: string;
  companyName: string;
  accountExecutive: string;
  courses: IReportCourse[];
  totalDuration: number;
  totalDurationFormated: string;
  totalCourses: number;
  participants: IReportParticipant[];
  isVirtual: boolean;
  isAuditor: boolean;
}

export interface IReportCourse {
  _id: string;
  courseName: string;
  teacher: string;
  startDate: string;
  endDate: string;
  courseCode: string;
  duration: string;
}

export interface IReportParticipant {
  index: number;
  docNumber: string;
  student: string;
  regional: string;
  city: string;
  accountExecutive: string;
  attendance: {
    attendanceByCourse: Record<string, {value: number;}>,
    totalHoursAttended: number,
    totalAttendancePercentage: number
  },
  progress: {
    progressByCourse: Record<string, {value: number;}>,
    percentageOfProgressInTheProgram: number;
    forumNote: number;
    taskNote: number;
    evaluationNote: number;
    finalNote: number;
  },
  certification: {
    totalAssistanceCertification: string;
    partialCertification: string;
    virtualCertification: string;
    virtualApprovedExamAuditor: string;
    virtualCertificationType: string;
    certificateReleaseDate: string;
    personWhoReleasesCertificate: string;
    auditorCertificationType: string;
  },
  auditor: {
    examNote: number;
    examApproval: string;
  }
}

class ReportByModalityService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  public generateReport = async (params: IFactoryGenerateReport) => {
    try {
      const userLogged: any = await User.findOne({ _id: params.user }).select('id profile.first_name profile.last_name')

      if (!params.modality) return responseUtility.buildResponseFailed('json', null, {error_key: 'reports.factory.report_modality_required'})
      // @INFO: Consultando encuestas programadas
      const courseSchedulingMode = await CourseSchedulingMode.findOne({_id: params.modality, moodle_id: {$exists: true}}).select('id name')
      if (!courseSchedulingMode) return responseUtility.buildResponseFailed('json')

      const courseSchedulingStatus = await CourseSchedulingStatus.find().select('id name')
      if (!courseSchedulingStatus) return responseUtility.buildResponseFailed('json')

      const courseSchedulingStatusInfo = courseSchedulingStatus.reduce((accum, element) => {
        if (!accum[element.name]) {
          accum[element.name] = element;
        }
        return accum
      }, {})

      let where: any = {
        schedulingMode: courseSchedulingMode._id,
        schedulingStatus: {$in: [
          courseSchedulingStatusInfo['Confirmado']._id,
          courseSchedulingStatusInfo['Ejecutado']._id,
          courseSchedulingStatusInfo['Cancelado']._id,
        ]}
      }

      if (params.auditor === true || params.auditor === false) {
        const programs = await Program.find({isAuditor: params.auditor}).select('id').lean()
        const programIds = programs.reduce((accum, element) => {
          accum.push(element._id)
          return accum
        }, [])
        where['program'] = {$in: programIds}
      }

      if (params?.reportStartDate && params?.reportEndDate) {
        where['startDate'] = {$gte: new Date(`${params.reportStartDate}T00:00:00Z`), $lte: new Date(`${params.reportEndDate}T23:59:59Z`)}
      }

      const courseSchedulings = await CourseScheduling.find(where)
      .select('id metadata schedulingMode modular program client city schedulingType regional account_executive startDate endDate duration')
      .populate({path: 'schedulingMode', select: 'id name'})
      .populate({path: 'modular', select: 'id name'})
      .populate({path: 'program', select: 'id name code isAuditor'})
      .populate({path: 'client', select: 'id name'})
      .populate({path: 'city', select: 'id name'})
      .populate({path: 'schedulingType', select: 'id name'})
      .populate({path: 'regional', select: 'id name'})
      .populate({path: 'account_executive', select: 'id profile.first_name profile.last_name'})
      .lean()

      const courseSchedulingIds = courseSchedulings.reduce((accum, element) => {
        accum.push(element._id.toString())
        return accum
      }, [])

      let courseSchedulingDetails = undefined;

      if (courseSchedulingIds.length > 0) {
        const details = await CourseSchedulingDetails.find({
          course_scheduling: {$in: courseSchedulingIds}
        })
        .select('id course_scheduling teacher course startDate endDate duration sessions')
        .populate({path: 'teacher', select: 'id profile.first_name profile.last_name'})
        .populate({path: 'course', select: 'id name code'})
        .lean();

        courseSchedulingDetails = {};
        courseSchedulingDetails = details.reduce((accum, element) => {
          if (element?.course_scheduling) {
            if (!accum[element.course_scheduling.toString()]) {
              accum[element.course_scheduling.toString()] = []
            }
            accum[element.course_scheduling.toString()].push(element)
          }
          return accum
        }, {})
      }

      let participantsByProgram = {}
      let certificationsByProgram = {}

      if (courseSchedulingIds.length > 0) {
        const enrolledByProgramQuery = await Enrollment.find({
          course_scheduling: {
            $in: courseSchedulingIds.reduce((accum, element) => {
              accum.push(ObjectID(element))
              return accum
            },[])
          }
        })
        .select('id user course_scheduling')
        .populate({path: 'user', select: 'id profile.first_name profile.last_name profile.doc_number'})

        if (enrolledByProgramQuery.length > 0) {
          participantsByProgram = enrolledByProgramQuery.reduce((accum, element) => {
            if (element.course_scheduling) {
              if (!accum[element.course_scheduling.toString()]) {
                accum[element.course_scheduling.toString()] = [];
              }
              accum[element.course_scheduling.toString()].push(element)
            }
            return accum
          }, {})
        }

        const certificationsByProgramQuery = await CertificateQueue.find({
          courseId: {
            $in: courseSchedulingIds.reduce((accum, element) => {
              accum.push(ObjectID(element))
              return accum
            },[])
          },
          status: 'Complete'
        })
        .select('id courseId userId auxiliar status certificateType certificate.date')
        .populate({path: 'auxiliar', select: 'id profile.first_name profile.last_name profile.doc_number'})

        if (certificationsByProgramQuery.length > 0) {
          certificationsByProgram = certificationsByProgramQuery.reduce((accum, element) => {
            if (element.courseId && element.userId && element.certificateType) {
              if (!accum[element.courseId.toString()]) {
                accum[element.courseId.toString()] = {};
              }

              if (!accum[element.courseId.toString()][element.userId.toString()]) {
                accum[element.courseId.toString()][element.userId.toString()] = {};
              }

              if (!accum[element.courseId.toString()][element.userId.toString()][element.certificateType.toString()]) {
                accum[element.courseId.toString()][element.userId.toString()][element.certificateType.toString()] = element;
              }
              // accum[element.courseId.toString()].push(element)
            }
            return accum
          }, {})
        }

      }

      // TODO: Consultar información desde coleccion consolidada

      const time = new Date().getTime()
      // @INFO: Se define el formato del reporte, xlsx por defecto
      const output_format: any = params.output_format ? params.output_format : 'xlsx'
      const title: any = params.title ? `${params.title}_${time}` : `reporte_por_modalidad_${time}`

      const report: IReportByModalityStructure = {
        title,
        pages: []
      }

      for (const courseScheduling of courseSchedulings) {
        const reportDataPerPage: IReportByModalityPerPage = {
          title: `${courseScheduling?.metadata?.service_id}_${courseScheduling?.program?.code}`,
          queryRange: {
            reportStartDate: params.reportStartDate,
            reportEndDate: params.reportEndDate
          },
          reportDate: moment().format('DD/MM/YYYY'),
          personWhoGeneratesReport: (userLogged?.profile) ? `${userLogged?.profile.first_name} ${userLogged?.profile.last_name}` : '-',
          data: undefined
        }

        const itemBase: IReportPage = {
          _id: courseScheduling._id,
          programName: courseScheduling?.program?.name || '-',
          modular: courseScheduling?.modular?.name || '-',
          programCode: courseScheduling?.program?.code || '-',
          serviceId: courseScheduling?.metadata?.service_id || '-',
          modalityName: courseScheduling?.schedulingMode?.name || '-',
          regional: courseScheduling?.regional?.name || '-',
          city: courseScheduling?.city?.name || '-',
          companyName: courseScheduling?.client?.name || '-',
          accountExecutive: (courseScheduling?.account_executive?.profile) ? `${courseScheduling?.account_executive?.profile.first_name} ${courseScheduling?.account_executive?.profile.last_name}` : '-',
          courses: [],
          totalDuration: 0,
          totalDurationFormated: '0h',
          totalCourses: 0,
          participants: [],
          isVirtual: courseScheduling?.schedulingMode?.name === 'Virtual' ? true : false,
          isAuditor: courseScheduling?.program?.isAuditor || false,
        }

        if (courseSchedulingDetails && courseSchedulingDetails[courseScheduling._id.toString()]) {
          const courses = courseSchedulingDetails[courseScheduling._id.toString()]
          for (const course of courses) {
            let duration_scheduling = parseInt(course.duration)
            if (course.sessions && course.sessions.length > 0) {
              duration_scheduling = 0;
              course.sessions.map((session) => {
                duration_scheduling += parseInt(session.duration)
              })
            }

            let courseItemBase: IReportCourse = {
              _id: course?._id,
              courseName: course?.course?.name || '-',
              teacher: (course?.teacher?.profile) ? `${course?.teacher.profile?.first_name} ${course?.teacher.profile?.last_name}` : '-',
              startDate: course?.startDate ? moment(course.startDate).format('DD/MM/YYYY') : '-',
              endDate: course?.endDate ? moment(course.endDate).format('DD/MM/YYYY') : '-',
              courseCode: course?.course?.code || '-',
              duration: (duration_scheduling) ? generalUtility.getDurationFormated(duration_scheduling) : '0h',
            }

            itemBase.totalDuration += duration_scheduling || 0
            itemBase.courses.push(courseItemBase)
          }
        }

        if (itemBase.totalDuration) {
          itemBase.totalDurationFormated = (itemBase.totalDuration) ? generalUtility.getDurationFormated(itemBase.totalDuration) : '0h'
        }
        itemBase.totalCourses = itemBase.courses.length

        if (participantsByProgram[courseScheduling?._id.toString()]) {
          const participants = participantsByProgram[courseScheduling._id.toString()]
          let index = 1;
          for (const participant of participants) {
            let participantItemBase: IReportParticipant = {
              index,
              docNumber: participant?.user?.profile?.doc_number || '-',
              student: (participant?.user?.profile) ? `${participant?.user.profile?.first_name} ${participant?.user.profile?.last_name}` : '-',
              regional: courseScheduling?.regional?.name || '-',
              accountExecutive: (courseScheduling?.account_executive?.profile) ? `${courseScheduling?.account_executive?.profile.first_name} ${courseScheduling?.account_executive?.profile.last_name}` : '-',
              city: courseScheduling?.city?.name || '-',
              attendance: {
                attendanceByCourse: {},
                totalHoursAttended: 0,
                totalAttendancePercentage: 0
              },
              progress: {
                progressByCourse: {},
                percentageOfProgressInTheProgram: 0,
                forumNote: 0,
                taskNote: 0,
                evaluationNote: 0,
                finalNote: 0
              },
              certification: {
                totalAssistanceCertification: '-',
                partialCertification: '-',
                virtualCertification: '-',
                virtualApprovedExamAuditor: '-',
                virtualCertificationType: '-',
                certificateReleaseDate: '-',
                personWhoReleasesCertificate: '-',
                auditorCertificationType: '-',
              },
              auditor: {
                examNote: 0,
                examApproval: '-',
              }
            }
            if (itemBase.isAuditor) {
              participantItemBase.auditor.examNote = Math.floor((Math.random() * (100-1)) +1); // TODO: Extraer valor que debe salir del consolidado
              participantItemBase.auditor.examApproval = participantItemBase.auditor.examNote >= 70 ? 'Si' : 'No'  // TODO: Ya se esta validando en local, verificar si se va a extraer el valor que debe salir del consolidado

              participantItemBase.certification.auditorCertificationType = 'No se certifica' // TODO: Extraer valor que debe salir del consolidado
            }

            if (!itemBase.isVirtual) {
              if (courseSchedulingDetails && courseSchedulingDetails[courseScheduling._id.toString()]) {
                const courses = courseSchedulingDetails[courseScheduling._id.toString()]
                let totalHoursAttended = 0;
                let totalAssistanceCertification = []
                for (const course of courses) {
                  if (!participantItemBase.attendance.attendanceByCourse[course?._id.toString()]) {
                    const attendanceParticipantInCourse = Math.floor((Math.random() * (100-1)) +1) // TODO: Extraer valor que debe salir del consolidado
                    participantItemBase.attendance.attendanceByCourse[course?._id.toString()] = {
                      value: attendanceParticipantInCourse
                    }
                    totalHoursAttended += attendanceParticipantInCourse;
                    if (attendanceParticipantInCourse >= 75) {
                      totalAssistanceCertification.push(true)
                    } else {
                      totalAssistanceCertification.push(false)
                    }
                  }
                }
                const maximumTotalOfCourses = 100 * courses.length;
                const totalProgramDurationInHours = Math.trunc(itemBase.totalDuration / 3600)
                participantItemBase.attendance.totalHoursAttended = Math.round(((((totalHoursAttended) * 100)/(maximumTotalOfCourses))*(totalProgramDurationInHours))/100)
                participantItemBase.attendance.totalAttendancePercentage = Math.round((((totalHoursAttended) * 100)/(maximumTotalOfCourses)))

                if (totalAssistanceCertification.length > 0) {
                  const anyFalse = totalAssistanceCertification.filter((i) => i === false)
                  participantItemBase.certification.totalAssistanceCertification = anyFalse ? 'NO' : 'SI' // TODO: Ya se esta validando en local, verificar si se va a extraer el valor que debe salir del consolidado
                  participantItemBase.certification.partialCertification =  participantItemBase.certification.totalAssistanceCertification === 'SI' ? 'NO' : 'SI' // TODO: Ya se esta validando en local, verificar si se va a extraer el valor que debe salir del consolidado
                }
              }
            } else {
              if (courseSchedulingDetails && courseSchedulingDetails[courseScheduling._id.toString()]) {
                const courses = courseSchedulingDetails[courseScheduling._id.toString()]
                let totalProgress = 0;
                for (const course of courses) {
                  if (!participantItemBase.progress.progressByCourse[course?._id.toString()]) {
                    const progressParticipantInCourse = Math.floor((Math.random() * (100-1)) +1) // TODO: Extraer valor que debe salir del consolidado
                    participantItemBase.progress.progressByCourse[course?._id.toString()] = {
                      value: progressParticipantInCourse
                    }
                    totalProgress += progressParticipantInCourse;
                  }
                }
                if (courses.length > 0) {
                  participantItemBase.progress.percentageOfProgressInTheProgram = Math.round(totalProgress / courses.length)
                }

                participantItemBase.progress.forumNote = Math.floor((Math.random() * (100-1)) +1) // TODO: Extraer valor que debe salir del consolidado
                participantItemBase.progress.taskNote = Math.floor((Math.random() * (100-1)) +1) // TODO: Extraer valor que debe salir del consolidado
                participantItemBase.progress.evaluationNote = Math.floor((Math.random() * (100-1)) +1) // TODO: Extraer valor que debe salir del consolidado
                participantItemBase.progress.finalNote = Math.floor((Math.random() * (100-1)) +1) // TODO: Extraer valor que debe salir del consolidado


                const certificationStatus = []
                if (participantItemBase.progress.percentageOfProgressInTheProgram === 100) {
                  certificationStatus.push(true)
                } else {
                  certificationStatus.push(false)
                }

                if (participantItemBase.progress.evaluationNote >= 70) {
                  certificationStatus.push(true)
                } else {
                  certificationStatus.push(false)
                }

                if (itemBase.isAuditor) {
                  if (participantItemBase.auditor.examNote >= 70) {
                    certificationStatus.push(true)
                  } else {
                    certificationStatus.push(false)
                  }
                }

                let virtualCertification = 'NO'
                if (certificationStatus.length > 0) {
                  const anyFalse = certificationStatus.filter((i) => i === false)
                  if (!anyFalse) {
                    virtualCertification = 'SI'
                  }
                }

                participantItemBase.certification.virtualCertification = virtualCertification
                participantItemBase.certification.virtualApprovedExamAuditor = itemBase.isAuditor && participantItemBase.auditor.examNote > 70 ? 'SI' : 'NO'
                participantItemBase.certification.virtualCertificationType = `${virtualCertification} SE CERTIFICA`
              }
            }

            if (
              certificationsByProgram &&
              certificationsByProgram[courseScheduling._id.toString()] &&
              certificationsByProgram[courseScheduling._id.toString()][participant?.user._id.toString()]
            ) {
              if (certificationsByProgram[courseScheduling._id.toString()][participant?.user._id.toString()]['academic']) {
                const certification = certificationsByProgram[courseScheduling._id.toString()][participant?.user._id.toString()]['academic'];
                participantItemBase.certification.certificateReleaseDate = moment(certification?.certificate?.date).format('YYYY-MM-DD')
                participantItemBase.certification.personWhoReleasesCertificate = (certification?.auxiliar?.profile) ? `${certification?.auxiliar.profile?.first_name} ${certification?.auxiliar.profile?.last_name}` : '-'
              }
            }
            itemBase.participants.push(participantItemBase)
            index++;
          }
        }

        reportDataPerPage.data = itemBase;
        report.pages.push(reportDataPerPage)
      }

      if (output_format === 'json') {
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          report
        }})
      } else if (output_format === 'xlsx') {
        const wb = await this.buildXLSX(report);
        if (!wb) return responseUtility.buildResponseFailed('json', null, { error_key: 'reports.customReport.fail_build_xlsx' })

        // @INFO Se carga el archivo al servidor
        const send = await xlsxUtility.uploadXLSX({ from: 'file', attached: { file: { name: `${title}.xlsx` } } }, {workbook: wb})
        if (!send) return responseUtility.buildResponseFailed('json', null, { error_key: 'reports.customReport.fail_upload_xlsx' })

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            path: send,
          }
        })
      }

      return responseUtility.buildResponseSuccess('json')
    } catch (err) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  private buildXLSX = (report: IReportByModalityStructure) => {
    try {
      // @INFO: Inicializamos el nuevo libro de excel
      const wb: XLSX.WorkBook = XLSX.utils.book_new();

      for (const reportData of report.pages) {
        const wsSheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([])

        let row = 0;
        const merge = []
        const sheetData = []

        // @INFO: Encabezado inicial
        sheetData.push([`INFORMES DE OPERACIÓN - ${reportData?.data?.isAuditor ? 'FORMACIÓN DE AUDITORES' : 'NO AUDITORES'}`])
        sheetData.push([])
        let itemMerge = {}
        itemMerge['s'] = {r: row, c: 0}
        itemMerge['e'] = {r: row, c: 11}

        merge.push(itemMerge)
        row++;
        row++;

        if (reportData?.queryRange?.reportStartDate && reportData?.queryRange?.reportEndDate) {
          sheetData.push(['PERIODO DE CONSULTA', ''])
          sheetData.push(['Fecha 1', reportData?.queryRange?.reportStartDate])
          sheetData.push(['Fecha 2', reportData?.queryRange?.reportEndDate])
          sheetData.push([])

          let itemMergeFilterDate = {}
          itemMergeFilterDate['s'] = {r: row, c: 0}
          itemMergeFilterDate['e'] = {r: row, c: 1}
          merge.push(itemMergeFilterDate)
          row++;
          row++;
          row++;
          row++;
        }

        // @INFO: Información del servicio
        sheetData.push(['PROGRAMA DE FORMACIÓN', reportData?.data?.programName])
        row++
        sheetData.push(['CODIGO DEL PROGRAMA', reportData?.data?.programCode])
        row++
        sheetData.push(['ID DEL SERVICIO', reportData?.data?.serviceId])
        row++
        sheetData.push(['MODALIDAD', reportData?.data?.modalityName])
        row++
        sheetData.push(['REGIONAL', reportData?.data?.regional])
        row++
        sheetData.push(['CIUDAD', reportData?.data?.city])
        row++
        sheetData.push(['CLIENTE', reportData?.data?.companyName])
        row++
        sheetData.push(['EJECUTIVO DE CUENTA', reportData?.data?.accountExecutive])
        row++
        sheetData.push(['NOMBRE PERSONA QUE CONSULTA', reportData?.personWhoGeneratesReport])
        row++;
        sheetData.push(['FECHA DEL REPORTE', reportData?.reportDate])
        row++
        sheetData.push([])
        row++

        // @INFO: Información de los cursos del programa
        if (reportData?.data?.courses) {
          const headerCourseStructure = [
            {key: 'courseName', label: 'CURSOS DE FORMACIÓN'},
            {key: 'startDate', label: 'FECHA INICIAL'},
            {key: 'endDate', label: 'FECHA FINAL'},
            {key: 'courseCode', label: 'CÓDIGO'},
            {key: 'duration', label: 'DURACIÓN / HORAS'}
          ]
          for (const header of headerCourseStructure) {
            const headerCourses = [header.label]
            for (const course of reportData?.data?.courses) {
              headerCourses.push(course[header.key])
            }
            sheetData.push(headerCourses)
            row++;
          }
          sheetData.push(['DURACIÓN TOTAL PROGRAMA', reportData?.data?.totalDurationFormated])
          let itemMerge = {}
          itemMerge['s'] = {r: row, c: 1}
          itemMerge['e'] = {r: row, c: reportData?.data?.courses.length}

          merge.push(itemMerge)
          row++;

          sheetData.push([])
          row++;
        }

        // @INFO: Información de los participantes
        if (reportData?.data?.participants) {
          const preHeaderParticipants = ['','','','','','']
          const headerParticipants = [
            'No',
            'IDENTIFICACIÓN',
            'NOMBRE Y APELLIDOS',
            'REGIONAL',
            'CIUDAD',
            'EJECUTIVO DE CUENTA'
          ]
          let colCount = 0
          let itemMerge = {}
          itemMerge['s'] = {r: row, c: colCount}
          colCount = headerParticipants.length - 1;
          itemMerge['e'] = {r: row, c: colCount}
          colCount++;
          merge.push(itemMerge)

          if (!reportData?.data?.isVirtual) {
            if (reportData?.data?.courses && reportData?.data?.courses.length > 0) {
              preHeaderParticipants.push('PORCENTAJE DE ASISTENCIA POR CURSO')
              let itemMerge = {}
              itemMerge['s'] = {r: row, c: colCount}
              for (const course of reportData?.data?.courses) {
                headerParticipants.push(`% ASISTENCIA - ${course?.courseName}`)
                colCount++;
              }
              for (let index = 0; index < reportData?.data?.courses.length-1; index++) {
                preHeaderParticipants.push("")
              }
              itemMerge['e'] = {r: row, c: (colCount - 1)}
              merge.push(itemMerge)
            }

            preHeaderParticipants.push('RESUMEN DE INFORMACIÓN ASISTENCIA Y NOTAS', '')
            let itemMerge = {}
            itemMerge['s'] = {r: row, c: colCount}
            headerParticipants.push(`HORAS ASISTIDAS TOTAL PROGRAMA`)
            colCount++;
            headerParticipants.push(`PORCENTAJE TOTAL DE ASISTENCIA`)
            colCount++;
            if (reportData?.data?.isAuditor) {
              headerParticipants.push(`NOTA EXAMEN DE AUDITORIA`)
              preHeaderParticipants.push('')
              colCount++;
              headerParticipants.push(`APROBACIÓN EXAMEN DE AUDITORIA`)
              preHeaderParticipants.push('')
              colCount++;
            }
            itemMerge['e'] = {r: row, c: (colCount - 1)}
            merge.push(itemMerge)


            preHeaderParticipants.push(
              `CERTIFICACIÓN AL CURSO/PROGRAMA/DIPLOMADO ${reportData?.data?.isAuditor ? 'Y FORMACIÓN DE AUDITORES' : ''}`,
              ''
            )
            let _itemMerge = {}
            _itemMerge['s'] = {r: row, c: colCount}
            headerParticipants.push(`Certificación total asistencia al Curso/Programa/Diplomado`)
            colCount++;
            headerParticipants.push(`Certificación parcial al Curso/Programa/Diplomado`)
            colCount++;
            if (reportData?.data?.isAuditor) {
              headerParticipants.push(`TIPO DE CERTIFICADO DE FORMACIÓNDE AUDITORES`)
              preHeaderParticipants.push('')
              colCount++;
            }
            _itemMerge['e'] = {r: row, c: (colCount - 1)}
            merge.push(_itemMerge)

            preHeaderParticipants.push(`VALIDACIÓN Y DESCARGA DE CERTIFICADOS`, '')
            let __itemMerge = {}
            __itemMerge['s'] = {r: row, c: colCount}
            headerParticipants.push(`Fecha de liberación de certificados`)
            colCount++;
            headerParticipants.push(`Auxiliar liberador`)
            colCount++;
            __itemMerge['e'] = {r: row, c: (colCount - 1)}
            merge.push(__itemMerge)
          } else {
            if (reportData?.data?.courses && reportData?.data?.courses.length > 0) {
              preHeaderParticipants.push('AVANCE DEL PROGRAMA')
              let itemMerge = {}
              itemMerge['s'] = {r: row, c: colCount}
              for (const course of reportData?.data?.courses) {
                headerParticipants.push(`${course?.courseName}`)
                colCount++;
              }
              for (let index = 0; index < reportData?.data?.courses.length-1; index++) {
                preHeaderParticipants.push("")
              }
              headerParticipants.push(`% DE AVANCE EN EL PROGRAMA`)
              preHeaderParticipants.push('')
              colCount++;
              headerParticipants.push(`NOTA FORO`)
              preHeaderParticipants.push('')
              colCount++;
              headerParticipants.push(`NOTA TAREAS`)
              preHeaderParticipants.push('')
              colCount++;
              headerParticipants.push(`NOTA TOTAL EVALUACIONES MODULO`)
              preHeaderParticipants.push('')
              colCount++;
              if (reportData?.data?.isAuditor) {
                headerParticipants.push(`NOTA EXAMEN AUDITORIA`)
                preHeaderParticipants.push('')
                colCount++;
              }
              headerParticipants.push(`NOTA FINAL`)
              preHeaderParticipants.push('')
              colCount++;

              itemMerge['e'] = {r: row, c: (colCount - 1)}
              merge.push(itemMerge)
            }

            preHeaderParticipants.push('CERTIFICACIÓN AL CURSO/PROGRAMA/DIPLOMADO')
            let itemMerge = {}
            itemMerge['s'] = {r: row, c: colCount}
            headerParticipants.push(`CERTIFICACIÓN AL CURSO/PROGRAMA/DIPLOMADO`)
            colCount++;
            if (reportData?.data?.isAuditor) {
              headerParticipants.push(`APROBACIÓN DE EXAMEN DE AUDITORIA`)
              preHeaderParticipants.push('')
              colCount++;
              headerParticipants.push(`TIPO DE CERTIFICADO DE FORMACIÓN DE AUDITORES`)
              preHeaderParticipants.push('')
              colCount++;
            }
            itemMerge['e'] = {r: row, c: (colCount - 1)}
            merge.push(itemMerge)

            preHeaderParticipants.push(`VALIDACIÓN Y DESCARGA DE CERTIFICADOS`, '')
            let __itemMerge = {}
            __itemMerge['s'] = {r: row, c: colCount}
            headerParticipants.push(`Fecha de liberación de certificados`)
            colCount++;
            headerParticipants.push(`Auxiliar liberador`)
            colCount++;
            __itemMerge['e'] = {r: row, c: (colCount - 1)}
            merge.push(__itemMerge)
          }

          if (preHeaderParticipants.length > 0) {
            sheetData.push(preHeaderParticipants)
          }
          if (headerParticipants.length > 0) {
            sheetData.push(headerParticipants)
          }

          for (const participant of reportData?.data?.participants) {
            const contentParticipants = [
              participant.index,
              participant.docNumber,
              participant.student,
              participant.regional,
              participant.city,
              participant.accountExecutive
            ]

            if (!reportData?.data?.isVirtual) {
              if (reportData?.data?.courses && reportData?.data?.courses.length > 0) {
                for (const course of reportData?.data?.courses) {
                  let value = 0
                  if (
                    participant?.attendance?.attendanceByCourse[course?._id.toString()]
                  ) {
                    value = participant?.attendance?.attendanceByCourse[course?._id.toString()].value
                  }
                  contentParticipants.push(`${value}%`)
                }
              }
              contentParticipants.push(participant?.attendance?.totalHoursAttended)
              contentParticipants.push(`${participant?.attendance?.totalAttendancePercentage}%`)

              if (reportData?.data?.isAuditor) {
                contentParticipants.push(participant?.auditor?.examNote.toString())
                contentParticipants.push(participant?.auditor?.examApproval)
              }

              contentParticipants.push(participant?.certification?.totalAssistanceCertification)
              contentParticipants.push(participant?.certification?.partialCertification)

              if (reportData?.data?.isAuditor) {
                contentParticipants.push(participant?.certification?.auditorCertificationType)
              }
              contentParticipants.push(participant?.certification?.certificateReleaseDate)
              contentParticipants.push(participant?.certification?.personWhoReleasesCertificate)
            } else {
              if (reportData?.data?.courses && reportData?.data?.courses.length > 0) {
                for (const course of reportData?.data?.courses) {
                  let value = 0
                  if (
                    participant?.progress?.progressByCourse[course?._id.toString()]
                  ) {
                    value = participant?.progress?.progressByCourse[course?._id.toString()].value
                  }
                  contentParticipants.push(`${value}%`)
                }
                contentParticipants.push(participant?.progress?.percentageOfProgressInTheProgram)
                contentParticipants.push(participant?.progress?.forumNote)
                contentParticipants.push(participant?.progress?.taskNote)
                contentParticipants.push(participant?.progress?.evaluationNote)

                if (reportData?.data?.isAuditor) {
                  contentParticipants.push(participant?.auditor?.examNote)
                }
                contentParticipants.push(participant?.progress?.finalNote)
              }

              contentParticipants.push(participant?.certification?.virtualCertification)
              if (reportData?.data?.isAuditor) {
                contentParticipants.push(participant?.certification?.virtualApprovedExamAuditor)
                contentParticipants.push(participant?.certification?.virtualCertificationType)
              }

              contentParticipants.push(participant?.certification?.certificateReleaseDate)
              contentParticipants.push(participant?.certification?.personWhoReleasesCertificate)
            }


            sheetData.push(contentParticipants)
          }
        }


        if (merge.length > 0) {
          wsSheet["!merges"] = merge;
        }

        const cols = []
        for (let index = 0; index < 40; index++) {
          cols.push({width: 35})
        }

        wsSheet["!cols"] = cols

        XLSX.utils.sheet_add_aoa(wsSheet, sheetData, {origin: "A1"});

          // @INFO Se agrega al workbook
        XLSX.utils.book_append_sheet(wb, wsSheet, reportData.title)
      }

      return wb
    } catch(err) {
      return null;
    }
  }
}

export const reportByModalityService = new ReportByModalityService();
export { ReportByModalityService as DefaultDataReportsReportByModalityService };
