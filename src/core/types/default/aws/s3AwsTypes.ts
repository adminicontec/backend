// @import types
// @end

// @add your types
export interface S3Credentials {
  key                  : string; // Identificador de la credencial
  AWS_ACCESS_KEY       : string; // ID de clave de acceso
  AWS_SECRET_ACCESS_KEY: string; // Clave de acceso secreta
  REGION               : string; // Region del producto en Amazon console
  Bucket               : string; // Nombre del bucket donde se alojaran los archivos
}
//@end
