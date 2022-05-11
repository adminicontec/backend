// @import_dependencies_node Import libraries
// @end

// @import services
import { documentQueueService } from '@scnode_app/services/default/admin/documentQueue/documentQueueService';
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { FactoryReportType, IFactoryGenerateReport } from '@scnode_app/types/default/data/reports/reportsFactoryTypes';
import { requestUtility } from '@scnode_core/utilities/requestUtility';
// @end

// @import models
// @end

// @import types
// @end

class ReportsFactoryService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite generar un reporte en PDF
   * @param params
   * @returns
   */
  public factoryGenerateReport = async (params: IFactoryGenerateReport) => {
    try {
      if (!params.report) return responseUtility.buildResponseFailed('json', null, {error_key: 'reports.factory.report_required'})
      const reportValid = Object.keys(FactoryReportType).filter(
        (key) => FactoryReportType[key] === params.report,
      )
      if (reportValid.length === 0)
        return responseUtility.buildResponseFailed(
          'json',
          null,
          {
            error_key: {
              key: 'reports.factory.report_invalid',
              params: {
                reports: Object.keys(FactoryReportType).map(
                  (key) => FactoryReportType[key],
                )
              }
          }
        })

      const report = params.report.replace(/_/g,'-')

      const serviceInstance = requestUtility.serviceInstance(`report-by-${report}`,"default", "data/reports");
      if (serviceInstance.status !== 'success') return responseUtility.buildResponseFailed('json', null, {error_key: 'reports.factory.report_not_configured'})

      const service = serviceInstance['service'];
      const reportResponse = await service.generateReport(params)
      return reportResponse
    } catch(err) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  public processFactoryGenerateReportByDocumentQueue = async (params: {recordToProcess: any, mixedParams: IFactoryGenerateReport}) => {
    try {
      const factoryReport = await this.factoryGenerateReport(params.mixedParams);
      let docPath = undefined;
      if (factoryReport.status === 'success' && factoryReport.path) {
        docPath = factoryReport.path.split('uploads/')[1]
      }
      const respDocumentQueue: any = await documentQueueService.insertOrUpdate({
        id: params.recordToProcess.id,
        status: 'Complete',
        docPath,
        processLog: factoryReport?.status === 'success' ? factoryReport : undefined,
        errorLog: factoryReport?.status === 'error' ? factoryReport : undefined,
      });

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          processFile: {
            ...respDocumentQueue
          }
        }
      })
    } catch(err) {
      console.log('processFactoryGenerateReportByDocumentQueue - error', err)
      return responseUtility.buildResponseFailed('json', null)
    }
  }
}

export const reportsFactoryService = new ReportsFactoryService();
export { ReportsFactoryService as DefaultDataReportsReportsFactoryService };
