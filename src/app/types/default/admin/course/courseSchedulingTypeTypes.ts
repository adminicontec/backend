// @import types
// @end

// @add your types
export interface ICourseSchedulingType {
  name: string, // Nombre del tipo
  description: string // Descripción del tipo
  id?: string // Identificador del tipo
}

export interface ICourseSchedulingTypeDelete {
  id: string // Identificador del tipo
}

export interface ICourseSchedulingTypeQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
}
//@end
