// @import types
// @end

// @add your types
export type MailerDriver = "ses" | "smtp";

// Direccion URL del plugin - https://nodemailer.com/about/
export interface MailerAttachment {
  filename           : string,   // Nombre de archivo que se enviara como el nombre del archivo adjunto. Se permite el uso de unicode.
  content?           : any,      // String, búfer o Stream para el archivo adjunto
  path?              : string,   // Ruta al archivo si desea transmitir el archivo en lugar de incluirlo (mejor para archivos adjuntos más grandes)
  contentType?       : string,   // El tipo de contenido opcional para el archivo adjunto, si no se establece, se derivará de la propiedad de nombre de archivo
  contentDisposition?: string,   // Tipo de disposición de contenido opcional para el adjunto, el valor predeterminado es 'adjunto'
  cid?               : string,   // ID de contenido opcional para usar imágenes en línea en el origen de mensajes HTML
  encoding?          : string,   // Si set y content es una cadena, codifica el contenido en un Buffer utilizando la codificación especificada. Valores de ejemplo: "base64", "hex", "binario", etc. Útil si desea utilizar archivos adjuntos binarios en un objeto de correo electrónico con formato JSON.
  headers?           : string,   // Encabezados personalizados para el nodo adjunto. El mismo uso que con los encabezados de mensajes.
  raw?               : string,   // Es un valor especial opcional que anula todo el contenido del nodo mime actual, incluidos los encabezados mime. Útil si quieres preparar los contenidos del nodo tú mismo.
}

export interface MailerHtmlTemplate {
  path_template: string,
  path_layout?: string,
  params?: {},
}

export interface MailOptions {
  driver?       : "smtp" | "ses";              // Metodo de envio del email. Sobre-escribe la configuración proporcionada desde las variables de configuración globales
  from?         : string,                      // Direccion de quien envia: 'sender@server.com' | '"Sender Name" <sender@server.com>'
  to            : Array<string>,               // Lista de receptores: Array
  cc?           : Array<string>,               // Lista de receptores como copia: Array
  bcc?          : Array<string>,               // Lista de receptores como bcc: Array
  subject       : string,                      // Asunto del mensaje
  text?         : string                       // Version en texto plano del cuerpo del mensaje
  html?         : string,                      // Cuerpo del mensaje en formato HTML,
  attachments?  : Array<MailerAttachment>      // Array de objetos adjuntos al mensaje
  html_template?: MailerHtmlTemplate | null,   // Template que se desea enviar
  template?     : string                       // Nombre del archivo que se usara como template para el email, se asigna automaticamente
  context?      : Object                       // Parametros que se pasan al template del email, se construyen automaticamente
  hbsConfig?    : Object                       // Configuración de nodemailer-express-handlebars
  amount_notifications?: number | null
};

export interface MailerSMTPConfig {
  host?    : string;   // El nombre del host del servidor de correo entrante
  port?    : string;   // El número de puerto que usa el servidor de correo entrante.
  user?    : string;   // El nombre de usuario para esta cuenta
  password?: string;   // La contraseña del servidor de correo
  smtpauth?: boolean;
}

export interface MailerSESConfig {
  credentials? : string;  // Llave de configuración de Amazon S3
}

export interface MailerSendPulseConfig {
  cli_id?: string // Identificador del cliente
  secret_id?: string // Identificador secreto
}

export interface MailerSESSendMail {
  transporter: any,
  mail_options: MailOptions
}

export interface MailerSMTPSendMail {
  transporter: any,
  mail_options: MailOptions
}

export interface MailerSendPulseSendMail {
  token: any,
  mail_options: MailOptions
}
//@end
