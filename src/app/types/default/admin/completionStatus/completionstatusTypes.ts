// @import types
// @end

// @add your types
export interface ICompletionStatus {
  courseID: number, // ID de curso
  course: string   // Nombre corto del curso
}
export interface ICompletionStatusQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
}
//@end
