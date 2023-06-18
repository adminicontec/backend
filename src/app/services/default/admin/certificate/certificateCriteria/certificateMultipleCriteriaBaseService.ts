// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
// @end

// @import models
// @end

// @import types
import { IStudentStats } from '@scnode_app/types/default/admin/certificate/certificateMultipleTypes';
import { ICertificateMultipleCriteria, IEvaluateCriteria } from './certificateMultipleCriteria.abstract';
import { CertificateSettingCriteria, CertificateSettingsModuleCourseSchedulingDetail, CertificateSettingsModules } from '@scnode_app/types/default/admin/course/certificateSettingsTypes';
// @end

export class CertificateMultipleBaseService implements ICertificateMultipleCriteria {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  public evaluateCriteria(
    stats: Record<string, Record<string, IStudentStats>>,
    module: CertificateSettingsModules
  ): IEvaluateCriteria {
    return {approved: false, percentage: 0}
  }

  public criteriaAccess = (
    criteria: CertificateSettingCriteria,
    module: CertificateSettingsModules
  ): boolean => {
    if (
      typeof module?.courseSchedulingDetail === 'object' &&
      module?.courseSchedulingDetail?.course?.moodle_id &&
      module[criteria]?.status === true
    ) {
      return true
    }
    return false;
  }

  public getStatsByModule = (
    stats: Record<string, Record<string, IStudentStats>>,
    courseScheduling: CertificateSettingsModuleCourseSchedulingDetail
  ) => {
    return stats[courseScheduling?.course?.moodle_id.toString()] || {};
  }
}
