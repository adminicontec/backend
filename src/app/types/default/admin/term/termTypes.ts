// @import types
// @end

// @add your types
export enum Terms {
  TUTORIAL_CATEGORY = 'tutorial-category'
}

export const TERMS = [
  Terms.TUTORIAL_CATEGORY,
]

export interface ITerm {
  type: Terms
  name: string
  position?: number
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
}
//@end
