// @import types
// @end

// @add your types
export interface IRole {
  name: string, // Nombre del rol
  description?: string, // Descripción del rol
  app_module_permissions?: Array<any>, // Array con los permisos asignados al modulo
  id?: string // Identificador del rol
}

export interface IRoleDelete {
  id: string // Identificador del rol
}

export interface IRoleQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
}
//@end
