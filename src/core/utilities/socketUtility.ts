// @import_dependencies_node Import libraries
import socketio from "socket.io";
// @end

// @import_config_files Import config files
import { socket } from "@scnode_core/config/globals";
// @end

// @import utilities
import {jwtUtility} from '@scnode_core/utilities/jwtUtility'
import { requestUtility } from "@scnode_core/utilities/requestUtility";
import { responseUtility} from '@scnode_core/utilities/responseUtility'
// @end

// @import types
import {ISocketioOptions} from '@scnode_core/types/default/socket/socketTypes'
// @end

class SocketUtility {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite generar una conexión al socket
   * @param server Servidor donde se ejecutara el socket
   * @returns
   */
  public connect = (server) => {

    // @INFO: Se busca instancia de socket service, si el usuario proporciona una instancia esta se sobreescribira
    const socket_service_instance = requestUtility.serviceInstance("socket",'default','socket');
    if (socket_service_instance.status === 'error') return null;
    const socket_service = socket_service_instance['service'];

    socket.io = socketio(server); // Generando instancia de Socket

    // @INFO: Middleware de autenticación
    socket.io.use(async (socket, next) => {
      const token = socket.handshake.query.token
      try {
        const payload = jwtUtility.jwtDecode(token,jwtUtility.getJwtSecret(null));
        socket.handshake.query.user = payload
        next()
      } catch (e) {
        let response = responseUtility.buildResponseFailed('json',null,{error_key: 'jwt.token_invalid'})
        if (e.message == 'Token expired') {
          response = responseUtility.buildResponseFailed('json',null,{error_key: 'jwt.token_expired'})
        }
        let err: any = new Error("not authorized");
        err.data = response; // additional details
        next(err);
      }
    });

    socket.io.on('connection', (s) => {
      socket.instance = s;

      socket_service.connected(); // Default para conexión, se sobreescribe si el usuario tiene su propio servicio socket service extendido
      socket_service.disconnect(); // Default para desconexión, se sobreescribe si el usuario tiene su propio servicio socket service extendido

      socket_service.joinRoom(s) // Evento de escucha (join-room) que permite unirse a uno o varios salones
      socket_service.leaveRoom(s) // Evento de escucha (leave-room) que permite salirse de uno o varios salones

      try {
        // @init_events_by_clasess
        const base_dir = __dirname.split('core');
        const _events  = require(`${base_dir[0]}app/events/socketio/index`);
        for (const key in _events.events) {
          if (_events.events.hasOwnProperty(key)) {
            const element = _events.events[key];
            element.events(s);
          }
        }
        // @end
      } catch (e) {
        console.log('Los eventos no pudieron ser cargados')
      }
    });
  }

  /**
   * Metodo que permite agregar un evento al socket
   * @param socket Instancia del socket
   * @param event_name Nombre del evento a generar
   * @param fn Funcion a ejecutar
   */
  public add = (socket, event_name, fn) => {
    socket.on(event_name, (params) => {
      fn(params, {
        socket_query: socket.handshake.query,
        socket: socket
      })
    });
  }

  /**
   * Metodo que permite crear un salon de socket
   * @param socket Instancia del socket
   * @param fn Funcion a ejecutar
   */
  public addRoom = (socket, fn) => {
    fn({
      socket_query: socket.handshake.query
    },socket)
  }

  /**
   * Metodo que permite emitir un evento al socket del cliente
   * @param event_name Nombre del evento a generar
   * @param [data] Información que se enviara por el evento
   * @param [socketId] Array | string que representa los canales donde se va a emitir el evento
   */
  public emit = (event_name, data: any = {}, socketId: string | Array<string> | null = null) => {
    if (socketId) {
      if (Array.isArray(socketId)) {
        let aux = socket.io
        for (const conn in socketId) {
          const element = socketId[conn];
          aux.to(element)
        }
        aux.emit(event_name, data)
      } else {
        socket.io.to(socketId).emit(event_name, data)
      }
    } else {
      socket.io.sockets.emit(event_name, data)
    }
  }

  /**
   * Metodo que permite validar los parametros de una solicitud
   * @param socket Instancia del socket
   * @param fields_config Objeto con los parametros a validar
   * @param [fields_request] Objetos proporcionados por el cliente
   * @param [files_request] Objetos proporcionados por el cliente
   * @returns
   */
  public middlewareValidator = async (socket: any, fields_config: Array<any>, fields_request: any = {}, files_request: any = {}) => {

    const response = await requestUtility.validator(fields_request, files_request, fields_config)
    if (response.hasError === true) {
      const json = responseUtility.buildResponseFailed('json', null, {
        error_key: 'fields_in_request.invalid_request_fields',
        additional_parameters: { fields_status: response.fields_status },
      })
      this.emit('socket_validator', json, socket.id)
      return json
    }
    return responseUtility.buildResponseSuccess('json')
	}
}

export const socketUtility = new SocketUtility();
export { SocketUtility }
