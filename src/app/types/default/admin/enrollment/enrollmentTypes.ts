// @import types
// @end

// @add your types
export interface IEnrollment{
  email: string,          // email de estudiante
  password: string,
  firstname: string,      // Nombre de estudiante
  lastname: string,       // Apellido de estudiante
  documentType?: string,   // Tipo de documento (CC, CE, PAS )
  documentID?: string,     // Documento de identidad
  courseID: string,       // ID de curso (listado de cursos en CV)
  id?: string             // Identificador del Enrollment
}

export interface IEnrollmentQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
}
//@end
