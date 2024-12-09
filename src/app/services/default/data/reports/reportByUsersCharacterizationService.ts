// @import_dependencies_node Import libraries
const he = require('he')
import * as XLSX from "xlsx";
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { IFactoryGenerateReport } from '@scnode_app/types/default/data/reports/reportsFactoryTypes';
import { AcademicResourceAttempt } from '@scnode_app/models';
import { IQuestion } from '@scnode_app/types/default/admin/academicContent/questions/questionTypes';
import { xlsxUtility } from '@scnode_core/utilities/xlsx/xlsxUtility';
// @end

// @import models
// @end

// @import types
// @end

interface IAttemptItem {
  _id: string
  user: {
    username: string
    email: string
    profile: {
      first_name: string
      last_name: string
      doc_number: string
    }
  }
  statistics: {
    _id: string
    question: IQuestion
    answer: string | string[]
  }[]
}

interface IReportCharacterization {
  title: string
  pages: IReportCharacterizationPage[]
}

interface IReportCharacterizationPage {
  title: string
  data: IReportCharacterizationItem[]
  headers: string[]
}

type IReportCharacterizationItem = Record<string, string>

class ReportByUsersCharacterizationService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  public generateReport = async (params: IFactoryGenerateReport) => {
    try {
      const aggregation = this.getAttemptAggregation(params)
      const attempts: IAttemptItem[] = await AcademicResourceAttempt.aggregate(aggregation)
      const report: IReportCharacterization = {
        title: "Reporte de caracterización",
        pages: []
      }

      const headerKeys = ['Documento de identidad', 'Nombres', 'Apellidos', 'Correo electrónico', 'Usuario']
      const rowItems: IReportCharacterizationItem[] = []
      for (const attempt of attempts) {
        const userInformation = {
          'Documento de identidad': attempt?.user?.profile?.doc_number,
          'Nombres': attempt?.user?.profile?.first_name,
          'Apellidos': attempt?.user?.profile?.last_name,
          'Correo electrónico': attempt?.user?.email,
          'Usuario': attempt?.user?.username
        }
        rowItems.push({
          ...userInformation,
          ...(attempt.statistics.reduce((accum: Record<string, string>, item) => {
            const cellName = this.formatHTMLText(item.question.content)
            const cellValue = item.question.answers
              ?.filter((answer) => Array.isArray(item.answer) ? item.answer.includes(answer._id?.toString()) : answer._id?.toString() === item.answer)
              ?.map((answer) => this.formatHTMLText(answer?.content))
              ?.join(', ')
            if (!headerKeys.includes(cellName)) {
              headerKeys.push(cellName)
            }
            accum[cellName] = cellValue
            return accum
          }, {}))
        })
      }

      const reportPage: IReportCharacterizationPage = {
        title: "Caracterización",
        headers: headerKeys,
        data: rowItems
      }
      report.pages.push(reportPage)

      const wb = this.buildXLSX(report)
      if (!wb) return responseUtility.buildResponseFailed('json', null, { error_key: 'reports.customReport.fail_build_xlsx' })

      const send = await xlsxUtility.uploadXLSX({ from: 'file', attached: { file: { name: `${report.title}.xlsx` } } }, {workbook: wb})
      if (!send) return responseUtility.buildResponseFailed('json', null, { error_key: 'reports.customReport.fail_upload_xlsx' })

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          path: send,
        }
      })
    } catch(e) {
      console.log(`ReportByUserCharacterizationService -> generateReport -> ERROR -> ${e}`)
      return responseUtility.buildResponseFailed('json')
    }
  }

  private buildXLSX = (report: IReportCharacterization) => {
    try {
      const wb: XLSX.WorkBook = XLSX.utils.book_new();

      for (const reportPage of report.pages) {
        const wsSheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([])
        const sheetData: string[][] = [reportPage.headers]

        for (const row of reportPage.data) {
          sheetData.push(reportPage.headers.reduce((accum: string[], key) => {
            accum.push(row[key] ? row[key] : '-')
            return accum
          }, []))
        }

        const cols = []
        for (const _ of reportPage.headers) {
          cols.push({ width: 35 })
        }

        wsSheet["!cols"] = cols
        XLSX.utils.sheet_add_aoa(wsSheet, sheetData, {origin: "A1"});
        XLSX.utils.book_append_sheet(wb, wsSheet, reportPage.title)
      }

      return wb
    } catch (e) {
      console.log(`ReportByUserCharacterizationService -> buildXLSX -> ERROR -> ${e}`)
      return null
    }
  }

  private formatHTMLText = (text: string) => {
    if (!text?.length) return ''
    const removeTagsRegExp = /<[^>]*>/g
    return he.decode(text?.replace(removeTagsRegExp, ''))
  }

  private getAttemptAggregation = (params: IFactoryGenerateReport) => {
    return [
      {
        $match: {
          created_at: {$lte: new Date(params.reportEndDate), $gte: new Date(params.reportStartDate)}
        },
      },
      {
        $lookup: {
          from: 'academic_resource_configs',
          localField: 'academic_resource_config',
          foreignField: '_id',
          as: 'academicResourceConfig'
        },
      },
      {
        $match: {
          "academicResourceConfig.config.course_modes": 'characterization-survey'
        }
      },
      {
        $project: {
          results: true,
          user: true,
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: "$user"
      },
      {
        $unwind: "$results.statistics"
      },
      {
        $lookup: {
          from: 'questions',
          localField: "results.statistics.question",
          foreignField: "_id",
          as: "questionObject"
        }
      },
      {
        $unwind: "$questionObject"
      },
      {
        $addFields: {
          "results.statistics.question": "$questionObject"
        }
      },
      {
        $project: {
          "user.profile": true,
          "user.email": true,
          "user.username": true,
          "results": true
        }
      },
      {
        $group: {
          _id: "$_id",
          user: {
            $first: "$user"
          },
          statistics: {
            $addToSet: "$results.statistics"
          }
        }
      }
    ]
  }

}

export const reportByUsersCharacterizationService = new ReportByUsersCharacterizationService();
export { ReportByUsersCharacterizationService as DefaultDataReportsReportByUsersCharacterizationService };
