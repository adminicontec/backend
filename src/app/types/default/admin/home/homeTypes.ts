// @import types
// @end

// @add your types
export interface IHome {
  name: string, // Nombre del entorno
  description?: string, // Descripción del entorno
  id?: string // Identificador del entorno
}

export interface IHomeDelete {
  id: string // Identificador del entorno
}

export interface IHomeQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
}
//@end
