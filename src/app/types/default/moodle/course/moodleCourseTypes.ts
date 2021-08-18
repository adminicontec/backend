// @import types
// @end

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

export interface IMoodleCourse{
  id?: string             // Identificador del curso en Moodle
  idNumber?: string,      // optional ID Course
  shortName: string,      // Nombre corto de curso (listado de cursos en Moodle)
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
}
//@end
