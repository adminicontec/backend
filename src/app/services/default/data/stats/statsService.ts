// @import_dependencies_node Import libraries
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

          console.log("----------------");
          console.log("FIni:  " + session.startDate);
          console.log("# Sesiones:  " + session.number_of_sessions);
          console.log("# horas: " + session.duration_formated);
        }

        return respScheduledSessions.schedulings.reduce((acc, obj) => {
          const property = obj[key];
          acc[property] = acc[property] || [];
          acc[property].push(obj);
          return acc;
        }, {});

      }

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          stats: respScheduledSessions.schedulings
        }
      });

    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }
}


export const statsService = new StatsService();
export { StatsService as DefaultDataStatsStatsService };
