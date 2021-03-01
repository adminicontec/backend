// @import types
import {UploadConfig} from '@scnode_core/types/default/attached/attachedTypes'
// @end

// @add your types
export interface IPdfOptions {
  // Export options
  // Papersize Options: http://phantomjs.org/api/webpage/property/paper-size.html
  height?: string,   // allowed units: mm, cm, in, px
  width?: string,    // allowed units: mm, cm, in, px
  // - or -
  format?     : "A3" | "A4" | "A5" | "Legal" | "Letter" | "Tabloid"  // allowed units: A3, A4, A5, Legal, Letter, Tabloid
  orientation?: "portrait" | "landscape"                             // portrait or landscape

  // Page options
  border?: string | {
    top?   : string
    right? : string
    bottom?: string
    left?  : string
  },  // default is 0, units: mm, cm, in, px

  paginationOffset?: number,       // Override the initial pagination number
  header?: {
    height?: string, // allowed units: units: mm, cm, in, px
    contents: string // Html content string
  },
  footer?: {
    height?: string,
    contents: string | {
      first?: string  // Html content string - First page
      //   2: 'Second page', // Any page number is working. 1-based index
      default?: string // Html content string - Any page
      last?: string  // Html content string - Last page
    }
  },

  // Rendering options
  //   "base": "file:///home/www/your-asset-path", // Base path that's used to load files (images, css, js) when they aren't referenced using a host

  // Zooming option, can be used to scale images if `options.type` is not pdf
  zoomFactor?: string, // default is 1

  // File options
  type?     : "png" | "jpeg" | "pdf"    // allowed file types: png, jpeg, pdf
  quality?: string,    // only used for types png & jpeg
}

export interface IPdfFromFile {
  path    : string          // Ruta donde se aloja el archivo
  type    : 'html' | 'hbs'  // Tipo de archivo que se desea convertir
  context?: object          // Data que se proporcionara al archivo (Solo aplica para HBS)
}
export interface IPdfFromContent {
  html:string // String con el contenido HTML que se desea convertir a PDF
}

export interface IAttachedConfig {
  file: {
    name: string,   // Nombre original del archivo adjunto (Ex: car.jpg)
  },
  upload_config?: UploadConfig // Información para la carga del PDF al servidor
  path_upload_default?: string // Ubicación por defecto donde se alojaran los PDF
}

export interface IGeneratePdfConfig {
  from     : 'file' | 'content'  // Origen del tipo de información a convertir en PDF (File: Archivo hbs o html | content: Contenido Html)
  file?    : IPdfFromFile        // Configuración del archivo a convertir (Solo aplica si es from: file)
  content? : IPdfFromContent     // Configuración del contenido HTML a convertir (Solo aplica si es from: content)
  options? : IPdfOptions         // Opciones de configuración del PDF
  attached?: IAttachedConfig,    // Configuración para la carga del PDF a un servidor
}
//@end
