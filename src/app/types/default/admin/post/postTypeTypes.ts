// @import types
// @end

// @add your types
export interface IPostType {
  name: string, // Nombre del tipo de post
  id?: string // Identificador del tipo de post
}

export interface IPostTypeDelete {
  id: string // Identificador del tipo de post
}

export interface IPostTypeQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
}
//@end
