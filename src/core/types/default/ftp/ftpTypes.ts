// @import types
// @end

// @add your types
export interface FtpConfig {
  host    : string;   // Server host
  user    : string;   // Username
  password: string;   // Password
  port    : number;   // Server port,
  secure  : boolean;  // Explicit FTPS over TLS
  debug   : boolean;  // Habilita/deshabilita el modo de depuración
}

export interface FtpStructureConfig {
  base_path?      : string | null;  // Ubicación dentro del servidor FTP que se tomara como lugar por defecto
  file_dir_path?  : string | null;  // Secuencia de directorios dentro del servidor FTP
  file_information?: {               // Información relacionada a un archivo
    local_path      : string,   // Dirección absoluta del archivo local que se desea mover al servidor FTP
    remote_file_name: string,   // Nombre que se asignara al archivo dentro del servidor FTP
  }
}
//@end
