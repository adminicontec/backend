// @import types
// @end

// @add your types

export enum QualifiedTeacherStatus {
  ACTIVE = 'ACTIVO',
  INACTIVE = 'INACTIVO'
}


export interface IQualifiedTeacher{
  index?: number,
  id?: string       // Identificador del registro de QualifiedTeacher
  teacher?: string     // Identificador del usuario en Campus Digital
  modular?: string  // Identificador del modular en Campus Digital
  courseCode?: string
  status?: QualifiedTeacherStatus
  courseName?: string
  evaluationDate?: Date
  isEnabled?: boolean
  observations?: string,
  action?:string,
  sheetName?:string
  isEmailSent?: boolean
  fileMappedData?: {
    modular?: string
  }
}

export interface IQualifiedTeacherPDFInfo {
  modular: string
  code: string
  courseName: string
}

export interface IQualifiedTeacherByTeacherPDF {
  teacher: string
  email: string
  courses: IQualifiedTeacherPDFInfo[]
}

export interface IQualifiedTeacherDelete{
  id: string
}


export interface IQualifiedTeacherQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
  courseCode?:string, // Busca sobre los campos de la coleccion
  teacher?:string, // Busca sobre los campos de la coleccion
  status?:string, // qualification status: active or inactive
  statuses?: string[] | string
}
//@end
