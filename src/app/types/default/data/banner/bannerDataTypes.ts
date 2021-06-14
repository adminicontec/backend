// @import types
// @end

// @add your types
export interface IFetchBanners {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
  isActive?: boolean // Estado del banner
  sort?: {
    field: string,
    direction: string
  }
}
//@end
