// @import types
// @end

// @add your types
export interface IPostCategory {
  name: string, // Nombre de la categoria
  id?: string // Identificador de la categoria
}

export interface IPostCategoryDelete {
  id: string // Identificador de la categoria
}

export interface IPostCategoryQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
}
//@end
