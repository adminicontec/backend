// @import types
import {WorkBook} from "xlsx";
import {UploadConfig} from '@scnode_core/types/default/attached/attachedTypes'
// @end

// @add your types
export interface IBuildXLSX {
  jsonData   : Array<{}>,
  arrayHeader: Array<string>,
  filename   : string,
  skipHeader : boolean
  type?      : 'base64' | 'binary' | 'buffer' | 'file' | 'array' | 'string',
  wb?        : WorkBook | null,
}

export interface IGenerateXLSXConfig {
  from: 'file' | 'content'  // Origen del tipo de información a convertir en XSLX (File: Archivo hbs o html | content: Contenido Html)
  attached?: IAttachedConfig,     // Configuración para la carga del XSLX a un servidor
}


export interface IAttachedConfig {
  file: {
    name: string,   // Nombre original del archivo adjunto (Ex: car.jpg)
  },
  upload_config?: UploadConfig // Información para la carga del XSLX al servidor
  path_upload_default?: string // Ubicación por defecto donde se alojaran los XSLX
}
//@end
