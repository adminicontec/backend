// @import types
// @end

// @add your types
export interface IFetchCourses {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
  // postType?: Array<string> // Tipo de publicación
  startDate?: {
    date: 'today' | string
    direction: 'gt' | 'gte' | 'lt' | 'lte' | 'eq'
  } // Fecha de busqueda: Inicio
  endDate?: {
    date: 'today' | string
    direction: 'gt' | 'gte' | 'lt' | 'lte' | 'eq'
  } // Fecha de busqueda: finalización
  // courseType?: Array<string> // Lista de ubicaciones
  mode?: string
  sort?: {
    field: string,
    direction: string
  },
  price?: 'free' | 'pay'
}

export interface IFetchCourse {
  id?: string,
  slug?: string
}
//@end
