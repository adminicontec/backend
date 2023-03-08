// @import types
// @end

import { IMoodleCourseContent } from "@scnode_app/types/default/moodle/course/moodleCourseTypes"

// @add your types
export enum MoodleEventName {
  ATTENDANCE = 'attendance',
  ASSIGN = 'assign',
  QUIZ = 'quiz',
  FORUM = 'forum',
}

export interface IMoodleCalendarEventsQuery {
  courseID?: string,      // ID de curso (listado de cursos en Moodle)
  userID?:string, // ID de estudiante en Moodle
  timeStart?: string,     // fecha inicial
  timeEnd?: string,        // fecha final
  events?: string[]
}

export interface ICalendarEvent {
  id: number
  name: string
  sectionName?: string
  description: string
  courseid: string
  modulename?: string
  eventtype?: string
  instance?: number
  timestart?: string
  timefinish?: string
  duration?: number
  durationFormated?: string
  status?: string
  timecompleted?: string
  url?: string
}

export interface IProcessAttendanceDataParams {
  courseID: string
  groupByInstance: IMoodleEvent[]
  grades: IMoodleGrade
  module: IMoodleCourseContent
}

export interface IProcessAssignDataParams {
  groupByInstance: IMoodleEvent[]
  respMoodleAssignement: IMoodleAssignment
  userID: string
  module: IMoodleCourseContent
  courseID: string
}

export interface IMoodleGrade {
  courseid: number
  userid: number
  userfullname: string
  useridnumber: string
  maxdepth: number
  gradeitems: IMoodleGradeItem[]
}

export interface IMoodleGradeItem {
  id: number,
  itemname: string,
  itemtype: string,
  itemmodule: string,
  iteminstance: number,
  itemnumber: number,
  idnumber: string,
  categoryid: number,
  outcomeid: number,
  scaleid: number,
  locked: boolean,
  cmid: number,
  graderaw: number,
  gradedatesubmitted: number,
  gradedategraded: number,
  gradehiddenbydate: boolean,
  gradeneedsupdate: boolean,
  gradeishidden: boolean,
  gradeislocked: boolean,
  gradeisoverridden: boolean,
  gradeformatted: string
}

export interface IMoodleEvent {
  id: number,
  name: string,
  description: string,
  format: number,
  courseid: number,
  categoryid: number,
  groupid: number,
  userid: number,
  repeatid: number,
  modulename: MoodleEventName,
  instance: number,
  eventtype: string,
  timestart: number,
  timeduration: number,
  visible: number,
  sequence: number,
  timemodified: number,
  subscriptionid: number
}

export interface IMoodleAssignment {
  courses: IMoodleAssignmentCourse[]
  warnings: any[]
}

export interface IMoodleAssignmentCourse {
  id: number,
  fullname: string,
  shortname: string,
  timemodified: number,
  assignments: any[]
}
//@end
