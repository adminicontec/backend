// @import_services Import Services
import { DefaultPluginsTaskTaskService } from "@scnode_core/services/default/plugins/tasks/taskService";
// @end

// @import_models Import models
// @end

// @import_utilitites Import utilities
// @end

// @import types
import {TaskParams} from '@scnode_core/types/default/task/taskTypes'
import { CourseScheduling, CourseSchedulingStatus, Enrollment, User } from "@scnode_app/models";
import { TypeCourse } from "@scnode_app/types/default/admin/course/courseSchedulingTypes";
import { EnrollmentOrigin, EnrollmentStatus } from '@scnode_app/types/default/admin/enrollment/enrollmentTypes';
import moment from "moment";
import { enrollmentService } from "@scnode_app/services/default/admin/enrollment/enrollmentService"
import { courseSchedulingNotificationsService } from '@scnode_app/services/default/admin/course/courseSchedulingNotificationsService';
import { certificateMultipleService } from "@scnode_app/services/default/admin/certificate/certificateMultipleService";
import { ICertificateMultipleDataCertification } from '@scnode_app/types/default/admin/certificate/certificateMultipleTypes';
import { system_user } from '@scnode_core/config/globals';
import { CourseSchedulingStatusName } from "@scnode_app/types/default/admin/course/courseSchedulingStatusTypes";
// @end

interface IEnrollment {
  _id: string
  created_at: string
  user: string
}

class FreeCoursesProgram extends DefaultPluginsTaskTaskService {

  /**
   * Metodo que contiene la logica de la tarea
   * @return Booleano que identifica si se pudo o no ejecutar la tarea
   */
  public run = async (taskParams: TaskParams) => {
    // @task_logic Add task logic
    await this.verifyStudentsValidity()
    // @end

    return true; // Always return true | false
  }

  // @add_more_methods
  private verifyStudentsValidity = async () => {
    try {
      const courseSchedulingStatus = await CourseSchedulingStatus
        .find({ name: { $in: [CourseSchedulingStatusName.CONFIRMED] } })
        .select('_id')
      const courseSchedulings = await CourseScheduling.find({
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
        schedulingStatus: { $in: courseSchedulingStatus?.map(({ _id }) => _id) },
        typeCourse: { $in: [TypeCourse.FREE, TypeCourse.MOOC] }
      }).select('_id metadata serviceValidity')
      for (const courseScheduling of courseSchedulings) {
        const validityTime = courseScheduling?.serviceValidity ? courseScheduling.serviceValidity : 0
        const enrollments = await Enrollment.find({
          course_scheduling: courseScheduling._id,
          origin: EnrollmentOrigin.AUTOREGISTRO,
          deletedAt: { $exists: false },
        }).select('_id created_at user')
        if (!enrollments?.length) continue
        for (const enrollment of enrollments) {
          let currentStatus = await this.getCurrentEnrollmentStatus(enrollment._id)

          const userWasRemoved = await this.validateConditionsToRemoveUser(enrollment, validityTime)
          if (userWasRemoved) continue;

          if (currentStatus === EnrollmentStatus.IN_PROGRESS) {
            await this.verifyStudentQualifications(enrollment, courseScheduling._id)
            currentStatus = await this.getCurrentEnrollmentStatus(enrollment._id)
          }

          if ([EnrollmentStatus.REGISTERED, EnrollmentStatus.IN_PROGRESS].includes(currentStatus)) {
            await this.sendReminderBeforeFinishCourse(enrollment, validityTime, courseScheduling._id)
          }
        }
      }
    } catch (e) {
      console.log('FreeCoursesProgram -> verifyStudentsValidity -> ERROR: ', e)
    }
  }

  private validateConditionsToRemoveUser = async (enrollment: IEnrollment, validityTime: number): Promise<boolean> => {
    try {
      const startDate = moment(enrollment.created_at)
      const today = moment()
      const seconds = today.diff(startDate, 'seconds')
      if (seconds > validityTime) {
        const result = await enrollmentService.delete({ id: enrollment._id })
        if (result.status === 'success') {
          return true
        }
        if (result.status === 'error') {
          console.log('FreeCoursesProgram -> validateConditionsToRemoveUser -> removeEnrollmentError: ', result)
        }
      }
      return false
    } catch (e) {
      console.log('FreeCoursesProgram -> validateConditionsToRemoveUser -> ERROR: ', e)
      return false
    }
  }

  private sendReminderBeforeFinishCourse = async (enrollment: IEnrollment, validityTime: number, courseSchedulingId: string): Promise<boolean> => {
    try {
      const startDate = moment(enrollment.created_at)
      const expectedFinishDate = moment(enrollment.created_at).add(validityTime, 'second')
      const validityTimeInDays = expectedFinishDate.diff(startDate, 'days')
      const today = moment()
      const daysRemaining = expectedFinishDate.diff(today, 'days')
      if (validityTimeInDays > 8 && daysRemaining === 8) {
        await courseSchedulingNotificationsService.sendReminderEmailForFreeOrMooc(courseSchedulingId, enrollment.user)
        return true
      }
      return false
    } catch (e) {
      console.log('FreeCoursesProgram -> sendReminderBeforeFinishCourse -> ERROR: ', e)
      return false
    }
  }

  private verifyStudentQualifications = async (enrollment: IEnrollment, courseSchedulingId: string): Promise<Boolean> => {
    try {
      const certifications = await certificateMultipleService.certificateData({
        course_scheduling: courseSchedulingId,
        studentId: enrollment.user,
        without_certification: true,
      })
      const allCertifications: ICertificateMultipleDataCertification[] = certifications?.student?.certifications || []
      const approvedCertifications = allCertifications?.filter((certification) => certification.approved)
      const courseHasFinished = allCertifications?.length > 0 && allCertifications?.length === approvedCertifications?.length
      console.log({ approvedCertifications, certifications, courseHasFinished, allCertifications })
      if (approvedCertifications?.length) {
        const systemUser = await User.findOne({ username: system_user }).select('_id')
        const response = await certificateMultipleService.generateCertificate({
          courseSchedulingId: courseSchedulingId,
          students: [{
            userId: enrollment.user,
            certificateSettings: approvedCertifications?.map((certificate) => ({
              certificateSettingId: certificate.certificateSettingId,
              isPartial: certificate.isPartial,
            }))
          }],
          user: systemUser?._id,
          needPayment: true,
        })
        if (response?.status === 'error') {
          console.log('FreeCoursesProgram -> verifyStudentQualifications -> GenerateCertificates -> ERROR: ', response)
          return false
        }
      }
      if (courseHasFinished) {
        await courseSchedulingNotificationsService.sendFreeMoocCourseFinished(courseSchedulingId, enrollment.user)
        return true
      }
      return false
    } catch (e) {
      console.log('FreeCoursesProgram -> verifyStudentQualifications -> ERROR: ', e)
      return false
    }
  }

  private getCurrentEnrollmentStatus = async (enrollmentId: string): Promise<EnrollmentStatus | null> => {
    const currentStatusResponse: any = await enrollmentService.getCurrentEnrollmentStatus({ enrollmentId })
    if (currentStatusResponse?.status === 'error') return null
    return currentStatusResponse.currentStatus
  }
  // @end
}

export const freeCoursesProgram = new FreeCoursesProgram();
export { FreeCoursesProgram };
