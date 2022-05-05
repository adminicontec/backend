// @import_dependencies_node Import libraries
// @end

// @import services
import { courseContentService } from '@scnode_app/services/default/moodle/course/courseContentService';
import { certificateService } from '@scnode_app/services/default/huellaDeConfianza/certificate/certificateService';
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import { CourseSchedulingStatus, CourseScheduling, CourseSchedulingDetails, Enrollment } from '@scnode_app/models';
// @end

// @import types
import { ICourseScheduling } from '@scnode_app/types/default/admin/course/courseSchedulingTypes';
import { ICourseSchedulingInformation } from '@scnode_app/types/default/admin/course/courseSchedulingInformationTypes';
// @end

class CourseSchedulingInformationService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  public processInformation = async () => {
    try {
      // Consultar los servicios confirmados y ejecutados
      const schedulings = await this.getCourseSchedulingList();

      for await (let scheduling of schedulings) {
        const moduleType: string[] = ['quiz'];
        const [details, rules ,moduleList, enrollments] = await Promise.all([
          CourseSchedulingDetails.find({course_scheduling: scheduling._id}).lean(),
          certificateService.rulesForCompletion({ courseID: scheduling.moodle_id, course_scheduling: scheduling._id, without_certification: true }),
          courseContentService.moduleList({ courseID: scheduling.moodle_id, moduleType: moduleType }),
          Enrollment.find({course_scheduling: scheduling._id})
        ]);

        if (enrollments && enrollments.length) {
          for await (let enrollment of enrollments) {
            let params: ICourseSchedulingInformation;

          }
        }
      }

    } catch (error) {
      console.log('Error processInformation: ', error);
      return responseUtility.buildResponseFailed('json');
    }
  }

  private getCourseSchedulingList = async (): Promise<ICourseScheduling[]> => {
    const status = await CourseSchedulingStatus.find({name: {$in: ['Confirmado', 'Ejecutado']}});
    const date = new Date();
    // TODO: Revisar si solo se deben escoger hasta los servicios que hayan finalizado los últimos 3 meses
    date.setMonth(date.getMonth() - 3);
    const schedulings = await CourseScheduling.find({schedulingStatus: {$in: status.map(s => s._id)}, endDate: {$gt: date}}).select('id moodle_id').lean();
    return schedulings && schedulings.length ? schedulings : [];
  }

}

export const courseSchedulingInformationService = new CourseSchedulingInformationService();
export { CourseSchedulingInformationService as DefaultAdminCourseCourseSchedulingInformationService };
