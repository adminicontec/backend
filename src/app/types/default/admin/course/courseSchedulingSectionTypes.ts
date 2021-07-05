// @import types
// @end

// @add your types
export interface ICourseSchedulingSection {
  name: string, // Nombre de la sección
  id?: string // Identificador de la sección
}

export interface ICourseSchedulingSectionDelete {
  id: string // Identificador de la sección
}

export interface ICourseSchedulingSectionQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
}
//@end
