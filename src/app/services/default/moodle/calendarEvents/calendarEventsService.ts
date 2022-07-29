// @import_dependencies_node Import libraries
import moment from 'moment'
// @end

// @import services
import { courseContentService } from '@scnode_app/services/default/moodle/course/courseContentService'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { moodle_setup } from '@scnode_core/config/globals';
import { queryUtility } from '@scnode_core/utilities/queryUtility';
// @end

// @import models
// @end

// @import types
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes'
import { IMoodleCourse, IMoodleCourseQuery } from '@scnode_app/types/default/moodle/course/moodleCourseTypes'
import { generalUtility } from '@scnode_core/utilities/generalUtility';
import { IMoodleCalendarEventsQuery } from '@scnode_app/types/default/moodle/calendarEvents/calendarEventsTypes';
// @end

class CalendarEventsService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor() { }

  public fetchEvents = async (params: IMoodleCalendarEventsQuery) => {
    try {
      let responseEvents = [];
      let singleEvent = {
        id: 0,
        name: '',
        description: '',
        courseid: 0,
        modulename: '',
        instance: 0,
        eventtype: '',
        timestart: '',
        timefinish: '',
        duration: 0,
        durationFormated: '',
        //timemodified: ""
        status: '',
        timecompleted: ''

      }

      let courseID;
      let startDate;
      let endDate;
      let userID;

      const today = moment();

      // take any of params as Moodle query filter
      if (params.courseID) {
        courseID = params.courseID;
        userID = params.userID;
      }
      else {
        return responseUtility.buildResponseFailed('json', null,
          {
            error_key: {
              key: 'moodle_events.message.invalid'
            }
          });
      }

      let moodleParams = {
        wstoken: moodle_setup.wstoken,
        wsfunction: moodle_setup.services.calendarEvents.get,
        moodlewsrestformat: moodle_setup.restformat,
        'events[courseids][0]': courseID
      };

      let moodleParamsActivitiesCompletion = {
        wstoken: moodle_setup.wstoken,
        wsfunction: moodle_setup.services.completion.getActivitiesStatus,
        moodlewsrestformat: moodle_setup.restformat,
        'courseid': courseID,
        'userid': userID
      }

      let moodleParamsAssignement = {
        wstoken: moodle_setup.wstoken,
        wsfunction: moodle_setup.services.calendarEvents.asignment,
        moodlewsrestformat: moodle_setup.restformat,
        'courseids[0]': courseID,
        'includenotenrolledcourses': 1
      };

      // 1. módulos asociados al curso en moodle
      var select = ['assign', 'attendance', 'quiz', 'forum'];
      let respMoodleCourseModules: any = await courseContentService.moduleList({ courseID: courseID, moduleType: select });

      // 2. Validación si hay eventos asociados al curso en moodle
      let respMoodleEvents = await queryUtility.query({ method: 'get', url: '', api: 'moodle', params: moodleParams });
      if (respMoodleEvents.exception) {
        return responseUtility.buildResponseFailed('json', null,
          {
            error_key: 'calendarEvent.exception',
            additional_parameters: {
              process: moodleParams.wsfunction,
              error: respMoodleEvents
            }
          });
      }

      let respMoodleAssignement = await queryUtility.query({ method: 'get', url: '', api: 'moodle', params: moodleParamsAssignement });
      if (respMoodleAssignement.exception) {
        return responseUtility.buildResponseFailed('json', null,
          {
            error_key: 'calendarEvent.exception',
            additional_parameters: {
              process: moodleParams.wsfunction,
              error: respMoodleAssignement
            }
          });
      }

      // 4. Completion status of User Activities
      let respActivitiesCompletion = await queryUtility.query({ method: 'get', url: '', api: 'moodle', params: moodleParamsActivitiesCompletion });
      if (respActivitiesCompletion.exception) {
        return responseUtility.buildResponseFailed('json', null,
          {
            error_key: 'calendarEvent.exception',
            additional_parameters: {
              process: moodleParamsActivitiesCompletion.wsfunction,
              error: respActivitiesCompletion
            }
          });
      }

      // 4. group the events by Instance
      if (respMoodleCourseModules.status == 'success') {
        // Group by Instance
        respMoodleCourseModules.courseModules.forEach(module => {
          let eventTimeStart;
          let eventTimeEnd;
          let timeStart;
          let timeEnd;

          let statusActivity = '';
          let timecompleted;

          const groupByInstance = respMoodleEvents.events.filter(e => e.instance == module.instance);
          if (groupByInstance.length != 0) {

            if (groupByInstance[0].modulename === 'attendance') {
              eventTimeEnd = new Date(groupByInstance[0]?.timestart * 1000).toISOString();
              eventTimeStart = null;
            }
            if (groupByInstance[0].modulename === 'assign') {
              let assignment = respMoodleAssignement.courses[0].assignments.find(t => t.id == module.instance);
              eventTimeStart = assignment.allowsubmissionsfromdate ? generalUtility.unixTimeToString(assignment.allowsubmissionsfromdate) : null;
              eventTimeEnd = new Date(groupByInstance[0]?.timestart * 1000).toISOString();
            }
            if (groupByInstance[0].modulename === 'forum') {
              eventTimeStart = new Date(groupByInstance[0]?.timestart * 1000).toISOString();
              eventTimeEnd = null;
            }
            if (groupByInstance[0].modulename === 'quiz') {
              timeStart = groupByInstance.filter(g => g.eventtype == 'open');
              timeEnd = groupByInstance.filter(g => g.eventtype == 'close');

              eventTimeStart =  timeStart[0] ? new Date(timeStart[0]?.timestart * 1000).toISOString() : null;
              eventTimeEnd = timeEnd[0] ? new Date(timeEnd[0]?.timestart * 1000).toISOString() : null;
            }

            // respActivitiesCompletion
            let completionActivity = respActivitiesCompletion.statuses.find(e => e.instance == module.instance);

            if (completionActivity.timecompleted) {
              statusActivity = 'delivered';
              timecompleted = generalUtility.unixTimeToString(completionActivity.timecompleted);
            }
            else {
              if (today.isBefore(eventTimeStart)) {
                statusActivity = 'not_enabled';
                timecompleted = null;
              }
              else {
                if (today.isBefore(eventTimeEnd)) {
                  statusActivity = 'pending';
                  timecompleted = null;
                }
                else {
                  statusActivity = 'not_delivered';
                  timecompleted = null;
                }
              }
            }

            // Build the answer
            singleEvent = {
              id: module.id,
              name: module.name,
              description: '',
              courseid: courseID,
              modulename: groupByInstance[0].modulename,
              eventtype: '',
              instance: groupByInstance[0].instance,
              timestart: eventTimeStart,
              timefinish: eventTimeEnd,
              duration: 0,
              durationFormated: '',
              status: statusActivity,
              timecompleted: timecompleted
            };
            responseEvents.push(singleEvent);
          }

        });
      }
      else {
        console.log("Moodle: ERROR." + JSON.stringify(respMoodleCourseModules));
        return responseUtility.buildResponseFailed('json', null,
          {
            error_key: {
              key: 'grades.not_found',
              params: { respMoodleCourseModules }
            }
          });
      }

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          events: responseEvents, //respMoodleEvents.events,
        }
      })

    } catch (e) {
      console.log('CalendarEventsService => fetchEvents error: ', e);

      return responseUtility.buildResponseFailed('json', null,
        {
          error_key: 'calendarEvent.exception',
          additional_parameters: {
            process: 'fetchEvents()',
            error: e.message
          }
        });

    }
  }
}

export const calendarEventsService = new CalendarEventsService();
export { CalendarEventsService as DefaultMoodleCalendarEventsCalendarEventsService };
