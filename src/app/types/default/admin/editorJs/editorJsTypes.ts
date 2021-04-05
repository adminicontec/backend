// @import types
// @end

// @add your types
export interface IUploadImage {
  // id: string, // Identificador del recurso academico
  type: 'by_file' | 'by_url', // Tipo de archivo que se desea cargar
  url?: string, // URL de la imagen
  file?: any // Objeto de tipo File con la información de la imagen
}

export interface IFetchUrlFromLink {
  url: string, // URL requerida
}
//@end
