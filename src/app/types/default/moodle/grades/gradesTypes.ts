// @import types
// @end

// @add your types
export interface IMoodleGradesQuery {
  courseID?: string,    // ID de curso (listado de cursos en Moodle)
  userID?: string,       // ID de estudiante en Moodle
  filter?: string[]
}

export interface ISingleGrade {
  id: number,
  idnumber: string, // here contents the "auditor" condition for quiz
  name: string,
  itemtype: string,
  itemmodule: string,
  iteminstance: number,
  cmid: number,
  graderaw: number,
  grademin: number,
  grademax: number
}
//@end
