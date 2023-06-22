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
import { IEvaluateCriteria } from './certificateMultipleCriteria.abstract';
import { CertificateSettingCriteria, CertificateSettingsModuleCourseSchedulingDetail, CertificateSettingsModules } from '@scnode_app/types/default/admin/course/certificateSettingsTypes';
import { CertificateMultipleBaseService } from './certificateMultipleCriteriaBaseService';
// @end

export class CertificateMultipleAttendanceService extends CertificateMultipleBaseService {

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
    if (this.criteriaAccess(CertificateSettingCriteria.ATTENDANCE, module)) {
        const courseScheduling = module?.courseSchedulingDetail as CertificateSettingsModuleCourseSchedulingDetail
        const statsByModule = this.getStatsByModule(stats, courseScheduling);

        const complement = {
          average: 0,
          totalItems: 0,
          itemsApproved: 0,
          list: []
        }

        for (const key in statsByModule) {
          if (Object.prototype.hasOwnProperty.call(statsByModule, key)) {
            const instance = statsByModule[key];
            if (instance?.attendance) {
              instance.attendance.forEach((attendance) => {
                if (attendance?.graderaw >= module?.attendance.percentage) {
                  complement.itemsApproved += 1;
                }
                complement.average += attendance?.graderaw || 0;
                complement.totalItems += 1;
                complement.list.push(attendance?.graderaw || 0)
              })
            }
          }
        }
        if (complement.totalItems > 0) {
          complement.average = Math.round(complement.average / complement.totalItems)
        }

        const approved = complement.itemsApproved === complement.totalItems
        return {
          approved,
          percentage: complement.average,
          complement
        };
    }
    return {approved: false, percentage: 0}
  }
}
