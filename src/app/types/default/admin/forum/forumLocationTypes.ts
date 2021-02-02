// @import types
// @end

// @add your types
export interface IForumLocation {
  name: string, // Nombre de la ubicación
  id?: string // Identificador de la ubicación
}

export interface IForumLocationDelete {
  id: string // Identificador de la ubicación
}

export interface IForumLocationQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
}
//@end
