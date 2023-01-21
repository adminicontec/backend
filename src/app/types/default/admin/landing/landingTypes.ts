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

export type TypeAgreement = 'alliance' | 'agreement'
export interface IAllianceBrochure {
  unique: string,
  file: string,
  fileUrl?: string,
  name: string
}
export interface IAllianceBrochureCreate {
  allianceUnique: string
  slug: string
  brochures: (Omit<IAllianceBrochure, 'unique'> & {
    unique?: string
    fileToUpload?: any
  })[]
  user?: string
}
export interface ILandingAlliance {
  slug?: string
  unique?: string,
  status?: boolean
  typeAgreement?: TypeAgreement
  logo?: string
  logoFile?: string,
  logoUrl?: string,
  name?: string
  country?: string
  regional?: string
  creationYear?: string,
  programs?: string[] | string,
  webSite?:string
  contact?:string
  brochures?: IAllianceBrochure[]
}

export interface ILandingAllianceDelete {
  slug: string
  unique: string
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

export interface ILandingOurClients{
  slug?: string
  unique?: string
  title: string
  url?: string
  attached?: any
  attachedFile?: any // Objeto tipo file que contiene el adjunto a cargar
}

export interface ILandingReference{
  slug?: string
  unique?: string
  title: string
  description: string
  qualification: string
  url?: string
  attached?: any
  coverFile?: any // Objeto tipo file que contiene el adjunto a cargar
  created_at?: Date
  client?: string
  active?: boolean
}

export interface ILandingReferenceDelete{
  slug: string
  unique: string
}

export interface ILandingOurClientDelete{
  slug: string
  unique: string
}

export interface ILandingDescriptiveTraining{
  slug?: string
  image?: string
  title?: string
  content?: any
  attachedFile?: any // Objeto tipo file que contiene el adjunto a cargar
}

export interface ILandingForum{
  title?: string;
  description?: string;
  slug?: string;
}

export interface ILanding {
  slug: string
  title_page?: string
  article?: ILandingArticle
  trainings?: Array<ILandingTrainings>
  alliances?: Array<ILandingAlliance>
  scheduling?: Array<ILandingScheduling>
  our_clients?: Array<ILandingOurClients>
  references?: Array<ILandingReference>
  descriptive_training?: ILandingDescriptiveTraining
  id?: string // Identificador de la categoria
  forums?: ILandingForum
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
