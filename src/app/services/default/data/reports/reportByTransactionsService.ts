// @import_dependencies_node Import libraries
import * as XLSX from "xlsx";
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { IFactoryGenerateReport } from '@scnode_app/types/default/data/reports/reportsFactoryTypes';
import { Transaction } from '@scnode_app/models';
import { TransactionStatus } from '@scnode_app/types/default/admin/transaction/transactionTypes';
import { TIME_ZONES_WITH_OFFSET, TimeZone } from '@scnode_app/types/default/admin/user/userTypes';
import moment from 'moment';
import { xlsxUtility } from '@scnode_core/utilities/xlsx/xlsxUtility';
// @end

// @import models
// @end

// @import types
// @end

interface ITransactionItem {
  _id: string
  status: TransactionStatus
  created_at: Date
  baseAmount: number
  taxesAmount: number
  totalAmount: number
  user: {
    email: string
    profile: {
      first_name: string
      last_name: string
    }
  }
  courseScheduling: {
    metadata: {
      service_id: string
    }
    program: {
      name: string
    }
    schedulingMode: {
      name: string
    }
  }
}

interface IReportTransactions {
  title: string
  pages: IReportTransactionsPage[]
}

interface IReportTransactionsPage {
  title: string
  data: IReportTransactionsItem[]
  headers: string[]
}

type IReportTransactionsItem = Record<string, string>

class ReportByTransactionsService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  public generateReport = async (params: IFactoryGenerateReport) => {
    try {
      const aggregation = this.getTransactionsAggregation(params)
      const transactions: ITransactionItem[] = await Transaction.aggregate(aggregation)
      const report: IReportTransactions = {
        title: "Transacciones",
        pages: []
      }
      const COPformat = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
      })

      const headerKeys = [
        'Estado',
        'No. Orden',
        'Fecha creación',
        'Nombres',
        'Correo',
        'Total transacción',
        'Total impuesto',
        'Código curso',
        'Nombre curso',
        'Modalidad',
        'Precio articulo'
      ]
      const rowItems: IReportTransactionsItem[] = []
      for (const transaction of transactions) {
        rowItems.push({
          'Estado': transaction.status,
          'No. Orden': String(transaction._id),
          'Fecha creación': moment(transaction.created_at.toISOString().replace('T00:00:00.000Z', '')).zone(TIME_ZONES_WITH_OFFSET[TimeZone.GMT_5]).format('YYYY-MM-DD'),
          'Nombres': `${transaction.user?.profile?.first_name} ${transaction.user?.profile?.last_name}`,
          'Correo': transaction.user.email,
          'Total transacción': COPformat.format(transaction.totalAmount),
          'Total impuesto': COPformat.format(transaction.taxesAmount),
          'Código curso': transaction.courseScheduling?.metadata?.service_id,
          'Nombre curso': transaction?.courseScheduling?.program?.name,
          'Modalidad': transaction?.courseScheduling?.schedulingMode?.name,
          'Precio articulo': COPformat.format(transaction.baseAmount)
        })
      }

      const reportPage: IReportTransactionsPage = {
        title: "Transactions",
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
      console.log(`ReportByTransactionsService -> generateReport -> ERROR -> ${e}`)
      return responseUtility.buildResponseFailed('json')
    }
  }

  private buildXLSX = (report: IReportTransactions) => {
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
      console.log(`ReportByTransactionsService -> buildXLSX -> ERROR -> ${e}`)
      return null
    }
  }

  private getTransactionsAggregation = (params: IFactoryGenerateReport) => {
    return [
      {
        $match: {
          deleted: false
        }
      },
      {
        $project: {
          status: 1,
          certificateQueue: 1,
          created_at: 1,
          totalAmount: 1,
          baseAmount: 1,
          taxesAmount: 1
        }
      },
      {
        $lookup: {
          from: 'certificate_queues',
          let: { certQueue: "$certificateQueue" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$certQueue"] } } },
            { $project: { userId: 1, courseId: 1 } }
          ],
          as: 'certificateQueue'
        }
      },
      { $unwind: '$certificateQueue' },
      {
        $lookup: {
          from: 'users',
          let: { userId: "$certificateQueue.userId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$userId"] } } },
            { $project: { profile: 1, email: 1 } }
          ],
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'course_schedulings',
          let: { courseId: "$certificateQueue.courseId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$courseId"] } } },
            { $project: { metadata: 1, program: 1, schedulingMode: 1 } }
          ],
          as: 'courseScheduling'
        }
      },
      { $unwind: '$courseScheduling' },
      {
        $lookup: {
          from: 'course_scheduling_modes',
          let: { schedulingModeId: "$courseScheduling.schedulingMode" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$schedulingModeId"] } } }
          ],
          as: 'schedulingMode'
        }
      },
      { $unwind: '$schedulingMode' },
      {
        $lookup: {
          from: 'programs',
          let: { programId: "$courseScheduling.program" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$programId"] } } }
          ],
          as: 'program'
        }
      },
      { $unwind: '$program' },
      {
        $project: {
          status: 1,
          created_at: 1,
          totalAmount: 1,
          baseAmount: 1,
          taxesAmount: 1,
          user: {
            profile: "$user.profile",
            email: "$user.email"
          },
          courseScheduling: {
            metadata: "$courseScheduling.metadata",
            program: "$program",
            schedulingMode: "$schedulingMode"
          }
        }
      }
    ]
  }

}

export const reportByTransactionsService = new ReportByTransactionsService();
export { ReportByTransactionsService as DefaultDataReportsReportByTransactionsService };
