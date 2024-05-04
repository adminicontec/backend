// @import types
// @end

// @add your types

export enum ProcessList {
  SET_CERTIFICATE = 'Set certificate',
  PREVIEW = 'Preview certificate',
  RE_ISSUE = 'Re-issue certificate',
  COMPLETE = 'Complete',
}

export interface ICertificateLogQuery {
  pageNumber?: string, // Numero de pagina
  nPerPage?: string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?: string, // Busca sobre los campos de la coleccion
  status?: string,
  idCertificateQueue?: string
  idCertificateQueues?: string[]
  process?: ProcessList
  dateGte?: string
  dateLte?: string
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
  responseService?: any
}

export interface ICertificateDelete {
  id: string // Identificador del registro
}
//@end
