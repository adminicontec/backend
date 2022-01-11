// @import types
// @end

// @add your types
export interface IFetchEnrollementByUser {
  user: string
}

export interface IFetchCertifications {
  user?: string // Identificador del usuario logueado
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  company?: string // Identificador de cliente
  status?: Array<'New' | 'In-process' | 'Complete' | 'Error' | 'Re-issue'>
}
//@end
