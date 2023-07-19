// @import_dependencies_node Import libraries
// @end

// @import services
import { courseSchedulingService as courseSchedulingServiceAdmin } from '@scnode_app/services/default/admin/course/courseSchedulingService'
// @end

// @import utilities
import { moodleCourseService } from '@scnode_app/services/default/moodle/course/moodleCourseService';
import { CourseScheduling } from '@scnode_app/models';
import { CourseSchedulingProvisioningMoodleStatus, IProvisioningMoodleCoursesParams } from '@scnode_app/types/default/admin/course/courseSchedulingTypes';
// @end

// @import models
// @end

// @import types
// @end

class CourseSchedulingService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  provisioningMoodleCourses = async ({
    steps,
    paramsMoodle,
    params,
    response,
    _id,
    prevSchedulingStatus,
    shouldDuplicateSessions,
    originalScheduling,
  }: IProvisioningMoodleCoursesParams) => {
    steps.push('22')
    const moodleResponse: any = await moodleCourseService.createFromMaster(paramsMoodle)
    steps.push(moodleResponse)
    if (moodleResponse.status === 'success') {
      steps.push('23')
      if (moodleResponse.course && moodleResponse.course.id) {
        steps.push('24')
        if (shouldDuplicateSessions) {
          // TODO: Duplicate sessions
        }
        await CourseScheduling.findByIdAndUpdate(_id, {
          moodle_id: moodleResponse.course.id,
          provisioningMoodle: {
            status: CourseSchedulingProvisioningMoodleStatus.COMPLETED,
            logs: [],
          }
        }, {
          useFindAndModify: false,
          new: true,
          lean: true,
        })
        steps.push('25')
        if ((params.sendEmail === true || params.sendEmail === 'true') && (response && response.schedulingStatus && response.schedulingStatus.name === 'Confirmado')) {
          steps.push('26')
          await courseSchedulingServiceAdmin.checkEnrollmentUsers(response)
          await courseSchedulingServiceAdmin.checkEnrollmentTeachers(response)
          await courseSchedulingServiceAdmin.serviceSchedulingNotification(response, prevSchedulingStatus)
        }
      } else {
        steps.push('24-b')
        await courseSchedulingServiceAdmin.delete({ id: _id })
        this.updateCourseSchedulingStatus(_id, CourseSchedulingProvisioningMoodleStatus.ERROR, steps)
      }
    } else {
      await courseSchedulingServiceAdmin.delete({ id: _id })
      this.updateCourseSchedulingStatus(_id, CourseSchedulingProvisioningMoodleStatus.ERROR, steps)
    }
  }

  updateCourseSchedulingStatus = async (_id: string, status: CourseSchedulingProvisioningMoodleStatus, logs: string[] = []) => {
    await CourseScheduling.findByIdAndUpdate(_id, {
      provisioningMoodle: {
        status,
        logs,
      }
    }, {
      useFindAndModify: false,
      new: true,
      lean: true,
    })
  }

}

export const courseSchedulingService = new CourseSchedulingService();
export { CourseSchedulingService as DefaultEventsListenersCourseSchedulingCourseSchedulingService };
