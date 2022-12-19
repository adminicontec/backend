// @import types
// @end

// @add your types
export interface HttpStructure{
  api     : string;          // Direccion URL del servidor web a donde se va a apuntar la peticion: EJ: http://www.site.com
  url     : string;          // Direccion URL hacia donde apunta la peticion: EJ: /api/url-http (NO incluye la direccion del sitio)
  params? : object | String; // Parametros que se envian por la peticion
  querystringParams? : object | String; // Parametros que se envian por query String
  headers?: object;          // Encabezados de la peticion
  req?    : object | null    // Objeto de clase Request de express
  sendBy?  : 'body' | 'form' | null | undefined // Define el metodo usado para enviar los parametros de la peticion (Solo disponible para el metodo POST)
}

export interface OptionsRequestPromise {
  uri?    : string,            // Direccion URL completa hacia donde se apunta la peticion
  json?   : boolean,           // Convertir automaticamente la respuesta en JSON
  headers?: object,            // Encabezados que se anexan a la peticion,
  qs?     : object,            // Parametros que se envian por la peticion (Solo disponible para el metodo GET)
  method? : string,            // Metodo de envio de la peticion: POST
  form?   : object | String;   // Parametros que se envian por la peticion (Solo disponible para el metodo POST)
  body?   : object | String;   // Parametros que se envian por la peticion (Solo disponible para el metodo POST)
  req?    : object | null      // Objeto de clase Request de express
}

export interface HttpCustomStructure {
  method      : 'get' | 'post' | 'put' | 'delete'  // Metodos HTTP habilitados para envio de peticiones
  url         : string,         // Ruta parcial del punto destino de la petición
  api?        : string,         // URL del sistema hacia el cual se van a realizar las peticiones. Por defecto toma el valor de main_external_api
  api_link?   : string,         // URL del api a la que se desa conectar, de la forma http(s)://..
  params?     : object | String | any,// Parametros que se enviaran a la petición
  querystringParams?: object | String | any,
  headers?    : object,         // Encabezados de la peticion
  req?        : object,         // Objeto de clase Request express
  sendBy?  : 'body' | 'form' | null | undefined // Define el metodo usado para enviar los parametros de la peticion (Solo disponible para el metodo POST)
}
//@end

