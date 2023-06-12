// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
// @end

// @import types
import { CertificateSettingCriteria } from '@scnode_app/types/default/admin/course/certificateSettingsTypes';
import { ICertificateMultipleCriteria } from './certificateMultipleCriteria.abstract';
import { CertificateMultipleAttendanceService } from './certificateMultipleAttendanceService';
import { CertificateMultipleExamService } from './certificateMultipleExamService';
import { CertificateMultipleProgressService } from './certificateMultipleProgresService';
// @end

export class CertificateMultipleCriteriaFactory {

  public instance: ICertificateMultipleCriteria

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor(criteria: CertificateSettingCriteria) {
    this.createInstance(criteria)
  }

  private createInstance = (criteria: CertificateSettingCriteria) => {
    switch (criteria) {
      case CertificateSettingCriteria.ATTENDANCE:
        this.instance = new CertificateMultipleAttendanceService()
        break;
      case CertificateSettingCriteria.EXAM:
        this.instance = new CertificateMultipleExamService()
        break;
      case CertificateSettingCriteria.PROGRESS:
        this.instance = new CertificateMultipleProgressService()
        break;
      default:
        this.instance = new CertificateMultipleAttendanceService()
        break;
    }

  }
}
