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

        for (let course of respScheduledSessions.schedulings) {

          for (let session of course.sessions) {

            reducedTeacherScheduling.push({
              course_scheduling: course.course_scheduling,
              course: course.course,
              startDate: course.startDate,
              number_of_sessions: course.number_of_sessions,
              duration: course.duration,
              duration_formated: course.duration_formated,
              session: {
                startDate: session.startDate.toISOString().split('T')[0],
                duration: session.duration / 3600
              }
            });
          }
        }

        // group By Date ()
        const groups = reducedTeacherScheduling.reduce(function (r, o) {
          let statGroup = [];
          var ym = o.session.startDate.substring(0, 7);
          // let data: any = {
          //   number_of_sessions: o.number_of_sessions,
          //   duration: o.session.duration,
          // };

          if (!r[ym]) {
            r[ym] = { label: ym, data: 0 }
            statGroup.push(  r[ym] );
          }
          /*else {
            r[ym].data.push(data);
          }*/
          r[ym].data += o.session.duration;
          return statGroup;
        }, {});
        stats.push(groups);
      }

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          stats: stats //, //reducedTeacherScheduling
          //teacherScheduling: reducedTeacherScheduling
        }
      });

    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }
}


export const statsService = new StatsService();
export { StatsService as DefaultDataStatsStatsService };
