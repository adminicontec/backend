// @import types
// @end

// @add your types
export interface IAppModulePermission {
  name: string, // Nombre del permiso
  description: string, // Descripción del permiso
  id?: string // Identificador del permiso
}

export interface IAppModulePermissionDelete {
  id: string // Identificador del permiso
}

export interface IAppModulePermissionQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
}
//@end
