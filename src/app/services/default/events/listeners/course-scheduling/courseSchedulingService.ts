// @import_dependencies_node Import libraries
// @end

// @import services
import { courseSchedulingService as courseSchedulingServiceAdmin } from '@scnode_app/services/default/admin/course/courseSchedulingService'
// @end

// @import utilities
import { moodleCourseService } from '@scnode_app/services/default/moodle/course/moodleCourseService';
import { CourseScheduling, CourseSchedulingDetails } from '@scnode_app/models';
import { CourseSchedulingProvisioningMoodleStatus, IProvisioningMoodleCoursesParams, ItemsToDuplicate } from '@scnode_app/types/default/admin/course/courseSchedulingTypes';
import { courseContentService } from '@scnode_app/services/default/moodle/course/courseContentService';
import { courseSchedulingDetailsService } from '@scnode_app/services/default/admin/course/courseSchedulingDetailsService';
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
    itemsToDuplicate,
  }: IProvisioningMoodleCoursesParams) => {
    steps.push('22')
    const moodleResponse: any = await moodleCourseService.createFromMaster(paramsMoodle)
    steps.push(moodleResponse)
    if (moodleResponse.status === 'success') {
      steps.push('23')
      if (moodleResponse.course && moodleResponse.course.id) {
        steps.push('24')
        await CourseScheduling.findByIdAndUpdate(_id, { moodle_id: moodleResponse.course.id }, {
          useFindAndModify: false,
          new: true,
          lean: true,
        })
        if (shouldDuplicateSessions) {
          try {
            await this.duplicateSessions({
              itemsToDuplicate,
              logs: steps,
              newSchedulingID: _id,
              originalScheduling,
            })
          } catch (e) {
            steps.push('Cloning sessions ERROR')
            this.updateCourseSchedulingStatus(_id, CourseSchedulingProvisioningMoodleStatus.ERROR, steps)
            return
          }
        }
        steps.push('25')
        this.updateCourseSchedulingStatus(_id, CourseSchedulingProvisioningMoodleStatus.COMPLETED, [])
        if ((params.sendEmail === true || params.sendEmail === 'true') && (response && response.schedulingStatus && response.schedulingStatus.name === 'Confirmado')) {
          steps.push('26')
          await courseSchedulingServiceAdmin.checkEnrollmentUsers(response)
          await courseSchedulingServiceAdmin.checkEnrollmentTeachers(response)
          await courseSchedulingServiceAdmin.serviceSchedulingNotification(response, prevSchedulingStatus)
        }
      } else {
        steps.push('24-b')
        // await courseSchedulingServiceAdmin.delete({ id: _id })
        this.updateCourseSchedulingStatus(_id, CourseSchedulingProvisioningMoodleStatus.ERROR, steps)
        return
      }
    } else {
      // await courseSchedulingServiceAdmin.delete({ id: _id })
      this.updateCourseSchedulingStatus(_id, CourseSchedulingProvisioningMoodleStatus.ERROR, steps)
      return
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

  duplicateSessions = async ({ originalScheduling, newSchedulingID, logs, itemsToDuplicate }) => {
    const newCourseScheduling = await CourseScheduling.findOne(newSchedulingID).select('id moodle_id');
    const newCourseMoodleId = newCourseScheduling.moodle_id;
    logs.push(
      {key: newCourseScheduling._id, type: 'CourseScheduling'}
    )

    if (itemsToDuplicate && itemsToDuplicate.includes(ItemsToDuplicate.COURSE_SCHEDULING_DETAILS)) {
      const {courseContents}: any = await courseContentService.list({courseID: newCourseMoodleId})
      if (courseContents && Array.isArray(courseContents)) {
        const courseContentGrouped = courseContents.reduce((accum, element) => {
          if (element?.description) {
            accum[element.description.toString()] = element
          }
          return accum
        }, {})

        const courseSchedulingDetailsOrigin = await CourseSchedulingDetails.find({course_scheduling: originalScheduling._id})
        .select('id course')
        .populate({path: 'course', select: 'id name moodle_id code'})
        .lean()
        for (const courseSchedulingDetail of courseSchedulingDetailsOrigin) {
          if (courseSchedulingDetail?.course?.code && courseContentGrouped[courseSchedulingDetail?.course?.code.toString()]) {
            const courseSection = courseContentGrouped[courseSchedulingDetail?.course?.code.toString()];
            const newCourseData: {value: number, label: string, code: string} = {
              code: courseSection.description,
              label: `${courseSection.description} | ${courseSection.name}`,
              value: courseSection.id
            }
            const newCourseSchedulingDetailResponse = await courseSchedulingDetailsService.duplicateCourseSchedulingDetail({
              courseSchedulingDetailId: courseSchedulingDetail._id,
              courseSchedulingId: newCourseScheduling._id,
              course: newCourseData
            })
            if (newCourseSchedulingDetailResponse.status === 'success') {
              const newCourseSchedulingDetail = newCourseSchedulingDetailResponse.newCourseSchedulingDetail;
              logs.push(
                {key: newCourseSchedulingDetail._id, type: 'CourseSchedulingDetail'}
              )
            }

          }
        }
      }
    }
  }

}

export const courseSchedulingService = new CourseSchedulingService();
export { CourseSchedulingService as DefaultEventsListenersCourseSchedulingCourseSchedulingService };
