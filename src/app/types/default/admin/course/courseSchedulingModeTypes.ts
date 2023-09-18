// @import types
// @end

// @add your types
export enum CourseSchedulingModes {
  VIRTUAL = 'Virtual',
  ON_LINE = 'En linea',
  ON_SITE_ON_LINE = 'Presencial - En linea',
  ON_SITE = 'Presencial'
}

export interface ICourseSchedulingMode {
  name: string, // Nombre del modo
  description: string // Descripción del modo
  id?: string // Identificador del modo
}

export interface ICourseSchedulingModeDelete {
  id: string // Identificador del modo
}

export interface ICourseSchedulingModeQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
  moodle_id?: boolean | string // Busca por moodle id
}
//@end
