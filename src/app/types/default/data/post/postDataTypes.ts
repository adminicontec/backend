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
  postDate?: {
    date: 'today' | string
    direction: 'gt' | 'gte' | 'lt' | 'lte' | 'eq'
  } // Fecha de busqueda
  eventDate?: {
    date: 'today' | string
    direction: 'gt' | 'gte' | 'lt' | 'lte' | 'eq'
  } // Fecha de busqueda
  locations?: Array<string> // Lista de ubicaciones
  sort?: {
    field: string,
    direction: string
  }
}

export interface IFetchPost {
  id?: string,
  slug?: string
}
//@end
