// @import types
// @end

// @add your types
export interface FileFormat {
  name        : string,    // Nombre original del archivo adjunto (Ex: car.jpg)
  mv          : any,       // Una función para mover el archivo a otro lugar en su servidor
  mimetype    : string,    // El mimetype del archivo
  data        : any,       // Una representación del búfer de su archivo, devuelve el búfer vacío en caso de que la opción useTempFiles se haya establecido en verdadero.
  tempFilePath: any,       // Una ruta al archivo temporal en caso de que la opción useTempFiles se configurara como verdadera.
  truncated   : boolean,   // Un valor booleano que representa si el archivo está por encima del límite de tamaño.
  size        : number,    // Tamaño cargado en bytes
  md5         : string,    // MD5 del archivo cargado
}

export interface UploadConfig {
  driver?        : AttachedDriver;  // Metodo de carga de los archivos. Sobre-escribe la configuración proporcionada desde las variables de configuración globales
  rename?        : boolean;                  // Renombrar el archivo con el algoritmo propio del sistema. Default true
  file_size?     : number | null;            // Valida el tamaño del archivo a cargar. Su valor se representa en byte(B) Default NULL
  file_mime_type?: Array<string> | null;     // Valida el formato (MIME) del archivo a cargar. Default NULL
  file_dimensions?: {
    width: number,
    height: number
  },
  path_upload?: string,   // Ruta del directorio donde se almacenara el archivo
  credentials?: string;   // Llave de configuración
  base_path?  : string    // Ruta base de servidor
  base_path_type?: "absolute" | "relative" // Tipo de ruta base de servidor
}

export enum AttachedDriver {
  SERVER = 'server',
  S3 = 's3',
  FTP = 'ftp'
}

export interface AttachedFtpConfig {
  connections?: any
}

export type AttachedS3Config = {
  credentials? : string;  // Llave de configuración de Amazon S3
}
export interface AttachedServerConfig {
  base_path?: string
}
//@end

