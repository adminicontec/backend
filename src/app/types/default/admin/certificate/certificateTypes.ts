// @import types
// @end

// @add your types

export interface IQueryCertificate {
  name: string, // Nombre de la categoria
  id?: string // Identificador de la categoria
}

export interface IQueryUserToCertificate {
  certificateQueueId: string,
  userId: string, // ID de usario
  courseId: string, // ID de curso
  auxiliarId: string, // ID de Auxiliar qué liberó el certificado
  certificateConsecutive: string,
  certificateHash?: string    // Hash de creación de ceertificado en Huella de confianza, requerido para proceso de Actualización
  certificateType?: string
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
  regional: string,
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
  dato_11?: string,
  dato_12?: string,
  dato_13?: string
  anexos?: {
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
  }
}

export interface ISetCertificateParams {
  queueData: IQueryUserToCertificate,
  template: string,
  certificateType: string,
  paramsHuella: ICertificate,
  programName: string,
  isComplete: boolean,
  certificateHash?: string
}

export interface ICertificateQueueQuery {
  pageNumber?: string, // Numero de pagina
  nPerPage?: string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?: string, // Busca sobre los campos de la coleccion
  status?: string,
}
export interface ICertificateQueueRequest {
  id?: string,
  users?: Array<string>,
  userId?: string,
  courseId: string,
  status: string,
}

export interface ICertificateQueue {
  id?: string,
  courseId?: string,
  users?: Array<string>,
  userId?: string,
  auxiliar?: string,
  certificateType?: string,
  certificateModule?: string,
  certificateConsecutive?: string,
  status: string,
  message?: string,
  downloadDate?: Date,
  certificate?: {
    hash: string,
    url: string,
    title: string,
    date: Date
  }
}

export interface ICertificateQueueDelete {
  id: string
}

export interface ICertificatePreview {
  certificate_queue?: string;
  hash: string,
  format: number,
  template: number,
  updateCertificate?: boolean
  showPreviewBase64?: boolean
}

export interface ICertificateReGenerate {
  userId: string;
  courseId: string
}

export interface IGenerateCertificatePdf {
  certificate: string,
  to_file: {
    file: {
      name: string,   // Nombre original del archivo adjunto (Ex: car.jpg)
    },
    path: string // Ubicación por defecto donde se alojaran los PDF
  }
}

export interface IGenerateZipCertifications {
  files: Array<string>
  to_file: {
    file: {
      name: string,   // Nombre original del archivo adjunto (Ex: car.jpg)
    },
    path: string // Ubicación por defecto donde se alojaran los PDF
  }
}
export interface ICertificateCompletion {
  courseID?: string,  //moodle_ID
  course_scheduling?: string,
  without_certification?: boolean
  check_certification?: boolean,
  userMoodleID?: string,

  pageNumber?: string, // Numero de pagina
  nPerPage?: string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?: string, // Busca sobre los campos de la coleccion
}

export interface ILogoInformation{
  imageBase64: string,
  //companyName: string
}
export interface ISignatureInformation{
  imageBase64: string,
  signatoryName: string,
  signatoryPosition: string,
  signatoryCompanyName: string
}
//@end
