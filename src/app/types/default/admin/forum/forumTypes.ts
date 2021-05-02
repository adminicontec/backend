// @import types
// @end

// @add your types
export interface IForum {
  title: string // Titulo del foro
  description?: string // Descripción corta del foro
  coverUrl?: string // URL de la imagen del foro
  postDate?: string // Fecha desde la cual el foro estara disponible
  isActive: boolean // Identifica si foro esta activo
  tags?: Array<any> | string // Array con los tags del foro
  cover?: any // Objeto tipo file que contiene la imagen a cargar
  locations?: IForumLocations[] | string // Array con las ubicaciones del foro
  location?: IForumLocations // Array con las ubicaciones del foro
  id?: string // Identificador del foro
}

export interface IForumLocations {
  forumLocation: string // Identificador de ForumLocation
  viewCounter?: number // Cantidad de vistas
}

export interface IForumDelete {
  id: string // Identificador de la categoria
}

export interface IForumQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
  isActive?: boolean // Estado del foro
  postDate?: string // Fecha de busqueda
  locations?: Array<string> // Lista de ubicaciones
}
//@end
