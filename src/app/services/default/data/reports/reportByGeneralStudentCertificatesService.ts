// @import_dependencies_node Import libraries
import * as XLSX from "xlsx";
import moment from "moment";
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { xlsxUtility } from "@scnode_core/utilities/xlsx/xlsxUtility";
// @end

// @import models
import { CertificateQueue, User } from '@scnode_app/models';
// @end

// @import types
import { IFactoryGenerateReport } from '@scnode_app/types/default/data/reports/reportsFactoryTypes';
// @end

export interface IReportByGeneralStudentCertificates {
  title: string,
  pages: IReportByGeneralStudentCertificatesPerPage[]
}

export interface IReportByGeneralStudentCertificatesPerPage {
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
  serviceId: string;
  modalityName: string;
  regional: string;
  city: string;
  accountExecutive: string;
  companyName: string;
  programCode: string;
  programName: string;
  certificationName: string;
  user: {
    username: string;
    docNumber: string;
    firstName: string;
    lastName: string;
    email: string;
  },
  startDate: string;
  endDate: string;
  certification: {
    hash: string;
    date: string;
    downloadDate: string;
    auxiliar: string;
  }
}


class ReportByGeneralStudentCertificatesService {

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

      const where: any = {
        status: 'Complete'
      }

      if (params?.reportStartDate && params?.reportEndDate) {
        where['certificate.date'] = {$gte: new Date(`${params.reportStartDate}T00:00:00Z`), $lte: new Date(`${params.reportEndDate}T23:59:59Z`)}
      }

      const certifications = await CertificateQueue.find(where)
      .select('_id courseId userId auxiliar certificateType message downloadDate certificate.hash certificate.date certificate.title')
      .populate({
        path: 'courseId',
        select: 'id metadata schedulingMode regional city account_executive client program startDate endDate',
        populate: [
          {path: 'schedulingMode', select: 'id name'},
          {path: 'regional', select: 'id name'},
          {path: 'city', select: 'id name'},
          {path: 'account_executive', select: 'id profile.first_name profile.last_name'},
          {path: 'client', select: 'id name'},
          {path: 'program', select: 'id name code'}
        ]
      })
      .populate({
        path: 'userId',
        select: 'id username email profile.doc_number profile.first_name profile.last_name '
      })
      .populate({
        path: 'auxiliar',
        select: 'id profile.first_name profile.last_name'
      })

      const time = new Date().getTime()
      // @INFO: Se define el formato del reporte, xlsx por defecto
      const output_format: any = params.output_format ? params.output_format : 'xlsx'
      const title: any = params.title ? `${params.title}_${time}` : `reporte_certificados_estudiantes_${time}`

      const report: IReportByGeneralStudentCertificates = {
        title,
        pages: []
      }

      const reportDataPerPage: IReportByGeneralStudentCertificatesPerPage = {
        title: `General certf estudiante`,
        queryRange: {
          reportStartDate: params.reportStartDate,
          reportEndDate: params.reportEndDate
        },
        reportDate: moment().format('DD/MM/YYYY'),
        personWhoGeneratesReport: (userLogged?.profile) ? `${userLogged?.profile.first_name} ${userLogged?.profile.last_name}` : '-',
        data: []
      }

      for (const certification of certifications) {
        const itemBase: IReportPage = {
          serviceId: certification?.courseId?.metadata?.service_id || '-',
          modalityName: certification?.courseId?.schedulingMode?.name || '-',
          regional: certification?.courseId?.regional?.name || '-',
          city: certification?.courseId?.city?.name || '-',
          accountExecutive: (certification?.courseId?.account_executive?.profile) ? `${certification?.courseId?.account_executive?.profile.first_name} ${certification?.courseId?.account_executive?.profile.last_name}` : '-',
          companyName: certification?.courseId?.client?.name || '-',
          programCode: certification?.courseId?.program?.code || '-',
          programName: certification?.courseId?.program?.name || '-',
          certificationName: certification?.certificate?.title || '-',
          user: {
            username: certification?.userId?.username || '-',
            docNumber: certification?.userId?.profile?.doc_number || '-',
            firstName: certification?.userId?.profile?.first_name || '-',
            lastName: certification?.userId?.profile?.last_name || '-',
            email: certification?.userId?.email || '-',
          },
          startDate: certification?.courseId?.startDate ? moment(certification?.courseId.startDate).format('DD/MM/YYYY') : '-',
          endDate: certification?.courseId?.endDate ? moment(certification?.courseId.endDate).format('DD/MM/YYYY') : '-',
          certification: {
            hash: certification?.certificate?.hash || '-',
            date: (certification?.certificate?.date) ? moment(certification?.certificate?.date).format('DD/MM/YYYY') : '-',
            downloadDate: certification?.downloadDate ? moment(certification?.downloadDate).format('DD/MM/YYYY') : '-',
            auxiliar: (certification?.auxiliar?.profile) ? `${certification?.auxiliar?.profile.first_name} ${certification?.auxiliar?.profile.last_name}` : '-',
          }
        }

        reportDataPerPage.data.push(itemBase)
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
      console.log('ReportByGeneralStudentCertificatesService - generateReport', err)
      return responseUtility.buildResponseFailed('json')
    }
  }

  private buildXLSX = (report: IReportByGeneralStudentCertificates) => {
    try {
      // @INFO: Inicializamos el nuevo libro de excel
      const wb: XLSX.WorkBook = XLSX.utils.book_new();

      for (const reportData of report.pages) {
        const wsSheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([])

        let row = 0;
        const merge = []
        const sheetData = []

        // @INFO: Encabezado inicial
        sheetData.push([`INFORME GENERAL CERTIFICADOS LIBERADOS - POR PARTICIPANTE`])
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
          'Modalidad',
          'Regional',
          'Ciudad',
          'Ejecutivo de cuenta',
          'Cliente',
          'Código del programa',
          'ID del servicio',
          'Programa',
          'Certificado',
          'Username',
          'Documento de identidad',
          'Nombres',
          'Apellidos',
          'Correo electronico',
          'Código del certificado',
          'Fecha de inicio del programa',
          'Fecha de finalización del programa',
          'Fecha de liberación - auxiliar logistico',
          'Fecha de descarga certificado (Estudiante)',
          'Auxiliar logistico'
        ]

        sheetData.push(headerTable)
        row++;

        for (const certification of reportData?.data) {
          const contentScheduling = [
            certification.modalityName,
            certification.regional,
            certification.city,
            certification.accountExecutive,
            certification.companyName,
            certification.programCode,
            certification.serviceId,
            certification.programName,
            certification.certificationName,
            certification.user.username,
            certification.user.docNumber,
            certification.user.firstName,
            certification.user.lastName,
            certification.user.email,
            certification.certification.hash,
            certification.startDate,
            certification.endDate,
            certification.certification.date,
            certification.certification.downloadDate,
            certification.certification.auxiliar
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
    } catch(err) {
      console.log('ReportByGeneralStudentCertificatesService - buildXLSX', err)
      return null;
    }
  }
}

export const reportByGeneralStudentCertificatesService = new ReportByGeneralStudentCertificatesService();
export { ReportByGeneralStudentCertificatesService as DefaultDataReportsReportByGeneralStudentCertificatesService };
