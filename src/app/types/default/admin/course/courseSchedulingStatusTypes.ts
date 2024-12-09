// @import types
// @end

// @add your types
export enum CourseSchedulingStatusName {
  CONFIRMED = 'Confirmado',
  PROGRAMMED = 'Programado',
  EXECUTED = 'Ejecutado',
  CANCELED = 'Cancelado'
}

export interface ICourseSchedulingStatus {
  name: string, // Nombre del estado
  description: string // Descripción del estado
  id?: string // Identificador del estado
}

export interface ICourseSchedulingStatusDelete {
  id: string // Identificador del estado
}

export interface ICourseSchedulingStatusQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
}
//@end
