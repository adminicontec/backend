// @import types
// @end

// @add your types
export interface IAppModule {
  name: string, // Nombre del modulo
  description?: string, // Descripción del modulo
  app_module_permissions?: Array<any>, // Array con los permisos asignados al modulo
  id?: string // Identificador del modulo
}

export interface IAppModuleDelete {
  id: string // Identificador del modulo
}

export interface IAppModuleQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
}
//@end
