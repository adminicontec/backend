// @import types
// @end

// @add your types
export interface ICompany {
  slug?: string // Cadena de texto generada automaticamente que identifica a la compañia
  name?: string // Nombre de la compañia
  description?: string // Descripción de la compañia
  logo?: string // Logo de la compañia
  background?: string // Background de la compañia
  logoFile?: any // Objeto de tipo file que contiene la imagen de logo a cargar
  backgroundFile?: any // Objeto de tipo file que contiene la imagen de background a cargar
  id?: string // Identificador de la compañia
  logoFileClear?: 'true' | 'false'
  backgroundFileClear?: 'true' | 'false'
}

export interface ICompanyDelete {
  id: string // Identificador de la compañia
}

export interface ICompanyQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
}

export interface IFetchCompany {
  id?:string, // Identificador de la compañia
  slug?:string, // Slug de la compañia
}

export interface ICompanyUsers {
  company: string
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  searchUsersAvailable?: boolean
}

export interface ParamsFetchCompaniesExecutiveByUser{
  userId: string;
}
//@end
