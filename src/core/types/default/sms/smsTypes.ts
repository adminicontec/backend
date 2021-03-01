// @import types
// @end

// @add your types
export type SmsDriver = "demo"

export interface SmsOptions {
  driver?        : "demo";    // Metodo de envio del email. Sobre-escribe la configuración proporcionada desde las variables de configuración globales
  number         : string,    // Número telefonico del destinatario
  country_code   : string,    // Codigo del pais del destinatario (Ex. 57, 51)
  message        : string,    // Mensaje de texto que se va a enviar
}

export interface SmsLabsConfig {
	default_conection : String;  // Llave de la conexión por defecto para el envío de SMS
  conections        : Array<SmsLabsConectionsConfig>;  // Objeto con las distintas conexiones disponibles
}

export interface SmsLabsConectionsConfig {
	key      : String; // Llave para indicar la conexión
	username : String; // Nombre de usuario en labsmobile
	password : String; // Contraseña en labsmobile
}


export interface SmsSmsmasivosConfig {
	default_conection: String;                                // Llave de la conexión por defecto para el envío de SMS
	conections       : Array<SmsSmsmasivosConectionsConfig>;  // Objeto con las distintas conexiones disponibles
}

export interface SmsSmsmasivosConectionsConfig {
	key      : String; // Llave para indicar la conexión
	api_key  : String; // API KEY de SMSmasivos
  version? : String | number; // Verion del API (1 0 2), por defecto de usa la versión 1
}
//@end

