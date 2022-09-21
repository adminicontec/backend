// @import types
// @end

// @add your types
export interface IProgram {
  name: string, // Nombre del programa
  id?: string // Identificador del programa
}

export interface IProgramDelete {
  id: string // Identificador del programa
}

export interface IProgramQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
  code?: string,
  moodle_id?: string,
  isAuditor?: boolean
}
//@end
