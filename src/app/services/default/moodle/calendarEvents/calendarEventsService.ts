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
        name: "",
        description: "",
        courseid: 0,
        modulename: "",
        instance: 0,
        eventtype: "",
        timestart: "",
        duration: 0,
        durationFormated: "",
        //timemodified: ""
      }

      var courseID;
      let startDate;
      let endDate;

      // take any of params as Moodle query filter
      if (params.courseID && params.timeStart && params.timeEnd) {
        courseID = params.courseID;
        startDate = generalUtility.unixTime(params.timeStart);
        endDate = generalUtility.unixTime(params.timeEnd);
      }
      else {
        return responseUtility.buildResponseFailed('json', null,
          {
            error_key: {
              key: 'moodle_events.message.invalid'
            }
          });
      }
      // 2. Validación si hay eventos asociados al curso en moodle
      let moodleParams = {
        wstoken: moodle_setup.wstoken,
        wsfunction: moodle_setup.services.calendarEvents.get,
        moodlewsrestformat: moodle_setup.restformat,
        'events[courseids][0]': courseID,
        'options[timestart]': startDate,
        'options[timeend]': endDate,
      };

      let respMoodle = await queryUtility.query({ method: 'get', url: '', api: 'moodle', params: moodleParams });
      if (respMoodle.exception) {
        console.log("Moodle: ERROR." + JSON.stringify(respMoodle));
        return responseUtility.buildResponseFailed('json', null,
          {
            error_key: {
              key: 'moodle_events.not_found',
              params: { respMoodle }
            }
          });
      }

      var select = ['assign', 'attendance', 'quiz'];
      let respMoodleCourseModules: any = await courseContentService.moduleList({ courseID: courseID, moduleType: select });

      console.log("Course Modules by type:");

      // time convertion from EPOCH time to UTC time
      respMoodle.events.forEach(moodleEvent => {
        var evTime = new Date(moodleEvent.timestart * 1000).toISOString();
        //moodleEvent.timestart = evTime;
        // var modTime = new Date(moodleEvent.timemodified * 1000).toISOString();
        // moodleEvent.timemodified = modTime;

        // console.log("--> from Moodle: ");
        // console.log(eventTime);

        // Ignore every event named "attendance"
        // if (eventTime.modulename != "attendance" ) {
        var moduleName = moodleEvent.modulename;
        var description = moodleEvent.description;

        if (moodleEvent.modulename == null && moodleEvent.description.includes('webex')) {
          moduleName = 'webex';

          var regex = /( |<([^>]+)>)/ig;
          description = moodleEvent.description.replace(regex, "").replace('\n', "");
        }

        singleEvent = {
          id: moodleEvent.id,
          name: moodleEvent.name,
          description: description,
          courseid: moodleEvent.courseid,
          modulename: moduleName,
          eventtype: moodleEvent.eventype,
          instance: moodleEvent.instance,
          timestart: evTime,
          duration: moodleEvent.timeduration / 3600,
          durationFormated: generalUtility.getDurationFormated(moodleEvent.timeduration)
          //timemodified: modTime
        };
        responseEvents.push(singleEvent);
      });

      if (respMoodleCourseModules.status == 'success') {
        //console.log(respMoodleCourseModules.courseModules);

          respMoodleCourseModules.courseModules.forEach(element => {

          singleEvent = {
            id: element.id,
            name: element.name,
            description: '',
            courseid: courseID,
            modulename: element.modname,
            eventtype: '',
            instance: element.instance,
            timestart: '',
            duration: 0,
            durationFormated: ''
          };
          responseEvents.push(singleEvent);
        });

      }

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          events: responseEvents, //respMoodle.events,
        }
      })



    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }
}

export const calendarEventsService = new CalendarEventsService();
export { CalendarEventsService as DefaultMoodleCalendarEventsCalendarEventsService };
