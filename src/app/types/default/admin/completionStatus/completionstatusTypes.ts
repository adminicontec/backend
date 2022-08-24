// @import types
// @end

// @add your types
export interface ICompletionStatus {
  courseID: number, // ID de curso
  course: string   // Nombre corto del curso
}

export interface IActivitiesCompletion {
  courseID?: string,  // ID de curso (listado de cursos en Moodle)
  userID?: string,     // ID de estudiante en Moodl
}

export interface IActivitiesSummary {
  courseID?: string,  // ID de curso (listado de cursos en Moodle)
  userMoodleID?: string,     // ID de estudiante en Moodle
  username?: string, // Id de usuario en Campus
  course_scheduling?: string
}

export interface IActivitiesSummary {
  courseID?: string,  // ID de curso (listado de cursos en Moodle)
  userMoodleID?: string,     // ID de estudiante en Moodle
  username?: string, // Id de usuario en Campus
  course_scheduling?: string
}
export interface ICompletionStatusQuery {
  pageNumber?: string, // Numero de pagina
  nPerPage?: string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?: string, // Busca sobre los campos de la coleccion
}

export interface IQuizModuleData {
  hasExam: boolean,
  examnName: string,
  moduleName: string,
  numberOfQuestions: number
}
//@end
