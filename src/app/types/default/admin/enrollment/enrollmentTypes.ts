// @import types
// @end

// @add your types
export interface IEnrollment{
  courseScheduling?: string    // Identificador de la programación
  user?: string // Identificador del usuario en campus
  email: string,          // email de estudiante
  password: string,
  firstname: string,      // Nombre de estudiante
  lastname: string,       // Apellido de estudiante
  documentType?: string,   // Tipo de documento (CC, CE, PAS )
  documentID?: string,     // Documento de identidad
  courseID: string,       // ID de curso (listado de cursos en CV)
  rolename?: string,
  sendEmail?: boolean | 'true' | 'false' // Booleano que indica si se debe enviar notificación via email
  id?: string             // Identificador del Enrollment
}

export interface IEnrollmentQuery {
  courseID?: string // Identificador del curso de moodle
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
}

export interface IMassiveEnrollment{
  courseID        : string,   // ID de curso (listado de cursos en CV)
  courseScheduling: string    // Identificador de la programación
  sendEmail?: boolean | 'true' | 'false' // Booleano que indica si se debe enviar notificación via email
  contentFile     :           // contento of file to be processed.
  {
    name: string,
    data: Buffer,
  }
}

export interface IEnrollmentDelete {
  id: string // Identificador de la matrícula en Campus Digital
}
//@end
