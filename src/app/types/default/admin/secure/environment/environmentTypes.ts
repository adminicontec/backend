// @import types
// @end

// @add your types
export interface IEnvironment {
  name: string, // Nombre del entorno
  description?: string, // Descripción del entorno
  app_module?: Array<any>, // Array con los modulos asignados
  id?: string // Identificador del entorno
}

export interface IEnvironmentDelete {
  id: string // Identificador del entorno
}

export interface IEnvironmentQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
}
//@end
