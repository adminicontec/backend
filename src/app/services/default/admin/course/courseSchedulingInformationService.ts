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
import { IEnrollment } from '@scnode_app/types/default/admin/enrollment/enrollmentTypes';
import { ICourseSchedulingDetail } from '@scnode_app/types/default/admin/course/courseSchedulingDetailsTypes';
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
        // Obtener todos los datos necesarios para procesar
        const [details, rules ,moduleList, enrollments] = await this.getSchedulingInformation(scheduling);

        if (enrollments && enrollments.length) {
          for await (let enrollment of enrollments) {
            let params: ICourseSchedulingInformation;
            params.user = enrollment.user?._id;
            params.courseScheduling = scheduling._id;

            // Encontrar el curso en las rules para ver la cantidad de asistencia que ha obtenido
            if (rules && rules.completion && rules.completion.length) {
              // TODO: Verificar elc aso en que el completion tiene mas de un item
              const listOfStudentProgress = rules.completion[0].listOfStudentProgress;
              if (listOfStudentProgress && listOfStudentProgress.length) {
                const student = listOfStudentProgress.find((s) => String(s.student?.userData?.userid) === enrollment.user?.moodle_id);
                if (student) {
                  if (student.itemType && student.itemType.attendance && student.itemType.attendance.length) {
                    // Total de asistencia en porcentaje
                    params.totalAttendanceScore = student.itemType.attendance.reduce((accum, item) => {
                      if (item.graderaw) {
                        accum+=item.graderaw;
                      }
                      return accum;
                    }, 0);
                    params.totalAttendanceScore = Math.round(params.totalAttendanceScore / student.itemType.attendance.length);
                    // Total de asistencia en horas
                    if (scheduling.duration) {
                      params.totalAttendanceHours = Math.round(((params.totalAttendanceScore/100)*scheduling.duration)/3600);
                    } else {
                      params.totalAttendanceHours = 0;
                    }
                  }
                  if (student.studentProgress) {
                    // Calificación de examen de auditor
                    params.auditExamScore = student.studentProgress.auditorGrade;
                    // Verificar si aprueba o no el examen de auditor
                  }
                }
              }
            }
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
    const schedulings = await CourseScheduling.find({schedulingStatus: {$in: status.map(s => s._id)}, endDate: {$gt: date}}).select('id moodle_id duration').lean();
    return schedulings && schedulings.length ? schedulings : [];
  }

  private getSchedulingInformation = async (scheduling: ICourseScheduling): Promise<[ICourseSchedulingDetail[], any, any, IEnrollment[]]> => {
    const moduleType: string[] = ['quiz'];
    const [details, rules ,moduleList, enrollments] = await Promise.all([
      CourseSchedulingDetails.find({course_scheduling: scheduling._id}).lean() as Promise<ICourseSchedulingDetail[]>,
      certificateService.rulesForCompletion({ courseID: scheduling.moodle_id, course_scheduling: scheduling._id, without_certification: true }),
      courseContentService.moduleList({ courseID: scheduling.moodle_id, moduleType: moduleType }),
      Enrollment.find({course_scheduling: scheduling._id}).select('id user').populate({path: 'user', select: 'id moodle_id'}).lean() as Promise<IEnrollment[]>
    ]);
    return [details, rules ,moduleList, enrollments];
  }

}

export const courseSchedulingInformationService = new CourseSchedulingInformationService();
export { CourseSchedulingInformationService as DefaultAdminCourseCourseSchedulingInformationService };
