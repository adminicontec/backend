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
  company?: string, // Identificador de cliente
  search?:string, // Identificador de Servicio
  searchDoc?: string, // Documento de identidad del usuario
  status?: Array<'New' | 'In-process' | 'Complete' | 'Error' | 'Re-issue'>
  certificate_clients?: boolean
  certificate_students?: boolean
}

export interface IDownloadMasiveCertifications {
  user?: string // Identificador del usuario logueado
  certification_queue: Array<string>
  downloadAll?: boolean
  company?: string
}
//@end
