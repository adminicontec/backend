// @import types
// @end

// @add your types

export interface ICertificateLogQuery {
  pageNumber?: string, // Numero de pagina
  nPerPage?: string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?: string, // Busca sobre los campos de la coleccion
  status?: string,
}

export interface ICertificateLog {
  id?: string,
  serviceResponse: string,
  idCertificateQueue?: string,
  process?: string,
  message?: string,
  requestData?: any,
  previewRequestData?: any,
  reissueRequestData?: any
}

export interface ICertificateDelete {
  id: string // Identificador del registro
}
//@end
