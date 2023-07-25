// @import_dependencies_node Import libraries
// @end

// @import_service Import service
import { DefaultEventsListenersCourseSchedulingCourseSchedulingService as Service } from "@scnode_app/services/default/events/listeners/course-scheduling/courseSchedulingService";
import { CourseSchedulingEventType } from "@scnode_app/types/default/admin/course/courseSchedulingTypes";
// @end

// @import utils
// @end

class CourseSchedulingEvent {

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
    emitter.on(CourseSchedulingEventType.PROVISIONING_MOODLE_COURSES, this.service.provisioningMoodleCourses)
    // @end
  }
}

export const courseSchedulingEvent = new CourseSchedulingEvent();
export { CourseSchedulingEvent as DefaultEventsListenersEnrollmentCourseSchedulingEvent };
