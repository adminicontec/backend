// @import types
// @end

// @add your types
export interface ISocketioOptions {
  socket_query: { // Objeto que contiene la estructura de socket.handshake.query
    token?: string, // Token de autenticación
    user?: { // Objeto que representa la información del token de autenticación
      sub: string,
      iat: number,
      exp: number,
      locale: string,
      i18n_configuration: Array<any>
    }
  },
  socket: any // Instancia del socket
}
//@end
