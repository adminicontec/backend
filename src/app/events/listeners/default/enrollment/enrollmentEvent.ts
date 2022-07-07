// @import_dependencies_node Import libraries
// @end

// @import_service Import service
import { DefaultEventsListenersEnrollmentEnrollmentService as Service } from "@scnode_app/services/default/events/listeners/enrollment/enrollmentService";
// @end

// @import utils
// @end

class EnrollmentEvent {

  // @instance_service
  public service: Service = new Service();
  // @end

  constructor () {}

  /**
  * Metodo que permite agregar rutas especificas por evento
  * @param emitter Instancia de Emmiter
  */
  public events(emitter): void {
    // @add_events Add events: Ej: socketUtility.add(socket, 'event-name', this.service.method);
    emitter.on('enrollment:massive', this.service.enrollmentMassiveEvent)
    // @end
  }
}

export const enrollmentEvent = new EnrollmentEvent();
export { EnrollmentEvent as DefaultEventsListenersEnrollmentEnrollmentEvent };
