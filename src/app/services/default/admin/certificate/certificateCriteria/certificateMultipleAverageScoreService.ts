// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
// @end

// @import models
// @end

// @import types
import { IStudentStats, StudentStats } from '@scnode_app/types/default/admin/certificate/certificateMultipleTypes';
import { IEvaluateCriteria } from './certificateMultipleCriteria.abstract';
import { CertificateSettingCriteria, CertificateSettingsModuleCourseSchedulingDetail, CertificateSettingsModules } from '@scnode_app/types/default/admin/course/certificateSettingsTypes';
import { CertificateMultipleBaseService } from './certificateMultipleCriteriaBaseService';
// @end

interface ComplementData {
  average: number;
  totalItems: number;
  list: number[]
}

export class CertificateMultipleAverageScoreService extends CertificateMultipleBaseService {

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
    if (this.criteriaAccess(CertificateSettingCriteria.AVERAGE_SCORE, module)) {
      const courseScheduling = module?.courseSchedulingDetail as CertificateSettingsModuleCourseSchedulingDetail
      const statsByModule = this.getStatsByModule(stats, courseScheduling);
      const complement: ComplementData = {
        average: 0,
        totalItems: 0,
        list: []
      }

      for (const key in statsByModule) {
        if (Object.prototype.hasOwnProperty.call(statsByModule, key)) {
          const instance = statsByModule[key];
          this.groupStatsByInstance(instance, StudentStats.EXAM, complement)
          this.groupStatsByInstance(instance, StudentStats.ASSIGN, complement)
        }
      }
      if (complement.totalItems > 0) {
        complement.average /= complement.totalItems
        complement.average = Math.trunc(complement.average)
      }

      const approved = complement.average >= module?.averageScore.percentage
      return {
        approved,
        percentage: complement.average,
        complement
      };
    }
    return {approved: false, percentage: 0}
  }

  private groupStatsByInstance = (instance: IStudentStats, key: StudentStats, complement: ComplementData) => {
    if (instance && instance[key]) {
      instance[key].forEach((item) => {
        complement.totalItems += 1;
        complement.average += item?.graderaw || 0
        complement.list.push(item?.graderaw || 0);
      })
    }
  }
}
