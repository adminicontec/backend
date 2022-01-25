// @import types
// @end

// @add your types
export interface ICompletionStatus {
  courseID: number, // ID de curso
  course: string   // Nombre corto del curso
}

export interface IActivitiesCompletion {
  courseID?: string,  // ID de curso (listado de cursos en Moodle)
  userID?:string,     // ID de estudiante en Moodl
}

export interface ICompletionStatusQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
}
//@end
