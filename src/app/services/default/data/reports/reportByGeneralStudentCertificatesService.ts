// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { IFactoryGenerateReport } from '@scnode_app/types/default/data/reports/reportsFactoryTypes';
// import { IFactoryGenerateReport } from 'app/types/default/data/reports/reportsFactoryTypes';
// @end

// @import models
// @end

// @import types
// @end

class ReportByGeneralStudentCertificatesService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  public generateReport = (params: IFactoryGenerateReport) => {
    try {
      console.log('entro ReportByGeneralStudentCertificatesService')
      // TODO: Recibir parametros de entrada
      // TODO:  Fechas del reporte
      // TODO: Consultar los programas que cumplan con la condicion de busqueda (Verificar cuales estados se van a dejar)
      // TODO: Formatear la data requerida para el reporte
      // TODO: Generar estructura del Excel (Por cada programación se requiere una pestaña en el reporte)
      // TODO: Incluir data en el excel
      return responseUtility.buildResponseSuccess('json')
    } catch (err) {
      return responseUtility.buildResponseFailed('json')
    }
  }
}

export const reportByGeneralStudentCertificatesService = new ReportByGeneralStudentCertificatesService();
export { ReportByGeneralStudentCertificatesService as DefaultDataReportsReportByGeneralStudentCertificatesService };
