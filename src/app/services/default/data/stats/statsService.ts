// @import_dependencies_node Import libraries
import moment from 'moment';
// @end

// @import services
import { courseSchedulingDetailsService } from '@scnode_app/services/default/admin/course/courseSchedulingDetailsService'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
// @end

// @import types
import { IStatsScheduledHoursQuery } from '@scnode_app/types/default/data/stats/statsTypes'
import { mapUtility } from '../../../../../core/utilities/mapUtility';
// @end

class StatsService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor() { }


  public statsHours = async (params: IStatsScheduledHoursQuery = {}) => {
    let stats = [];
    let reducedTeacherScheduling = [];
    try {
      console.log("Stats for programmed hours:")
      console.log(params);

      const respScheduledSessions: any = await courseSchedulingDetailsService.list({
        teacher: params.teacher
      });

      if (respScheduledSessions.status == 'error') {
        console.log(respScheduledSessions.message);
        return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'course_scheduling.details.not_found' } });
      }

      if (respScheduledSessions.schedulings && respScheduledSessions.schedulings.length > 0) {

        respScheduledSessions.schedulings.sort((a, b) => a.startDate.localeCompare(b.startDate));

        for (let session of respScheduledSessions.schedulings) {

          reducedTeacherScheduling.push({
            startDate: session.startDate,
            number_of_sessions: session.number_of_sessions,
            duration: session.duration,
            duration_formated: session.duration_formated
          });
        }

        const groups = reducedTeacherScheduling.reduce(function (r, o) {
          var ym = o.startDate.substring(0, 7);
          //(r[ym]) ? r[ym].data.push(o) : r[ym] = { group: ym, data: [o] };

          let data: any = {
            number_of_sessions: o.number_of_sessions,
            duration: o.duration,
            duration_formated: o.duration_formated
          };
          (r[ym]) ? r[ym].data.push(data) : r[ym] = { group: ym, data: [data] };
          return r;
        }, {});
        stats.push(groups);
      }

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          stats: stats//respScheduledSessions.schedulings
        }
      });

    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }
}


export const statsService = new StatsService();
export { StatsService as DefaultDataStatsStatsService };
