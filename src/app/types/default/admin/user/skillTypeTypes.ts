// @import types
// @end

// @add your types
export interface ISkillType {
  name: string, // Nombre de tipo de habilidad
  id?: string   // Identificador de tipo de habilidad
}

export interface ISkillTypeDelete {
  id: string // Identificador del Tipo de Habilidad
}

export interface ISkillTypeQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
}
//@end
