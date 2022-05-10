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
import { CourseSchedulingStatus, CourseScheduling, Enrollment, CourseSchedulingDetails, User } from '@scnode_app/models';
// @end

// @import types
import { IFactoryGenerateReport } from '@scnode_app/types/default/data/reports/reportsFactoryTypes';
// @end

export interface IReportByOverviewPrograms {
  title: string,
  pages: IReportByOverviewProgramsPerPage[]
}

export interface IReportByOverviewProgramsPerPage {
  title: string;
  queryRange?: {
    reportStartDate: string | undefined,
    reportEndDate: string | undefined,
  };
  reportDate: string;
  personWhoGeneratesReport: string;
  data: IReportPage[]
}

export interface IReportPage {
  _id: string,
  modular: string,
  programCode: string,
  serviceId: string,
  programName: string,
  startDate: string,
  endDate: string,
  modalityName: string,
  totalDuration: number,
  totalDurationFormated: string,
  participants: number,
  certification: {
    standar: {
      participantsWithAttendanceProgressComplete: number,
      participantsWithCertificate: number,
      participantsWithCertificateDownload: number,
    },
    auditor: {
      participantsWithAttendance: number,
      participantsWithExamenApproved: number,
      amountCertificatesWithAttendanceAndAproved: number,
      participantsWithCertificateDownload: number,
    }
  },
  companyName: string,
  city: string,
  schedulingType: string,
  regional: string,
  accountExecutive: string,
  auxiliar: string,
  isVirtual: boolean,
  isAuditor: boolean,
}


class ReportByOverviewProgramsService {

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

      const courseSchedulingStatus = await CourseSchedulingStatus.find().select('id name')
      if (!courseSchedulingStatus) return responseUtility.buildResponseFailed('json')

      const courseSchedulingStatusInfo = courseSchedulingStatus.reduce((accum, element) => {
        if (!accum[element.name]) {
          accum[element.name] = element;
        }
        return accum
      }, {})

      let where: any = {
        schedulingStatus: {$in: [
          courseSchedulingStatusInfo['Confirmado']._id,
          courseSchedulingStatusInfo['Ejecutado']._id,
          courseSchedulingStatusInfo['Cancelado']._id,
        ]}
      }

      if (params?.reportStartDate && params?.reportEndDate) {
        where['startDate'] = {$gte: new Date(`${params.reportStartDate}T00:00:00Z`), $lte: new Date(`${params.reportEndDate}T23:59:59Z`)}
      }

      const courseSchedulings = await CourseScheduling.find(where)
      .select('id metadata schedulingMode modular program client city schedulingType regional account_executive startDate endDate duration')
      .populate({path: 'schedulingMode', select: 'id name'})
      .populate({path: 'modular', select: 'id name'})
      .populate({path: 'program', select: 'id name code'})
      .populate({path: 'client', select: 'id name'})
      .populate({path: 'city', select: 'id name'})
      .populate({path: 'schedulingType', select: 'id name'})
      .populate({path: 'regional', select: 'id name'})
      .populate({path: 'account_executive', select: 'id profile.first_name profile.last_name'})
      .populate({path: 'material_assistant', select: 'id profile.first_name profile.last_name'})
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

      if (courseSchedulingIds.length > 0) {
        const enrolledByProgramQuery = await Enrollment.aggregate([
          {
            $match: {
              course_scheduling: {
                $in: courseSchedulingIds.reduce((accum, element) => {
                  accum.push(ObjectID(element))
                  return accum
                },[])
              }
            }
          },
          {
            $group: { _id: "$course_scheduling", count: { $sum: 1} }
          }
        ])
        if (enrolledByProgramQuery.length > 0) {
          participantsByProgram = enrolledByProgramQuery.reduce((accum, element) => {
            if (!accum[element._id.toString()]) {
              accum[element._id.toString()] = element.count;
            }
            return accum
          }, {})
        }
      }

      const time = new Date().getTime()
      // @INFO: Se define el formato del reporte, xlsx por defecto
      const output_format: any = params.output_format ? params.output_format : 'xlsx'
      const title: any = params.title ? `${params.title}_${time}` : `reporte_general_programas_${time}`

      const report: IReportByOverviewPrograms = {
        title,
        pages: []
      }

      const reportDataPerPage: IReportByOverviewProgramsPerPage = {
        title: `General de programas`,
        queryRange: {
          reportStartDate: params.reportStartDate,
          reportEndDate: params.reportEndDate
        },
        reportDate: moment().format('DD/MM/YYYY'),
        personWhoGeneratesReport: (userLogged?.profile) ? `${userLogged?.profile.first_name} ${userLogged?.profile.last_name}` : '-',
        data: []
      }

      // TODO: Consultar información desde coleccion consolidada

      for (const courseScheduling of courseSchedulings) {
        const itemBase: IReportPage = {
          _id: courseScheduling._id,
          modular: courseScheduling?.modular?.name || '-',
          programCode: courseScheduling?.program?.code || '-',
          serviceId: courseScheduling?.metadata?.service_id || '-',
          programName: courseScheduling?.program?.name || '-',
          startDate: courseScheduling?.startDate ? moment(courseScheduling.startDate).format('DD/MM/YYYY') : '-',
          endDate: courseScheduling?.endDate ? moment(courseScheduling.endDate).format('DD/MM/YYYY') : '-',
          modalityName: courseScheduling?.schedulingMode?.name || '-',
          totalDuration: 0,
          totalDurationFormated: '0h',
          participants: (participantsByProgram[courseScheduling?._id]) ? participantsByProgram[courseScheduling._id] : 0,
          certification: {
            standar: {
              participantsWithAttendanceProgressComplete: 0, // TODO: Extraer valor que debe salir del consolidado
              participantsWithCertificate: 0, // TODO: Extraer valor que debe salir del consolidado
              participantsWithCertificateDownload: 0, // TODO: Extraer valor que debe salir del consolidado
            },
            auditor: {
              participantsWithAttendance: 0, // TODO: Extraer valor que debe salir del consolidado
              participantsWithExamenApproved: 0, // TODO: Extraer valor que debe salir del consolidado
              amountCertificatesWithAttendanceAndAproved: 0, // TODO: Extraer valor que debe salir del consolidado
              participantsWithCertificateDownload: 0, // TODO: Extraer valor que debe salir del consolidado
            }
          },
          companyName: courseScheduling?.client?.name || '-',
          city: courseScheduling?.city?.name || '-',
          schedulingType: courseScheduling?.schedulingType?.name || '-',
          regional: courseScheduling?.regional?.name || '-',
          accountExecutive: (courseScheduling?.account_executive?.profile) ? `${courseScheduling?.account_executive?.profile.first_name} ${courseScheduling?.account_executive?.profile.last_name}` : '-',
          auxiliar: (courseScheduling?.material_assistant?.profile) ? `${courseScheduling?.material_assistant?.profile.first_name} ${courseScheduling?.material_assistant?.profile.last_name}` : '-',
          isVirtual: courseScheduling?.schedulingMode?.name === 'Virtual' ? true : false,
          isAuditor: Math.round(Math.random()) === 1 ? true : false // TODO: Crear tarea automatizada para estableccer este dato y poderlo sacar desde colección programas
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

            itemBase.totalDuration += duration_scheduling || 0
          }
        }

        if (itemBase.totalDuration) {
          itemBase.totalDurationFormated = (itemBase.totalDuration) ? generalUtility.getDurationFormated(itemBase.totalDuration) : '0h'
        }

        reportDataPerPage.data.push(itemBase)
        // report.data.push(reportDataPerPage)
      }

      report.pages.push(reportDataPerPage)

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

  private buildXLSX = (report: IReportByOverviewPrograms) => {
    try {
      // @INFO: Inicializamos el nuevo libro de excel
      const wb: XLSX.WorkBook = XLSX.utils.book_new();

      for (const reportData of report.pages) {
        const wsSheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([])

        let row = 0;
        const merge = []
        const sheetData = []

        // @INFO: Encabezado inicial
        sheetData.push([`INFORME GENERAL DE OPERACIÓN DE PROGRAMAS - CONTROL DE EMISIÓN DE CERTIFICADOS`])
        sheetData.push([])
        let itemMergeHeaderReport = {}
        itemMergeHeaderReport['s'] = {r: row, c: 0}
        itemMergeHeaderReport['e'] = {r: row, c: 13}

        merge.push(itemMergeHeaderReport)
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

        sheetData.push(['NOMBRE PERSONA QUE CONSULTA', reportData?.personWhoGeneratesReport])
        row++;
        sheetData.push(['FECHA DEL INFORME', reportData?.reportDate])
        row++;
        sheetData.push([])
        row++;

        const preHeaderTable = [
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '1er Certificado programa completo',
          '',
          '',
          '2do Certificado Auditores',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          ''
        ]
        let colCount = 0
        let itemMergePreHeaderOne = {}
        itemMergePreHeaderOne['s'] = {r: row, c: colCount}
        colCount = 8;
        itemMergePreHeaderOne['e'] = {r: row, c: colCount}
        merge.push(itemMergePreHeaderOne)

        colCount++;
        let itemMergePreHeaderTwo = {}
        itemMergePreHeaderTwo['s'] = {r: row, c: colCount}
        colCount++;
        colCount++;
        itemMergePreHeaderTwo['e'] = {r: row, c: colCount}
        merge.push(itemMergePreHeaderTwo)


        colCount++;
        let itemMergePreHeaderThree = {}
        itemMergePreHeaderThree['s'] = {r: row, c: colCount}
        colCount++;
        colCount++;
        colCount++;
        itemMergePreHeaderThree['e'] = {r: row, c: colCount}
        merge.push(itemMergePreHeaderThree)

        const headerTable = [
          'Modular',
          'Código del programa',
          'ID del servicio',
          'Programa',
          'Fecha inicio',
          'Fecha finalización',
          'Modalidad',
          'Duración',
          'Participantes por grupo (inscritos)',
          'Participantes que cumplen la asistencia/avance al programa completo',
          'Número de estudiantes que se le ha liberado el certificado',
          'Número de estudiatnes que han descargado',
          'Número de participantes que cumplen asistencia auditoria',
          'Número de participantes que aprueban examen de auditoria',
          'Número de certificados de auditores liberados de asistencia y aprobación',
          'Número de estudiantes que descargaron los certificados asistencia y aprobación',
          'Empresa',
          'Ciudad',
          'Tipo de servicio',
          'Regional',
          'Ejecutivo de cuenta',
          'Auxiliar logístico que libera'
        ]

        sheetData.push(preHeaderTable)
        row++;
        sheetData.push(headerTable)
        row++;

        for (const scheduling of reportData?.data) {
          const contentScheduling = [
            scheduling.modular,
            scheduling.programCode,
            scheduling.serviceId,
            scheduling.programName,
            scheduling.startDate,
            scheduling.endDate,
            scheduling.modalityName,
            scheduling.totalDurationFormated,
            scheduling.participants,
            scheduling.certification?.standar?.participantsWithAttendanceProgressComplete,
            scheduling.certification?.standar?.participantsWithCertificate,
            scheduling.certification?.standar?.participantsWithCertificateDownload,
            scheduling.certification?.auditor?.participantsWithAttendance,
            scheduling.certification?.auditor?.participantsWithExamenApproved,
            scheduling.certification?.auditor?.amountCertificatesWithAttendanceAndAproved,
            scheduling.certification?.auditor?.participantsWithCertificateDownload,
            scheduling.companyName,
            scheduling.city,
            scheduling.schedulingType,
            scheduling.regional,
            scheduling.accountExecutive,
            scheduling.auxiliar
          ]
          sheetData.push(contentScheduling)
          row++;
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
    } catch (err) {
      return null;
    }
  }
}

export const reportByOverviewProgramsService = new ReportByOverviewProgramsService();
export { ReportByOverviewProgramsService as DefaultDataReportsReportByOverviewProgramsService };
