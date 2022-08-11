// @import types
// @end

// @add your types
export interface IBanner {
  title: string // Titulo del banner
  content?: any  // Contenido del banner
  coverUrl?: string // URL de la imagen del banner
  isActive: boolean // Identifica si el banner esta activo
  coverFile?: any // Objeto tipo file que contiene la imagen a cargar
  id?: string // Identificador del banner
  start_date?: Date // Fecha de inicio
  end_date?: Date // Fecha de fin
  location?: 'students'
  locations?: string[] | string
}

export interface IBannerDelete {
  id: string // Identificador del banner
}

export interface IBannerQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
  isActive?: boolean // Estado del banner
}
//@end
