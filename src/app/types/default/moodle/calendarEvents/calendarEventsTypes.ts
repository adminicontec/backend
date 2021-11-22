// @import types
// @end

// @add your types

export interface IMoodleCalendarEventsQuery {
  courseID?: string,      // ID de curso (listado de cursos en Moodle)
  userID?:string, // ID de estudiante en Moodle
  timeStart?: string,     // fecha inicial
  timeEnd?: string,        // fecha final
}
//@end
