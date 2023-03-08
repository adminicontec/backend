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
import { CourseScheduling } from '@scnode_app/models';
// @end

// @import types
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes'
import { IMoodleCourse, IMoodleCourseContent, IMoodleCourseQuery, IMoodleForumDiscussion } from '@scnode_app/types/default/moodle/course/moodleCourseTypes'
import { generalUtility } from '@scnode_core/utilities/generalUtility';
import { ICalendarEvent, IMoodleCalendarEventsQuery, IMoodleEvent, IProcessAssignDataParams, IProcessAttendanceDataParams, IProcessForumDataParams, IProcessQuizDataParams, MoodleEventName } from '@scnode_app/types/default/moodle/calendarEvents/calendarEventsTypes';
// @end

class CalendarEventsService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor() { }

  public fetchOnlyEvents = async (params: {courseID: string}) => {
    try {

      let courseID = params.courseID || undefined
      if (!courseID) {
        return responseUtility.buildResponseFailed('json', null, {
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

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          events: respMoodleEvents.events,
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

  public fetchEvents = async (params: IMoodleCalendarEventsQuery) => {
    try {
      let responseEvents = [];

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

      let moodleParamsForum = {
        wstoken: moodle_setup.wstoken,
        wsfunction: moodle_setup.services.completion.forumDiscussion,
        moodlewsrestformat: moodle_setup.restformat,
      }

      let moodleParamsGrades = {
        wstoken: moodle_setup.wstoken,
        wsfunction: moodle_setup.services.completion.gradeReport,
        moodlewsrestformat: moodle_setup.restformat,
        'courseid': courseID,
        'userid': userID,
      };

      const courseScheduling = await CourseScheduling.findOne({
        moodle_id: params.courseID
      }).select('id startDate')
      .lean()

      // 1. módulos asociados al curso en moodle
      let select = ['assign', 'attendance', 'quiz', 'forum'];
      if (params.events) select = params.events
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

      let respGrades = await queryUtility.query({ method: 'get', url: '', api: 'moodle', params: moodleParamsGrades });
      const grades = respGrades?.usergrades && respGrades.usergrades[0] ? respGrades.usergrades[0] : undefined
      // console.log('grades', grades)
      // 4. group the events by Instance
      if (respMoodleCourseModules.status == 'success') {
        // Group by Instance
        for await (const module of respMoodleCourseModules.courseModules as IMoodleCourseContent[]) {
          let eventTimeStart;
          let eventTimeEnd;
          let customStatus = false;

          let statusActivity = '';
          let timecompleted;

          let isForum: boolean = false;

          let groupByInstance: IMoodleEvent[];

          if (module.modname === 'forum' && module.completion === 2) {
            const respForumDiscussions: {discussions: IMoodleForumDiscussion[]} = await queryUtility.query({ method: 'get', url: '', api: 'moodle', params: {...moodleParamsForum, forumid: module.instance} });
            if (respForumDiscussions?.discussions) {
              const forumDiscussion = respForumDiscussions?.discussions?.length ? respForumDiscussions.discussions[0] : null
              eventTimeStart = forumDiscussion?.timestart ? new Date(forumDiscussion.timestart * 1000).toISOString() : null
              eventTimeEnd = forumDiscussion?.timeend ? new Date(forumDiscussion.timeend * 1000).toISOString() : null
              isForum = true;
              groupByInstance = []
            }
          } else {
            groupByInstance = respMoodleEvents.events.filter(e => e.instance == module.instance);
          }
          if (groupByInstance?.length > 0 || isForum) {

            if (groupByInstance[0]?.modulename === MoodleEventName.ATTENDANCE) {
              const result = this.processAttendanceData({
                courseID,
                groupByInstance,
                grades,
                module,
              })
              responseEvents.push(result)
              continue
            }

            if (groupByInstance[0]?.modulename === MoodleEventName.ASSIGN) {
              const result = await this.processAssignData({
                groupByInstance,
                module,
                respMoodleAssignement,
                userID,
                courseID,
                grades,
              })
              responseEvents.push(result)
              continue
            }

            if (groupByInstance[0]?.modulename === MoodleEventName.QUIZ) {
              const result = this.processQuizData({
                courseID,
                grades,
                groupByInstance,
                module,
              })
              responseEvents.push(result)
              continue
            }

            if (isForum && module.modname === MoodleEventName.FORUM) {
              const result = this.processForumData({
                courseID,
                grades,
                module,
                eventTimeEnd,
                eventTimeStart,
              })
              responseEvents.push(result)
              continue
            }

            if (customStatus === false) {
              let completionActivity = respActivitiesCompletion.statuses.find(e => e.instance == module.instance);

              if (completionActivity?.timecompleted) {
                statusActivity = 'delivered';
                timecompleted = generalUtility.unixTimeToString(completionActivity.timecompleted);
              }
              else {
                let statusByDate = this.getStatusActivityByDate(eventTimeStart, eventTimeEnd)
                statusActivity = statusByDate.statusActivity
                timecompleted = statusByDate.timecompleted;
              }
            }

            const singleEvent: ICalendarEvent = {
              id: module.id,
              name: module.name,
              sectionName: module.sectionname,
              description: '',
              courseid: courseID,
              modulename: isForum ? module.modname : groupByInstance[0]?.modulename,
              eventtype: '',
              instance: isForum ? module.instance : groupByInstance[0]?.instance,
              timestart: eventTimeStart,
              timefinish: eventTimeEnd,
              duration: 0,
              durationFormated: '',
              status: statusActivity,
              timecompleted: timecompleted,
              url: undefined,
              activityType: module.modname,
            };

            responseEvents.push(singleEvent);
          }
        }
      } else {
        console.log("Moodle: ERROR." + JSON.stringify(respMoodleCourseModules));
        return responseUtility.buildResponseFailed('json', null,
          {
            error_key: {
              key: 'grades.not_found',
              params: { respMoodleCourseModules }
            }
          });
      }

      if (select.includes('session') && respMoodleEvents?.events) {
        const sessionsData = this.getSessionsData({
          courseID,
          courseScheduling,
          respMoodleCourseModules,
          respMoodleEvents,
        })
        responseEvents = [...responseEvents, ...sessionsData]
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

  private getStatusActivityByDate = (eventTimeStart, eventTimeEnd, forceDelivered: boolean = false) => {
    let statusActivity = undefined;
    let timecompleted = undefined;
    const today = moment();
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
        if (forceDelivered) {
          statusActivity = 'delivered';
        }
      }
    }
    return {
      statusActivity,
      timecompleted
    }
  }

  private getSessionsData = ({ courseID, courseScheduling, respMoodleCourseModules, respMoodleEvents }): ICalendarEvent[] => {
    const startServiceDate = moment(moment(courseScheduling.startDate).format('YYYY-MM-DD'))
    const urlWebex = respMoodleCourseModules?.courseModules.find(field => field.modname === 'session')
    const responseEvents: ICalendarEvent[] = []
    for (const event of respMoodleEvents.events) {
      if (event?.modulename === null) {
        let eventTimeStart = event?.timestart ? generalUtility.unixTimeToString(event.timestart) : null;
        let eventTimeEnd = (eventTimeStart && event?.timeduration) ? moment(eventTimeStart).add(event?.timeduration, 'seconds').toISOString() : null;

        if (!moment.utc(moment(eventTimeStart).format('YYYY-MM-DD 00:00:00')).isSameOrAfter(startServiceDate)) continue;

        let statusByDate = this.getStatusActivityByDate(eventTimeStart, eventTimeEnd, true)
        let statusActivity = statusByDate.statusActivity
        let timecompleted = statusByDate.timecompleted;


        let description;

        if (event?.description) {
          const today = moment.utc();
          if (eventTimeStart && eventTimeEnd) {
            const timeStartMoment = moment.utc(moment(eventTimeStart).format('YYYY-MM-DD 00:00:00'))
            const timeEndMoment = moment.utc(moment(eventTimeEnd).format('YYYY-MM-DD 23:59:59'))
            if (today.isSameOrAfter(timeStartMoment) && today.isSameOrBefore(timeEndMoment)) {
              description = event?.description
            }
          }
          else if (eventTimeStart) {}
          else if (eventTimeEnd) {}
        }

        let singleEvent: ICalendarEvent = {
          id: event.id,
          name: event?.name,
          description,
          courseid: courseID,
          eventtype: 'webex',
          timestart: eventTimeStart,
          timefinish: eventTimeEnd,
          duration: 0,
          durationFormated: '',
          status: statusActivity,
          timecompleted: timecompleted,
          url: urlWebex ? urlWebex?.url : undefined,
          activityType: 'webex',
          sectionName: event.name,
        };

        responseEvents.push(singleEvent);
      }
    }

    return responseEvents
  }

  private processAttendanceData = ({
    courseID,
    groupByInstance,
    grades,
    module,
  }: IProcessAttendanceDataParams): ICalendarEvent => {
    let eventTimeEnd = new Date(groupByInstance[0]?.timestart * 1000).toISOString();
    let eventTimeStart = null;

    let statusByDate = this.getStatusActivityByDate(eventTimeStart, eventTimeEnd)
    let statusActivity = statusByDate.statusActivity
    let timecompleted = statusByDate.timecompleted;
    let qualification

    if (grades?.gradeitems) {
      const index = grades?.gradeitems.findIndex((i) => i.iteminstance == module.instance)
      if (index !== -1) {
        const item = grades?.gradeitems[index];
        qualification = item?.graderaw ? item.graderaw : undefined
        if (item?.graderaw >= 75) {
          statusActivity = 'delivered';
          timecompleted = generalUtility.unixTimeToString(item?.gradedategraded || 0);
        }
      }
    }

    return {
      id: module.id,
      name: module.name,
      sectionName: module.sectionname,
      description: '',
      courseid: courseID,
      modulename: groupByInstance[0]?.modulename,
      eventtype: '',
      instance: groupByInstance[0]?.instance,
      timestart: eventTimeStart,
      timefinish: eventTimeEnd,
      duration: 0,
      durationFormated: '',
      status: statusActivity,
      timecompleted: timecompleted,
      activityType: module.modname,
      qualification,
    }
  }

  private processAssignData = async ({
    groupByInstance,
    respMoodleAssignement,
    userID,
    module,
    courseID,
    grades,
  }: IProcessAssignDataParams): Promise<ICalendarEvent> => {
    let assignment = respMoodleAssignement.courses[0].assignments.find(t => t.id == module.instance);
    let eventTimeStart = assignment.allowsubmissionsfromdate ? generalUtility.unixTimeToString(assignment.allowsubmissionsfromdate) : null;
    let eventTimeEnd = new Date(groupByInstance[0]?.timestart * 1000).toISOString();

    let statusByDate = this.getStatusActivityByDate(eventTimeStart, eventTimeEnd)
    let statusActivity = statusByDate.statusActivity
    let timecompleted = statusByDate.timecompleted;
    let qualification

    try {
      const moodleParamsAssignGetSumission = {
        wstoken: moodle_setup.wstoken,
        wsfunction: moodle_setup.services.calendarEvents.assignGetSubmissionStatus,
        moodlewsrestformat: moodle_setup.restformat,
        'userid': userID,
        'assignid': module.instance
      };
      const responseMoodleParamsAssignGetSumission = await queryUtility.query({ method: 'get', url: '', api: 'moodle', params: moodleParamsAssignGetSumission });
      if (responseMoodleParamsAssignGetSumission?.lastattempt) {
        const attempt = responseMoodleParamsAssignGetSumission?.lastattempt;
        if (attempt?.submission?.status === 'submitted') {
          statusActivity = 'delivered';
          timecompleted = generalUtility.unixTimeToString(attempt?.submission?.timecreated || 0);
          const itemGrade = grades?.gradeitems?.find((i) => i.iteminstance == module.instance)
          if (!!itemGrade) {
            qualification = itemGrade.graderaw
          }
        }
      }
    } catch (err) {}

    return {
      id: module.id,
      name: module.name,
      sectionName: module.sectionname,
      description: '',
      courseid: courseID,
      modulename: groupByInstance[0]?.modulename,
      eventtype: '',
      instance: groupByInstance[0]?.instance,
      timestart: eventTimeStart,
      timefinish: eventTimeEnd,
      duration: 0,
      durationFormated: '',
      status: statusActivity,
      timecompleted: timecompleted,
      activityType: module.modname,
      qualification,
    }
  }

  private processQuizData = ({
    courseID,
    groupByInstance,
    grades,
    module,
  }: IProcessQuizDataParams): ICalendarEvent => {
    let timeStart = groupByInstance.filter(g => g.eventtype == 'open');
    let timeEnd = groupByInstance.filter(g => g.eventtype == 'close');

    let eventTimeStart =  timeStart[0] ? new Date(timeStart[0]?.timestart * 1000).toISOString() : null;
    let eventTimeEnd = timeEnd[0] ? new Date(timeEnd[0]?.timestart * 1000).toISOString() : null;

    let statusByDate = this.getStatusActivityByDate(eventTimeStart, eventTimeEnd)
    let statusActivity = statusByDate.statusActivity
    let timecompleted = statusByDate.timecompleted;
    let qualification;


    if (grades?.gradeitems) {
      const index = grades?.gradeitems.findIndex((i) => i.iteminstance == module.instance)
      if (index !== -1) {
        const item = grades?.gradeitems[index];
        if (item?.graderaw !== null && item?.graderaw !== undefined) {
          qualification = item.graderaw
          statusActivity = 'delivered';
          timecompleted = generalUtility.unixTimeToString(item?.gradedategraded || 0);
        }
      }
    }

    return {
      id: module.id,
      name: module.name,
      sectionName: module.sectionname,
      description: '',
      courseid: courseID,
      modulename: groupByInstance[0]?.modulename,
      eventtype: '',
      instance: groupByInstance[0]?.instance,
      timestart: eventTimeStart,
      timefinish: eventTimeEnd,
      duration: 0,
      durationFormated: '',
      status: statusActivity,
      timecompleted: timecompleted,
      activityType: module.modname,
      qualification,
    }
  }

  private processForumData = ({
    courseID,
    eventTimeEnd,
    eventTimeStart,
    grades,
    module,
  }: IProcessForumDataParams): ICalendarEvent => {
    let statusByDate = this.getStatusActivityByDate(eventTimeStart, eventTimeEnd)
    let statusActivity = statusByDate.statusActivity
    let timecompleted = statusByDate.timecompleted;
    let qualification

    if (grades?.gradeitems) {
      const index = grades?.gradeitems.findIndex((i) => i.iteminstance == module.instance)
      if (index !== -1) {
        const item = grades?.gradeitems[index];
        if (item?.graderaw !== null && item?.graderaw !== undefined) {
          statusActivity = 'delivered';
          qualification = item.graderaw
          timecompleted = generalUtility.unixTimeToString(item?.gradedategraded || 0);
        }
      }
    }

    return {
      id: module.id,
      name: module.name,
      sectionName: module.sectionname,
      description: '',
      courseid: courseID,
      modulename: module.modname,
      eventtype: '',
      instance: module.instance,
      timestart: eventTimeStart,
      timefinish: eventTimeEnd,
      duration: 0,
      durationFormated: '',
      status: statusActivity,
      timecompleted: timecompleted,
      activityType: module.modname,
      qualification,
    }
  }
}

export const calendarEventsService = new CalendarEventsService();
export { CalendarEventsService as DefaultMoodleCalendarEventsCalendarEventsService };
