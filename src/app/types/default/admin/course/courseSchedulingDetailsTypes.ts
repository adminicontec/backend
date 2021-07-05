// @import types
// @end

// @add your types
export interface ICourseSchedulingDetailSession {
  startDate: string // Fecha de inicio
  duration: number // Duración
}

export interface ICourseSchedulingDetail {
  user: string // Identificador del usuario logueado
  course?: {value: number, label: string} | string // Curso de la programación
  schedulingMode: {value: number, label: string} | string // Identificador del modo de programación
  startDate?: string // Fecha de inicio de la programación
  endDate?: any  // Fecha de finalización de la programación
  teacher?: string // Docente de la programación
  number_of_sessions?: number // Cantidad de sesiones de la programación
  sessions?: Array<ICourseSchedulingDetailSession> // Array de sesiones de clase
  id?: string // Identificador de la categoria
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
}
//@end
