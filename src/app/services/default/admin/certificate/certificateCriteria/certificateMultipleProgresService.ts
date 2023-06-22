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

export class CertificateMultipleProgressService extends CertificateMultipleBaseService {

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
    if (this.criteriaAccess(CertificateSettingCriteria.PROGRESS, module)) {
      const courseScheduling = module?.courseSchedulingDetail as CertificateSettingsModuleCourseSchedulingDetail
      const statsByModule = this.getStatsByModule(stats, courseScheduling);

      const complement = {
        percentage: 0,
        totalItems: 0,
        itemsCompleted: 0,
        list: []
      }
      let percentage = 0;

      for (const key in statsByModule) {
        if (Object.prototype.hasOwnProperty.call(statsByModule, key)) {
          const instance = statsByModule[key];
          if (instance?.progress) {
            instance.progress.forEach((progress) => {
              complement.totalItems += 1;
              if (progress?.state === 1) {
                complement.itemsCompleted += 1;
              }
              complement.list.push(progress.state);
            })
          }
        }
      }
      if (complement.totalItems > 0) {
        const average = complement.itemsCompleted / complement.totalItems
        percentage = Math.trunc(average * 100);
        complement.percentage = percentage;
      }

      const approved = percentage >= module?.progress.percentage
      return {
        approved,
        percentage,
        complement
      };
    }
    return {approved: false, percentage: 0}
  }
}
