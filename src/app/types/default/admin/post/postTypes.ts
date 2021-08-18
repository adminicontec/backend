// @import types
// @end

// @add your types
export interface IPost {
  title: string // Titulo de la publicación
  subtitle?: string // Descripción corta de la publicación
  content?: any  // Contenido de la publicación
  coverUrl?: string // URL de la imagen de la publicación
  postDate?: string // Fecha desde la cual la publicación estara disponible
  eventDate?: string // Fecha desde la cual el evento estara disponible
  lifeSpan?: string // ?
  highlighted?: boolean // Identifica si la publicación es destacada
  isActive: boolean // Identifica si la publicación esta activa
  startDate?: string // ?
  endDate?: string // ?
  externUrl?: string // URL de la publicación externa
  user?: string // Identificador de clase User
  postType?: string // Identificador de clase PostType
  tags?: Array<any> | string // Array con los tags de la publicación
  coverFile?: any // Objeto tipo file que contiene la imagen a cargar
  locations?: IPostLocations[] | string // Array con las ubicaciones de la publicación
  location?: IPostLocations // Array con las ubicaciones de la publicación
  authors?: Array<string> // Array de los nombre de los autores
  id?: string // Identificador de la categoria
  platform_video?: string // Tipo de video
  url_video?: string  // Url del video
  video?: {           // Objeto de video para guardar en el esquema
    url: string
    platform: string
  }
}

export interface IPostLocations {
  postLocation: string // Identificador de PostLocation
  viewCounter?: number // Cantidad de vistas
}

export interface IPostDelete {
  id: string // Identificador de la categoria
}

export interface IPostQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
  isActive?: boolean // Estado de la publicación
  postType?: Array<string> // Tipo de publicación
  postDate?: string // Fecha de busqueda
  eventDate?: string // Fecha de busqueda
  locations?: Array<string> // Lista de ubicaciones
}
//@end
