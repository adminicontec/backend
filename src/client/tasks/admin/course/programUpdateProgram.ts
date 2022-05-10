// @import_services Import Services
import { DefaultPluginsTaskTaskService } from "@scnode_core/services/default/plugins/tasks/taskService";
// @end

// @import_models Import models
import { Program } from "@scnode_app/models";
// @end

// @import_utilitites Import utilities
import { masterCategoryService } from "@scnode_app/services/default/moodle/course/masterCategoryService";
import { masterCourseService } from "@scnode_app/services/default/moodle/course/masterCourseService";
// @end

// @import types
import {TaskParams} from '@scnode_core/types/default/task/taskTypes'
// @end

class ProgramUpdateProgram extends DefaultPluginsTaskTaskService {

  /**
   * Metodo que contiene la logica de la tarea
   * @return Booleano que identifica si se pudo o no ejecutar la tarea
   */
  public run = async (taskParams: TaskParams) => {
    // @INFO: Consultando categories en Moodle
    const categoriesResponse: any = await masterCategoryService.list()

    if (categoriesResponse?.status !== 'success') return false

    const programsData: {moodleId: number, code: string, isAuditor: boolean}[] = []

    const categories = categoriesResponse.categories;
    for (const category of categories) {
      const coursesByCategoryResponse: any = await masterCourseService.list({
        categoryId: category.id
      })
      if (coursesByCategoryResponse.status === 'success') {
        for (const course of coursesByCategoryResponse?.courses) {
          programsData.push({
            moodleId: course.id,
            code: course.name,
            isAuditor: course?.auditorcertificate ? true : false
          })
        }
      }
    }

    if (programsData.length > 0) {
      for (const program of programsData) {
        const programLocal = await Program.findOne({
          moodle_id: program.moodleId,
          code: program.code.trim(),
        }).select('id').lean()
        if (programLocal) {
          console.log('Program local found', program, programLocal._id)
          await Program.findByIdAndUpdate(programLocal._id, {
            isAuditor: program.isAuditor,
          }, { useFindAndModify: false, new: true })
        }
      }
    }

    return true; // Always return true | false
  }
}

export const programUpdateProgram = new ProgramUpdateProgram();
export { ProgramUpdateProgram };
