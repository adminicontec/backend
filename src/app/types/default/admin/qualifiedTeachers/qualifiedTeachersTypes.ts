// @import types
// @end

// @add your types


export interface IQualifiedTeacher{
  index?: number,
  id?: string       // Identificador del registro de QualifiedTeacher
  teacher?: string     // Identificador del usuario en Campus Digital
  modular?: string  // Identificador del modular en Campus Digital
  courseCode?: string
  status?: string
  courseName?: string
  evaluationDate?: Date
  isEnabled?: boolean
  observations?: string,
  action?:string,
  sheetName?:string
}

export interface IQualifiedTeacherDelete{
  id: string
}


export interface IQualifiedTeacherQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
  courseCode?:string, // Busca sobre los campos de la coleccion
  teacher?:string, // Busca sobre los campos de la coleccion
}
//@end
