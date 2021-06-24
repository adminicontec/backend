// @import types
// @end

// @add your types
export interface ICourseSchedulingSession {
  startDate: string // Fecha de inicio
  duration: number // Duración
}

export interface ICourseScheduling {
  schedulingStatus: string //Identificador del estado de programación
  modular: string // Identificador del modular
  schedulingCode: string // Codigo de programación
  program: string // Identificador del programa
  schedulingType: string // Identificador del tipo de programación
  schedulingMode: string // Identificador del modo de programación
  course?: string // Curso de la programación
  startDate?: string // Fecha de inicio de la programación
  endDate?: any  // Fecha de finalización de la programación
  teacher?: string // Docente de la programación
  regional?: string // Regional de la programación
  city?: string // Identificador de la ciudad
  amountParticipants?: string // Cantidad de participantes
  observations?: string // Observaciones
  duration?: number // Duración del programa
  sessions?: Array<ICourseSchedulingSession> // Array de sesiones de clase
  id?: string // Identificador de la categoria
}

export interface ICourseSchedulingDelete {
  id: string // Identificador de la programación
}

export interface ICourseSchedulingQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
}
//@end
