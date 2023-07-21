import { TimeZone } from '@scnode_app/types/default/admin/user/userTypes';
// @import types
// @end

// @add your types\
export enum CourseSchedulingDetailsModification {
  START_DATE = 'startDate',
  END_DATE = 'endDate',
  DURATION = 'duration',
  SESSIONS = 'sessions',
  TEACHER = 'teacher',
  OBSERVATIONS = 'observations',
}

export interface ICourseSchedulingDetailsModification {
  type: CourseSchedulingDetailsModification;
  message: string;
}

export type TCourseSchedulingDetailsModificationFn = (timezone?: TimeZone) => Promise<ICourseSchedulingDetailsModification[]>

export interface ICourseSchedulingDetailSession {
  _id?: string,
  startDate: string // Fecha de inicio
  duration: number // Duración
  hasChanges?: 'on' | 'off',
  oldValues?: {
    _id: string,
    startDate: string,
    duration: number,
    moodle_id: string,
    uuid: string
  }
}

export interface ICourseSchedulingDetail {
  logReprograming?: {
    count?: number,
    log: {reason: string, date: any}[]
  }
  reprograming?: string
  user?: string // Identificador del usuario logueado
  course?: {value: number, label: string, code: string} | string // Curso de la programación
  schedulingMode?: {value: number, label: string} | string // Identificador del modo de programación
  startDate?: string // Fecha de inicio de la programación
  endDate?: any  // Fecha de finalización de la programación
  teacher?: string // Docente de la programación
  number_of_sessions?: number // Cantidad de sesiones de la programación
  sessions?: Array<ICourseSchedulingDetailSession> // Array de sesiones de clase
  duration?: number // Duración del programa
  sendEmail?: boolean | 'true' | 'false' // Booleano que indica si se debe enviar email de notificación
  id?: string // Identificador de la categoria
  _id?: string
  observations?: string
}

export interface ICourseSchedulingDetailDelete {
  id: string // Identificador de la programación
}

export interface ICourseSchedulingDetailQuery {
  course_scheduling?: string // Identificador de la programación
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
  teacher?: string
}
export interface IDuplicateCourseSchedulingDetail {
  courseSchedulingId: string;
  courseSchedulingDetailId: string;
  course?: {value: number, label: string, code: string} | string // Curso de la programación
}
//@end
