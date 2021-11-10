// @import types
// @end

// @add your types

export interface IQueryCertificate {
  name: string, // Nombre de la categoria
  id?: string // Identificador de la categoria
}

export interface IQueryUserToCertificate {
  username: string, // Nombre de usario
  module: string,
  consecutive?:number
}


export interface ICertificate {
  modulo: string,
  numero_certificado: string,
  correo: string,
  documento: string,
  nombre: string,
  asistio: string,
  certificado: string,
  certificado_ingles: string,
  alcance: string,
  alcance_ingles: string,
  intensidad: string,
  listado_cursos: string,
  ciudad: string,
  pais: string,
  fecha_certificado: Date,
  fecha_aprobacion: Date,
  fecha_ultima_modificacion: Date,
  fecha_renovacion: Date,
  fecha_vencimiento: Date,
  fecha_impresion: Date
}
//@end
