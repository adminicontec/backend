// @import_services Import Services
import { DefaultPluginsTaskTaskService } from "@scnode_core/services/default/plugins/tasks/taskService";
// @end

// @import_models Import models
// @end

// @import_utilitites Import utilities
// @end

// @import types
import {TaskParams} from '@scnode_core/types/default/task/taskTypes'
import { CourseScheduling, Enrollment } from "@scnode_app/models";
import { TypeCourse } from "@scnode_app/types/default/admin/course/courseSchedulingTypes";
import { EnrollmentOrigin } from '@scnode_app/types/default/admin/enrollment/enrollmentTypes';
import moment from "moment";
import { enrollmentService } from "@scnode_app/services/default/admin/enrollment/enrollmentService"
import { courseSchedulingNotificationsService } from '@scnode_app/services/default/admin/course/courseSchedulingNotificationsService';
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
      const courseSchedulings = await CourseScheduling.find({
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
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
          const userWasRemoved = await this.validateConditionsToRemoveUser(enrollment, validityTime)
          if (userWasRemoved) continue;
          const reminderSent = await this.sendReminderBeforeFinishCourse(enrollment, validityTime, courseScheduling._id)
          if (reminderSent) continue;
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
      const expectedFinishDate = startDate.add(validityTime, 'second')
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
  // @end
}

export const freeCoursesProgram = new FreeCoursesProgram();
export { FreeCoursesProgram };
