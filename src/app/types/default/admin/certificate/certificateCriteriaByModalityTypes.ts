// @import types
// @end

import { TypeCourse } from "../course/courseSchedulingTypes"

// @add your types
//@end

export interface ICertificateCriteriaByModality {
  user: string;
  id?: string;
  modality: string;
  typeCourse?: TypeCourse;
  certificateCriteria?: string;
}
export interface ICertificateCriteriaByModalityDelete {
  id: string // Identificador
}
export interface ICertificateCriteriaByModalityQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
}
