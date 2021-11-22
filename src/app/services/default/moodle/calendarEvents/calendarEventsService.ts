// @import_dependencies_node Import libraries
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
import { consoleUtility } from '@scnode_core/utilities/consoleUtility';
import { Console } from 'console';
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
        status: true || false,
        timecompleted: ''

      }

      let courseID;
      let startDate;
      let endDate;
      let userID;

      // take any of params as Moodle query filter
      if (params.courseID) {
        courseID = params.courseID;
        userID = params.userID;
        console.log("Eventos para el curso " + courseID + " y usuario " + userID);
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

      // 1. módulos asociados al curso en moodle
      console.log("Course Modules by type:");
      var select = ['assign', 'attendance', 'quiz', 'forum'];
      let respMoodleCourseModules: any = await courseContentService.moduleList({ courseID: courseID, moduleType: select });

      // 2. Validación si hay eventos asociados al curso en moodle
      let respMoodleEvents = await queryUtility.query({ method: 'get', url: '', api: 'moodle', params: moodleParams });
      if (respMoodleEvents.exception) {
        console.log("Moodle: ERROR." + JSON.stringify(respMoodleEvents));
        return responseUtility.buildResponseFailed('json', null,
          {
            error_key: {
              key: 'moodle_events.not_found',
              params: { respMoodleEvents }
            }
          });
      }

      // 3. Completion status of User Activities
      let respActivitiesCompletion = await queryUtility.query({ method: 'get', url: '', api: 'moodle', params: moodleParamsActivitiesCompletion });
      if (respActivitiesCompletion.exception) {
        console.log("Moodle: ERROR on moodleParamsActivitiesCompletion request." + JSON.stringify(respActivitiesCompletion));
        return responseUtility.buildResponseFailed('json', null,
          {
            error_key: {
              key: 'moodle_events.not_found',
              params: { respActivitiesCompletion }
            }
          });
      }

      // 4. group the events by Instance
      if (respMoodleCourseModules.status == 'success') {
        // Group by Instance
        respMoodleCourseModules.courseModules.forEach(module => {
          let eventTime;
          let timeDue;
          let timeStart;
          let timeEnd;

          let statusActivity = false;
          let timecompleted;

          console.log("---------" + module.instance + "------------");
          const groupByInstance = respMoodleEvents.events.filter(e => e.instance == module.instance);
          console.log(module.name);
          if (groupByInstance.length != 0) {

            if (groupByInstance[0].modulename === 'assign') {
              eventTime = new Date(groupByInstance[0].timestart * 1000).toISOString();
              console.log("timeDue for assign: ");
              console.log(eventTime);

            }
            if (groupByInstance[0].modulename === 'forum') {
              eventTime = new Date(groupByInstance[0].timestart * 1000).toISOString();
              console.log("timeDue: ");
              console.log(eventTime);
            }
            if (groupByInstance[0].modulename === 'quiz') {
              timeStart = groupByInstance.filter(g => g.eventtype == 'open');
              timeEnd = groupByInstance.filter(g => g.eventtype == 'close');

              eventTime = new Date(timeStart[0].timestart * 1000).toISOString();
              console.log("timeStart: ");
              console.log(eventTime);

              eventTime = new Date(timeEnd[0].timestart * 1000).toISOString();
              console.log("timeEnd: ");
              console.log(eventTime);
            }
            // respActivitiesCompletion
            let completionActivity = respActivitiesCompletion.statuses.find(e => e.instance == module.instance);
            //console.log("Status " + statusActivity);
            statusActivity = (completionActivity.state === 1) ? true : false;
            if (completionActivity.state === 1) {
              timecompleted = generalUtility.unixTimeToString(completionActivity.timecompleted);
              console.log("Complete on " + timecompleted);
            }
            else {
              console.log("Pending !!!");
              timecompleted = null;
            }

            console.log("=============================================");

            // Build the answer
            singleEvent = {
              id: module.id,
              name: module.name,
              description: '',
              courseid: courseID,
              modulename: groupByInstance[0].modulename,
              eventtype: '',
              instance: groupByInstance[0].instance,
              timestart: eventTime,
              timefinish: '',
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
              key: 'moodle_events.not_found',
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
      return responseUtility.buildResponseFailed('json')
    }
  }
}

export const calendarEventsService = new CalendarEventsService();
export { CalendarEventsService as DefaultMoodleCalendarEventsCalendarEventsService };
