// @import_dependencies_node Import libraries
import * as XLSX from "xlsx";
// const ObjectID = require('mongodb').ObjectID
import moment from "moment";
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// import { generalUtility } from "@scnode_core/utilities/generalUtility";
import { xlsxUtility } from "@scnode_core/utilities/xlsx/xlsxUtility";
// @end

// @import models
import { CourseSchedulingStatus, CourseScheduling, CourseSchedulingDetails, User } from '@scnode_app/models';
// @end

// @import types
import { IFactoryGenerateReport } from '@scnode_app/types/default/data/reports/reportsFactoryTypes';
import { generalUtility } from "@scnode_core/utilities/generalUtility";
// @end

export interface IReportByProvisionOfProfessionals {
  title: string,
  pages: IReportByProvisionOfProfessionalsPerPage[]
}

export interface IReportByProvisionOfProfessionalsPerPage {
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
  serviceId: string,
  schedulingStatus: string
  modular: string,
  programCode: string,
  programName: string,
  modalityName: string,
  courseCode: string,
  courseName: string,
  hoursPerMonth: string,
  startDate: string,
  endDate: string,
  month: string,
  year: string,
  teacher: IReportCourseTeacher
  companyName: string,
  city: string,
  schedulingType: string,
  regional: string,
  typeCourse?: string,
}

export interface IReportCourseTeacher {
  docNumber: string,
  fullname: string,
  teacherType: string,
  scale: string,
}


class ReportByProvisionOfProfessionalsService {

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
          // courseSchedulingStatusInfo['Cancelado']._id,
        ]}
      }

      if (params?.reportStartDate && params?.reportEndDate) {
        where['startDate'] = {$gte: new Date(`${params.reportStartDate}T00:00:00Z`), $lte: new Date(`${params.reportEndDate}T23:59:59Z`)}
      }

      const courseSchedulings = await CourseScheduling.find(where)
      .select('id metadata schedulingStatus schedulingType schedulingMode modular program client city regional account_executive startDate endDate duration typeCourse')
      .populate({path: 'schedulingStatus', select: 'id name'})
      .populate({path: 'schedulingMode', select: 'id name'})
      .populate({path: 'modular', select: 'id name'})
      .populate({path: 'program', select: 'id name code isAuditor'})
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
        .populate({path: 'teacher', select: 'id profile.first_name profile.last_name profile.contractType profile.doc_number'})
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

      const time = new Date().getTime()
      // @INFO: Se define el formato del reporte, xlsx por defecto
      const output_format: any = params.output_format ? params.output_format : 'xlsx'
      const title: any = params.title ? `${params.title}_${time}` : `reporte_general_provisiones_${time}`

      const report: IReportByProvisionOfProfessionals = {
        title,
        pages: []
      }

      const reportDataPerPage: IReportByProvisionOfProfessionalsPerPage = {
        title: `Provisión de profesionales`,
        queryRange: {
          reportStartDate: params.reportStartDate,
          reportEndDate: params.reportEndDate
        },
        reportDate: moment().format('DD/MM/YYYY'),
        personWhoGeneratesReport: (userLogged?.profile) ? `${userLogged?.profile.first_name} ${userLogged?.profile.last_name}` : '-',
        data: []
      }

      for (const courseScheduling of courseSchedulings) {
        const itemBase: IReportPage = {
          _id: courseScheduling._id,
          serviceId: courseScheduling?.metadata?.service_id || '-',
          schedulingStatus: courseScheduling?.schedulingStatus?.name || '-',
          modular: courseScheduling?.modular?.name || '-',
          programCode: courseScheduling?.program?.code || '-',
          programName: courseScheduling?.program?.name || '-',
          schedulingType: courseScheduling?.schedulingType?.name || '-',
          modalityName: courseScheduling?.schedulingMode?.name || '-',
          courseCode: '-',
          courseName: '-',
          hoursPerMonth: '-',
          startDate: '-',
          endDate: '-',
          month: '-',
          year: '-',
          teacher: {
            docNumber: '-',
            fullname: '-',
            teacherType: '-',
            scale: '-',
          },
          city: courseScheduling?.city?.name || '-',
          regional: courseScheduling?.regional?.name || '-',
          companyName: courseScheduling?.client?.name || '-',
          typeCourse: courseScheduling?.typeCourse === 'free' ? 'Gratuito' : courseScheduling?.typeCourse === 'mooc' ? 'Mooc' : '-',
        }

        if (courseSchedulingDetails && courseSchedulingDetails[courseScheduling._id.toString()]) {
          const courses = courseSchedulingDetails[courseScheduling._id.toString()]
          for (const course of courses) {
            if (course?.sessions && Array.isArray(course.sessions) && course.sessions.length > 0) {
              const sessionsByMonth = course.sessions.reduce((accum, element) => {
                if (element?.startDate) {
                  const month = moment.utc(element.startDate).format('MM')
                  const year = moment.utc(element.startDate).format('YYYY')
                  if (!accum[month]) {
                    accum[month] = {
                      duration: 0,
                      year: year
                    }
                  }
                  accum[month].duration += element.duration
                }
                return accum;
              }, {})
              for (const month in sessionsByMonth) {
                if (Object.prototype.hasOwnProperty.call(sessionsByMonth, month)) {
                  const data = sessionsByMonth[month];

                  const itemCourseBase: IReportPage = JSON.parse(JSON.stringify(itemBase));
                  itemCourseBase.courseCode = course?.course?.code || '-';
                  itemCourseBase.courseName = course?.course?.name || '-';
                  itemCourseBase.hoursPerMonth = generalUtility.getHoursFromDuration(data.duration, null);
                  itemCourseBase.startDate = course?.startDate ? moment.utc(course.startDate).format('DD/MM/YYYY') : '-';
                  itemCourseBase.endDate = course?.endDate ? moment.utc(course.endDate).format('DD/MM/YYYY') : '-';
                  itemCourseBase.month = month;
                  itemCourseBase.year = data.year

                  let teacherType = '-';
                  if (course?.teacher?.profile?.contractType) {
                    if (course?.teacher?.profile?.contractType?.isTeacher === true) {
                      teacherType = 'Docente'
                    } else if (course?.teacher?.profile?.contractType?.isTutor === true) {
                      teacherType = 'Tutor'
                    }
                  }

                  itemCourseBase.teacher = {
                    docNumber: course?.teacher?.profile?.doc_number || '-',
                    fullname: (course.teacher?.profile) ? `${course.teacher.profile.first_name} ${course.teacher.profile.last_name}` : '-',
                    teacherType: teacherType,
                    scale: course?.teacher?.profile?.contractType?.type || '-',
                  }

                  reportDataPerPage.data.push(itemCourseBase)
                }
              }
            }
          }
        }


      }

      report.pages.push(reportDataPerPage)

      if (output_format === 'json') {
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          report
        }})
      } else if (output_format === 'xlsx') {
        if (report.pages.length === 0) return responseUtility.buildResponseFailed('json', null, { error_key: 'reports.factory.no_data' })

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
      console.log('ReportByProvisionOfProfessionalsService - generateReport', err)
      return responseUtility.buildResponseFailed('json')
    }
  }

  private buildXLSX = (report: IReportByProvisionOfProfessionals) => {
    try {
      // @INFO: Inicializamos el nuevo libro de excel
      const wb: XLSX.WorkBook = XLSX.utils.book_new();

      for (const reportData of report.pages) {
        const wsSheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([])

        let row = 0;
        const merge = []
        const sheetData = []

        // @INFO: Encabezado inicial
        sheetData.push([`INFORME GENERAL DE PROVISIÓN DE PROFESIONALES`])
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

        const headerTable = [
          'ID del servicio',
          'Estado',
          'Modular',
          'Código del programa',
          'Nombre del programa',
          'Línea del programa',
          'Modalidad',
          'Gratuito/Mooc',
          'Código del curso',
          'Nombre del curso',
          'Horas por mes',
          'Fecha inicio del curso',
          'Fecha finalización del curso',
          'Mes',
          'Año',
          'Numero de identificación del docente',
          'Docente',
          'Tipo de docente',
          'Escalafon',
          // 'Ciudad origen Docente',
          // 'Regional Docente',
          'Ciudad del servicio',
          'Regional del servicio',
          'Empresa',
        ]

        sheetData.push(headerTable)
        row++;

        for (const scheduling of reportData?.data) {
          const contentScheduling = [
            scheduling.serviceId,
            scheduling.schedulingStatus,
            scheduling.modular,
            scheduling.programCode,
            scheduling.programName,
            scheduling.schedulingType,
            scheduling.modalityName,
            scheduling.typeCourse,
            scheduling.courseCode,
            scheduling.courseName,
            scheduling.hoursPerMonth,
            scheduling.startDate,
            scheduling.endDate,
            scheduling.month,
            scheduling.year,
            scheduling.teacher?.docNumber,
            scheduling.teacher?.fullname,
            scheduling.teacher?.teacherType,
            scheduling.teacher?.scale,
            scheduling.city,
            scheduling.regional,
            scheduling.companyName,
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
      console.log('ReportByProvisionOfProfessionalsService - buildXLSX', err)
      return null;
    }
  }
}

export const reportByProvisionOfProfessionalsService = new ReportByProvisionOfProfessionalsService();
export { ReportByProvisionOfProfessionalsService as DefaultDataReportsReportByProvisionOfProfessionalsService };
