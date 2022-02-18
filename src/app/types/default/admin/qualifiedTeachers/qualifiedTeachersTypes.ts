// @import types
// @end

// @add your types


export interface IQualifiedTeacher{
  index?: number,
  id?: string       // Identificador del registro de QualifiedTeacher
  user?: string     // Identificador del usuario en Campus Digital
  modular?: string  // Identificador del modular en Campus Digital
  courseCode?: string
  status?: string
  courseName?: string
  evaluationDate?: Date
  isEnabled?: boolean
  observations?: string
}

export interface IQualifiedTeacherDelete{
  id: string
}
//@end
