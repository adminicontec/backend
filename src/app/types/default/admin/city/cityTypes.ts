// @import types
// @end

// @add your types
export interface ICity {
  name: string, // Nombre de la categoria
  id?: string // Identificador de la categoria
}

export interface ICityDelete {
  id: string // Identificador de la categoria
}

export interface ICityQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
}
//@end
