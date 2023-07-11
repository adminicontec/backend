// @import types
// @end

import { bool } from "aws-sdk/clients/signer";

// @add your types
export interface IMoodleCourseQuery {
  courseID?: string,       // ID de curso (listado de cursos en Moodle)
  shortName?: string,      // Nombre corto de curso (listado de cursos en Moodle)
  fullName?: string,      // Nombre corto de curso (listado de cursos en Moodle)
  displayName?: string,      // Nombre corto de curso (listado de cursos en Moodle)
  idNumber?: string,
  categoryId?: number,
  id?: string             // Identificador del curso en Moodle
}
export interface IMoodleCourseModuleQuery {
  courseID?: string,       // ID de curso (listado de cursos en Moodle)
  moduleType?: Array<string>,
  id?: string             // Identificador del curso en Moodle
}

export interface IMoodleCourse{
  id?: string             // Identificador del curso en Moodle
  idNumber?: string,      // optional ID Course
  shortName?: string,      // Nombre corto de curso (listado de cursos en Moodle)
  fullName?: string,       // Nombre completo de curso (listado de cursos en Moodle)
  displayName?: string,   // Nombre para mostrar de curso (listado de cursos en Moodle)
  categoryId?: number | string,
  summary?: string,        // Descripción del curso. Debe incluir listo de módulos
  startDate?: number | string,
  endDate?: number | string,
  lang?: string,
  masterId?:number | string,
  customClassHours?: string,
  city?: string,
  country?: string,
  visible?:number,
  status?:string
}

export interface IMoodleCourseContent{
  id: number
  sectionid: number
  sectionname: string
  instance: number
  modname: string
  isauditorquiz: boolean
  name: string
  visible: string
  uservisible: string
  completion: number
}

export interface IMoodleForumDiscussion{
  id: number
  name: string
  timemodified: number
  usermodified: number
  timestart: number
  timeend: number
}

export interface IMoodleCheckCourseHasAuditorExam {
  programMoodleId: string; // MoodleID de el CourseScheduling
  sectionMoodleId?: string; // MoodleId de el CourseSchedulingDetails::course -> CourseSchedulingSection
}

export interface IMoodleCheckCourseHasAuditorExamResponse {
  hasExam: boolean,
  exam?: {
    sectionId: number;
  }
}
//@end
