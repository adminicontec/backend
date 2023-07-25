// @import_events
import { enrollmentEvent } from "@scnode_app/events/listeners/default/enrollment/enrollmentEvent";
import { courseSchedulingEvent } from "@scnode_app/events/listeners/default/courseScheduling/courseSchedulingEvent";
// @end

// @export_events
export const events = {
  // @add_events_object
  enrollmentEvent,
  courseSchedulingEvent,
  // @end
}
// @end
