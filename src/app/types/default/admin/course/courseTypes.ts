// @import types
// @end

// @add your types
export interface ICourse {
  schedulingMode: {value: number, label: string} | string // Identificador del modo de programación
  program: {value: number, label: string} | string // Identificador del programa
  // moodleID?: number,
  // name             : string,             // Nombre del curso
  // fullname?         : string,             // Nombre Completo del curso
  // displayname?      : string,             // Nombre Para mostrar del curso
  description      : string,             // Descripción del curso
  // courseType?      : string,             // Tipo de curso
  // mode?            : string,             // Modalidad
  // startDate        : string,             // fecha de inicio
  // endDate          : string,             // fecha de finalización
  // maxEnrollmentDate: string,             // Fecha mxima de inscripción.
  // hasCost?         : boolean | string,   // Indica si el curso es de pago o no
  // priceCOP         : number,             // Precio en Pesos Colombianos
  // priceUSD         : number,             // Precio en Dólares Estadounidenses
  // discount         : number,             // Porcentaje de descuento del precio
  // quota            : number,             // cantidad máxima de cupos
  // lang             : string,             // Idioma en el que se da el curso
  id?              : string              // Identificador del curso
  coverUrl?        : string              // URL de la imagen del curso
  coverFile?       : any,             // Objeto tipo file que contiene la imagen a cargar
  // duration?        : number,          // Numero de segundos para la duración del curso
  generalities?    : string,
  requirements?    : string,
  content?         : Array<{category?: string, data: string}>,   // Contenido del curso
  // benefits?        : Array<string>,   // Beneficios
}

export interface ICourseQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
  startDate?: string // Fecha de inicio,
  courseType?: Array<string>,             // Tipo de curso
  mode?: Array<string>,             // Modalidad
}

export interface ICourseDelete {
  id: string // Identificador del pais
}
//@end
