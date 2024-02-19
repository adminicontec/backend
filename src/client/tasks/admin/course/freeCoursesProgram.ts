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
// @end

class FreeCoursesProgram extends DefaultPluginsTaskTaskService {

  /**
   * Metodo que contiene la logica de la tarea
   * @return Booleano que identifica si se pudo o no ejecutar la tarea
   */
  public run = async (taskParams: TaskParams) => {
    // @task_logic Add task logic
    console.log("execute task")
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
          const startDate = moment(enrollment.created_at)
          const endDate = moment()
          const seconds = endDate.diff(startDate, 'seconds')
          if (seconds > validityTime) {
            const result = await enrollmentService.delete({ id: enrollment._id })
            if (result.status === 'error') {
              console.log('FreeCoursesProgram -> verifyStudentsValidity -> removeEnrollmentError: ', result)
            }
          }
        }
      }
    } catch (e) {
      console.log('FreeCoursesProgram -> verifyStudentsValidity -> ERROR: ', e)
    }
  }
  // @end
}

export const freeCoursesProgram = new FreeCoursesProgram();
export { FreeCoursesProgram };
