// @import types
// @end

// @add your types
export interface ICourse {
  name: string, // Nombre del curso
  description: string //
  startDate: string // fecha de inicio
  endDate: string // fecha de finalizacin
  id?: string // Identificador del curso
}

export interface ICourseQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
}

export interface ICourseDelete {
  id: string // Identificador del pais
}
//@end
