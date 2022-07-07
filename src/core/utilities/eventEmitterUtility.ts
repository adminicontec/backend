// @import_dependencies_node Import libraries
const EventEmitter2 = require('eventemitter2');
// @end

// @import_config_files Import config files
// @end

// @import utilities
// @end

// @import types
// @end

class EventEmitterUtility {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  private emitter;

  constructor() {
    if (!this.emitter) {
      this.emitter = new EventEmitter2()
    }
  }

  public init = () => {
    try {
      const _events = require('../../app/events/listeners/index').events;
      for (const key in _events) {
        if (_events.hasOwnProperty(key)) {
          const element = _events[key];
          element.events(this.emitter);
        }
      }
    } catch (e) {
      console.log('Los eventos no pudieron ser cargados')
    }
  }

  public emit = (key: string, value: any) => {
    this.emitter.emit(key, value)
  }
}

export const eventEmitterUtility = new EventEmitterUtility();
export { EventEmitterUtility }
