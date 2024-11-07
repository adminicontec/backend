// @import types
// @end

// @add your types
export enum Terms {
  TUTORIAL_CATEGORY = 'tutorial-category',
  COURSE_TOPIC = 'course-topic',
  COURSE_SECTOR = 'course-sector',
  COURSE_FORMATION_TYPE = 'course-formation-type',
  COURSE_PROFILE = 'course-profile',
  COURSE_FILTER_CATEGORY = 'course-filter-category'
}

export interface ITerm<T = any> {
  type: Terms
  name: string
  position?: number
  custom?: T
  enabled?: boolean
  _id: string
  id: string
}

export interface IParamsTermDelete {
  id: string
}

export interface ITermQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la colección a buscar
  search?:string, // Busca sobre los campos de la colección
  type?: Terms,
  types?: Terms[],
  enabled?: boolean
}
//@end
