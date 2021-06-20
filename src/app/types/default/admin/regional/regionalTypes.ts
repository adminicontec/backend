// @import types
// @end

// @add your types
export interface IRegional {
  name: string, // Nombre de la regional
  id?: string // Identificador de la regional
}

export interface IRegionalDelete {
  id: string // Identificador de la regional
}

export interface IRegionalQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
}
//@end
