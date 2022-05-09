// @import_dependencies_node Import libraries
// @end

// @import services
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
      const time = new Date().getTime()

      // @INFO: Se define el formato del reporte, xlsx por defecto
      const output_format: any = params.output_format ? params.output_format : 'xlsx'
      const title: any = params.title ? `${params.title}_${time}` : `reporte_factory_${time}`

      const reportStartDate = params.reportStartDate || undefined
      const reportEndDate = params.reportEndDate || undefined

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
      // if (reportResponse.status !== 'success') return reportResponse;

      // return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
      //   report,
      //   instance: serviceInstance.status
      // }})
    } catch(err) {
      return responseUtility.buildResponseFailed('json')
    }
  }
}

export const reportsFactoryService = new ReportsFactoryService();
export { ReportsFactoryService as DefaultDataReportsReportsFactoryService };
