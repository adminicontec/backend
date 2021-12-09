// @import types
// @end

// @add your types

export interface IQueryCertificate {
  name: string, // Nombre de la categoria
  id?: string // Identificador de la categoria
}

export interface IQueryUserToCertificate {
  username: string, // Nombre de usario
  courseId: string,
  module: string,
  consecutive?: number
}


export interface ICertificate {
  modulo: string,
  numero_certificado: string,
  correo: string,
  documento: string,
  nombre: string,
  asistio?: string,
  certificado: string,
  certificado_ingles?: string,
  alcance?: string,
  alcance_ingles?: string,
  intensidad: string,
  listado_cursos?: any,
  ciudad: string,
  pais: string,
  fecha_certificado: Date,
  fecha_aprobacion?: Date,
  fecha_ultima_modificacion?: Date,
  fecha_renovacion?: Date,
  fecha_vencimiento?: Date,
  fecha_impresion?: Date,
  dato_1: string,
  dato_2: string,
  dato_3?: string,
  dato_4?: string,
  dato_5?: string,
  dato_6?: string,
  dato_7?: string,
  dato_8?: string,
  dato_9?: string,
  dato_10?: string,
  anexos?: [
    dato_1?: string,
    dato_2?: string,
    dato_3?: string,
    dato_4?: string,
    dato_5?: string,
    dato_6?: string,
    dato_7?: string,
    dato_8?: string,
    dato_9?: string,
    dato_10?: string,
  ],
}


export interface ICertificateQueueQuery {
  pageNumber?: string, // Numero de pagina
  nPerPage?: string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?: string, // Busca sobre los campos de la coleccion
}

export interface ICertificateQueue {
  id?: string,
  userId: number,
  courseId: number,
  certificateType: string,
  certificateModule: string,
  status: string,
  certificate?: {
    hash: string,
    url: string
  }
}
//@end
