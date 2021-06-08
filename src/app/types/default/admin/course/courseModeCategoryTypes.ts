// @import types
// @end

// @add your types
export interface ICourseModeCategory {
  name: string, // Nombre de la categoria
  description: string // Descripción de la categoria
  id?: string // Identificador de la categoria
}

export interface ICourseModeCategoryDelete {
  id: string // Identificador de la categoria
}

export interface ICourseModeCategoryQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
}
//@end
