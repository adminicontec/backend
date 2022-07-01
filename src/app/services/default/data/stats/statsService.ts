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


  /**
   * Stats hours service
   * Permite consultar las horas ejecutadas por un docente en el año actual
   */
  public statsHours = async (params: IStatsScheduledHoursQuery = {}) => {
    let stats;
    let report = { labels: [], data: [] };
    let reducedTeacherScheduling = [];
    let today = moment();
    let currentYear = moment().year();
    try {
      console.log("Stats for programmed hours:")
      console.log(params);

      console.log(`Current date: ${today}`);
      console.log(`Current year: ${currentYear}`);

      const respScheduledSessions: any = await courseSchedulingDetailsService.list({
        teacher: params.teacher
      });

      if (respScheduledSessions.status == 'error') {
        console.log(respScheduledSessions.message);
        return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'course_scheduling.details.not_found' } });
      }

      if (respScheduledSessions.schedulings && respScheduledSessions.schedulings.length > 0) {

        respScheduledSessions.schedulings.sort((a, b) => a.startDate.localeCompare(b.startDate));


        console.log("******************************************************");
        for (let course of respScheduledSessions.schedulings) {
          // avoid every Service as Virtual Mode and "Canceled" status
          if (course.course_scheduling.schedulingMode.name.toLowerCase() != "virtual") {
            if (course.course_scheduling.schedulingStatus.name != 'Cancelado') {
              for (let session of course.sessions) {

                // avoid every scheduled session below the current date
                // must adjust the Offset to real date record
                let sessionStarDateOffset = moment(session.startDate.toISOString());

                if (sessionStarDateOffset.isBefore(today)) {
                  console.log("========================================================");
                  console.log(`ServiceID: ${course.course_scheduling.metadata.service_id}`);
                  console.log(`course.course_scheduling: ${course.course_scheduling._id}`);
                  console.log("Time session: " + sessionStarDateOffset.local(true).format());

                  reducedTeacherScheduling.push({
                    course_scheduling: course.course_scheduling,
                    course: course.course,
                    startDate: course.startDate,
                    number_of_sessions: course.number_of_sessions,
                    duration: course.duration,
                    duration_formated: course.duration_formated,
                    session: {
                      yearMonth: sessionStarDateOffset.local(true).format().substring(0, 7),
                      startDate: sessionStarDateOffset.local(true).format(),
                      duration: session.duration / 3600
                    }
                  });
                }
              }
            }
          }
        }

        // group By Date ()
        let statGroup = [];
        reducedTeacherScheduling.reduce(function (res, value) {
          if (!res[value.session.yearMonth]) {
            res[value.session.yearMonth] = { label: value.session.yearMonth, data: 0 }
            statGroup.push(res[value.session.yearMonth]);
          }
          res[value.session.yearMonth].data += value.session.duration;
          return res;
        }, {});
        stats = statGroup;

        for (let item of statGroup) {
          report.labels.push(item.label);
          report.data.push(item.data);
        }

      }

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          report: report
          //reducedTeacherScheduling: reducedTeacherScheduling,
          //teacherScheduling: respScheduledSessions
        }
      });

    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }



  public statsCourses = async (params: IStatsScheduledHoursQuery = {}) => {
    let stats;
    let report = { labels: [], data: [] };
    let reducedTeacherScheduling = [];
    try {
      console.log("Stats for programmed courses:")
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
                yearMonth: session.startDate.toISOString().substring(0, 7),
                startDate: session.startDate.toISOString().split('T')[0],
                duration: session.duration / 3600
              }
            });
          }
        }

        // group By Date ()
        let statGroup = [];
        reducedTeacherScheduling.reduce(function (res, value) {
          if (!res[value.session.yearMonth]) {
            res[value.session.yearMonth] = { label: value.session.yearMonth, data: 0 }
            statGroup.push(res[value.session.yearMonth]);
          }
          res[value.session.yearMonth].data += value.session.duration;
          return res;
        }, {});
        stats = statGroup;

        for (let item of statGroup) {
          report.labels.push(item.label);
          report.data.push(item.data);
        }

      }

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          report: report //, //reducedTeacherScheduling
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
