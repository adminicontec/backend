// @import_dependencies_node Import libraries
// @end

// @import_config_files Import config files
import { socket } from "@scnode_core/config/globals";
// @end

// @import_utilities Import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

class SocketService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que se ejecuta inmediatamente cuando se genera una conexión al socket
   */
  public connected = () => {
    console.log('User connected');
  }

  /**
   * Metodo que se ejecuta inmediatamente cuando se desconecta del socket
   */
  public disconnect = () => {
    socket.instance.on('disconnect', () => {
      console.log('User disconnected')
    });
  }

  /**
   * Metodo que permite crear o unirse a un salon de socket
   * @param socketio Instancia de sesión de socket
   */
  public joinRoom = (socketio) => {
    socket.instance.on('join-room', (params) => {
      if (params.room) {
        socketio.join(params.room)
      }
    });
  }

  /**
   * Metodo que permite salirse de un salon de socket
   * @param socketio Instancia de sesión de socket
   */
  public leaveRoom = (socketio) => {
    socket.instance.on('leave-room', (params) => {
      if (params.room) {
        if (typeof params.room === 'string') {
          socketio.leave(params.room)
        } else if (Array.isArray(params.room)) {
          params.room.map((r) => {
            socketio.leave(r)
          })
        }
      }
    });
  }
}

export const socketService = new SocketService();
export { SocketService as DefaultSocketSocketService };
