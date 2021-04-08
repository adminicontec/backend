// @import types
// @end

// @add your types
export interface ICourse {
  name: string,             // Nombre del curso
  fullname: string,         // Nombre Completo del curso
  displayname: string,      // Nombre Para mostrar del curso
  description: string,      // Descripción del curso
  courseType?: string,             // Tipo de curso
  mode?: string,             // Modalidad
  startDate: string,        // fecha de inicio
  endDate: string,          // fecha de finalización
  maxEnrollmentDate: string,// Fecha mxima de inscripción.
  priceCOP: number,         // Precio en Pesos Colombianos
  priceUSD: number,         // Precio en Dólares Estadounidenses
  discount: number,         // Porcentaje de descuento del precio
  quota: number,            // cantidad máxima de cupos
  lang: string,             // Idioma en el que se da el curso
  id?: string               // Identificador del curso
}

export interface ICourseQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
}

export interface ICourseDelete {
  id: string // Identificador del pais
}
//@end
