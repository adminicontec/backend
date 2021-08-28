// @import types
// @end

// @add your types

export interface ILandingArticle {
  slug?: string
  coverFile?: any // Objeto tipo file que contiene la imagen a cargar
  coverUrl?: string // URL de la imagen de la publicación
  coverCaption?: string
  title: string,
  content: any
}

export interface ILandingTrainingsDelete {
  slug: string
  unique: string
}

export interface ILandingTrainings {
  slug?: string
  unique?: string
  status: 'disabled' | 'enabled'
  title: string
  description: string
  attachedUrl?: string
  attachedFile?: any // Objeto tipo file que contiene el adjunto a cargar
  publication_date: string
}

export interface ILandingSchedulingDelete {
  slug: string
  unique: string
}

export interface ILandingScheduling {
  slug?: string
  unique?: string
  title: string
  attachedUrl?: string
  attachedFile?: any // Objeto tipo file que contiene el adjunto a cargar
}

export interface ILanding {
  slug: string
  title_page?: string
  article?: ILandingArticle
  trainings?: Array<ILandingTrainings>
  scheduling?: Array<ILandingScheduling>
  id?: string // Identificador de la categoria
}

export interface ILandingDelete {
  id: string // Identificador de la programación
}

export interface ILandingQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
}
//@end
