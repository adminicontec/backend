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

export interface IActivitiesSummaryResponse {
  schedulingMode: string,
  totalAdvance?: string,
  finalGrade: string,
  programFinalState: string,
  certificateIssueState: string,
  auditor: boolean,
  auditorGrade: number,
  notes: Array<unknown>,
  finalNote?: string | number,
  emissionCertificate: {
    label: string,
  },
  certification: {
    type?: string | number,
    label?: string | number,
    exam?: string | number,
    status: {
      generated: boolean,
      label: string
    }
  },
  auditorCertification: {
    type?: string | number,
    label?: string | number,
    exam?: string | number,
    status: {
      generated: boolean,
      label: string
    }
  },
  attendance?: number,
  attendanceInformation?: {
    total: number
    attended: number
    percentage: number
  }
  activities?: string | number
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
  sectionid: string,
  hasExam: boolean,
  instanceid: string,
  examnName: string,
  moduleName: string,
  numberOfQuestions: number
}
//@end
