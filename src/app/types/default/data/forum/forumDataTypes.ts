// @import types
// @end

// @add your types
export interface IFetchForums {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
  isActive?: boolean // Estado del foro
  postDate?: string // Fecha de busqueda
}

export interface IFetchMessagesByForum {
  user: string // Identificador del usuario logueado
  forum: string // Identificador del foro
  nPerPage?:any // Cantidad de items por pagina
  pageNumber?:any // Numero de pagina
  dateFilter?: any // Fecha para el filtro
}
//@end
