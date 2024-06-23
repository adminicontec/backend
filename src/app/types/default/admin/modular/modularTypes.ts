// @import types
// @end

// @add your types
export interface IModular {
  name: string, // Nombre del modular
  description: string // Descripción del modular
  filterCategories?: string[]
  id?: string // Identificador del modular
}

export interface IModularDelete {
  id: string // Identificador del modular
}

export interface IModularQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
}
//@end
