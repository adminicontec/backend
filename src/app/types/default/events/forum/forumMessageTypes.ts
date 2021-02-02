// @import types
// @end

// @add your types
export interface ISendMessage {
  user: string // Identificador del usuario
  forum: string // Identificador del foro
  attachment?: any // Objeto tipo File que contiene el archivo adjunto
  message?: string // Mensaje
  socket_emit?: boolean // Indica si se ejecutara la emision de socket
}

export interface IForumMessage {
  text?: string // Mensaje
  attached?: string // Archivo adjunto
  date: string // Fecha del mensaje
  dateFormated?: any // Fecha formateada
}

export interface IForumMessagesData {
  messages: Array<any> | any // Array con los mensajes del foro
  user: any // Objeto de clase User
}

export interface IForumMessageData {
  forum: any // Objeto con la data del Foro
  message: IForumMessage // Mensaje
  posted_by: any // Objeto de clase User
}

export interface IForumMessageDelete {
  forum: string //Identificador del foro
  user: string // Identificador del usuario
  id: string // Identificador del mensaje
}
//@end
