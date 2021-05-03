// @import types
// @end

// @add your types
export interface IMoodleCourse{
  courseID?: string,       // ID de curso (listado de cursos en Moodle)
  shortName?: string,      // Nombre corto de curso (listado de cursos en Moodle)
  fullName?: string,      // Nombre corto de curso (listado de cursos en Moodle)
  displayName?: string,      // Nombre corto de curso (listado de cursos en Moodle)
  idNumber?: string,
  id?: string             // Identificador del curso en Moodle
}

export interface IMoodleCourseQuery{
  courseID?: string,       // ID de curso (listado de cursos en Moodle)
  shortName?: string,      // Nombre corto de curso (listado de cursos en Moodle)
  fullName?: string,      // Nombre corto de curso (listado de cursos en Moodle)
  displayName?: string,      // Nombre corto de curso (listado de cursos en Moodle)
  idNumber?: string,
  id?: string             // Identificador del curso en Moodle
}
//@end
