// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
// @end

// @import models
// @end

// @import types
import { ICertificateMultipleCriteria } from './certificateMultipleCriteria.abstract';
// @end

export class CertificateMultipleAttendanceService implements ICertificateMultipleCriteria {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  public async evaluateCriteria(): Promise<boolean> {
    console.log('CertificateMultipleAttendanceService - evaluateCriteria')
    return true
  }
}
