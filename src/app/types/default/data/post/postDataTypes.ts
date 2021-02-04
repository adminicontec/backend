// @import types
// @end

// @add your types
export interface IFetchPosts {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
  isActive?: boolean // Estado del foro
  postType?: Array<string> // Tipo de publicación
  postDate?: string // Fecha de busqueda
  eventDate?: string // Fecha de busqueda
  locations?: Array<string> // Lista de ubicaciones
}
//@end
