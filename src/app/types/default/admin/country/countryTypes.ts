// @import types
// @end

// @add your types
export interface ICountry {
  name: string, // Nombre del pais
  iso2?: string // Identificador ISO
  iso3?: string // Identificador ISO
  id?: string // Identificador del pais
}

export interface ICountryDelete {
  id: string // Identificador del pais
}

export interface ICountryQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
}
//@end
