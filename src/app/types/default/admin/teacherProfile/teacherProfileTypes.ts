// @import types
// @end

// @add your types

export interface ITeacherProfile {
  id?: string             // Identificador del Enrollment
  user?: string // Identificador del usuario en campus
  regional?: string,
  city?: string,
  contractType?: {
    type?: string,
    isTeacher?: boolean,
    isTutor?: boolean
  }
}

export interface ITeacherProfileDelete{
  id: string
}

//@end
