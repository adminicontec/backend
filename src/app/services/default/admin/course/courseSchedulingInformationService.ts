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
import { CourseSchedulingStatus, CourseScheduling, CourseSchedulingDetails, Enrollment, CertificateQueue, CourseSchedulingInformation } from '@scnode_app/models';
// @end

// @import types
import { ICourseScheduling } from '@scnode_app/types/default/admin/course/courseSchedulingTypes';
import { ICourseSchedulingInformation, IParamsCourseSchedulingInformationList } from '@scnode_app/types/default/admin/course/courseSchedulingInformationTypes';
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

  public insertOrUpdate = async (params: ICourseSchedulingInformation) => {
    try{
      // Verifica si existe un registro del mismo servicio y usuario
      const exist = await CourseSchedulingInformation.findOne({courseScheduling: params.courseScheduling, user: params.user});

      if (exist && exist._id) {
        const response: any = await CourseSchedulingInformation.findByIdAndUpdate(exist._id, params, { useFindAndModify: false, new: true });

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            courseSchedulingInformation: response
          }
        })
      } else {
        const response: any = await CourseSchedulingInformation.create(params)

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            courseSchedulingInformation: response
          }
        })
      }
    }catch(e){
      console.log('Error CourseSchedulingInformationService => insertOrUpdate: ', e);
      return responseUtility.buildResponseFailed('json');
    }
  }

  public list = async (filters: IParamsCourseSchedulingInformationList) => {
    const paging = (filters.pageNumber && filters.nPerPage) ? true : false

    const pageNumber= filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage= filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let select = 'id name'
    if (filters.select) {
      select = filters.select
    }

    if (filters.where && Array.isArray(filters.where)) {
      filters.where.map((p) => where[p.field] = p.value)
    }

    let where = {}

    let registers = []
    try {
      registers =  await CourseSchedulingInformation.find(where)
      .select(select)
      .skip(paging ? (pageNumber > 0 ? ( ( pageNumber - 1 ) * nPerPage ) : 0) : null)
      .limit(paging ? nPerPage : null)
    } catch (e) {}

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        forumCategories: [
          ...registers
        ],
        total_register: (paging) ? await CourseSchedulingInformation.find(where).count() : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    })
  }

  public processInformation = async () => {
    try {
      // Consultar los servicios confirmados y ejecutados
      const schedulings = await this.getCourseSchedulingList();

      for await (let scheduling of schedulings) {
        // Obtener todos los datos necesarios para procesar
        const [details, rules ,moduleList, enrollments] = await this.getSchedulingInformation(scheduling);

        if (enrollments && enrollments.length) {
          for await (let enrollment of enrollments) {
            let params: ICourseSchedulingInformation = {
              user: enrollment.user?._id,
              courseScheduling: scheduling._id
            };

            params = await this.getGeneralSchedulingStats(params, rules, enrollment,scheduling);

            params = await this.getCertificateSchedulingStats(params);

            params = await this.getSchedulingDetailsStats(params, details, moduleList, rules, enrollment);

            console.log('\n\n ============= Parámetros a insertar ========: \n', params, scheduling.moodle_id, '\n\n');

            await this.insertOrUpdate(params);
          }
        }
      }

    } catch (error) {
      console.log('Error CourseSchedulingInformationService => processInformation: ', error);
      return responseUtility.buildResponseFailed('json');
    }
  }

  private getCourseSchedulingList = async (): Promise<ICourseScheduling[]> => {
    const status = await CourseSchedulingStatus.find({name: {$in: ['Confirmado', 'Ejecutado']}});
    const date = new Date();
    // TODO: Revisar si solo se deben escoger hasta los servicios que hayan finalizado los últimos 3 meses
    date.setMonth(date.getMonth() - 3);
    // const schedulings = await CourseScheduling.find({schedulingStatus: {$in: status.map(s => s._id)}, endDate: {$gt: date}}).select('id moodle_id duration').lean();
    const schedulings = await CourseScheduling.find({schedulingStatus: {$in: status.map(s => s._id)}}).select('id moodle_id duration').lean();
    // const schedulings = await CourseScheduling.find({schedulingStatus: {$in: status.map(s => s._id)}, moodle_id: '421'}).select('id moodle_id duration').lean();
    return schedulings && schedulings.length ? schedulings : [];
  }

  private getSchedulingInformation = async (scheduling: ICourseScheduling): Promise<[ICourseSchedulingDetail[], any, any, IEnrollment[]]> => {
    const moduleType: string[] = ['attendance'];
    const [details, rules ,moduleList, enrollments] = await Promise.all([
      CourseSchedulingDetails.find({course_scheduling: scheduling._id}).populate({path: 'course', select: 'id moodle_id'}).lean() as Promise<ICourseSchedulingDetail[]>,
      certificateService.rulesForCompletion({ courseID: scheduling.moodle_id, course_scheduling: scheduling._id, without_certification: true }),
      courseContentService.moduleList({ courseID: scheduling.moodle_id, moduleType: moduleType }),
      Enrollment.find({course_scheduling: scheduling._id}).select('id user').populate({path: 'user', select: 'id moodle_id'}).lean() as Promise<IEnrollment[]>
    ]);
    return [details, rules ,moduleList, enrollments];
  }

  private getGeneralSchedulingStats = async (_params: ICourseSchedulingInformation, rules: any, enrollment: IEnrollment, scheduling: ICourseScheduling): Promise<ICourseSchedulingInformation> => {
    const params = _params;
     // Encontrar el curso en las rules para ver la cantidad de asistencia que ha obtenido
    const student = await this.getStudentFromRules(rules, enrollment);
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
        params.isAuditExamApprove = student.studentProgress.auditor;
        // Tipo de certificado de auditor
        params.auditCertificateType = student.studentProgress.auditorCertificate;
        // Verificar si es certificado parcial
        params.isPartialCertification = student.studentProgress.attended_approved === 'Certificado parcial.';
        // Verificar si es certificado de asistencia
        params.isAttendanceCertification = student.studentProgress.attended_approved === 'Asistencia.';
      }
    }
    return params;
  }

  private getCertificateSchedulingStats = async (_params: ICourseSchedulingInformation): Promise<ICourseSchedulingInformation> => {
    const params = _params;
    const certificateQueue = await CertificateQueue.findOne({userId: params.user, courseId: params.courseScheduling});
    if (certificateQueue) {
      // Fecha del certificado
      params.certificationDate = certificateQueue?.certificate?.date;
      // Fecha de descarga de certificado
      params.assistanceCertificate = certificateQueue?.auxiliar;
    }
    return params;
  }

  private getSchedulingDetailsStats = async (_params: ICourseSchedulingInformation, details: ICourseSchedulingDetail[], moduleList: any, rules: any, enrollment: IEnrollment): Promise<ICourseSchedulingInformation> => {
    const params = _params;
    let attendanceScore: number = 0;
    params.courses = [];
    if (details && details.length && moduleList && moduleList.courseModules) {
      for await (let detail of details) {
        // Encontrar el modulo en los módulos
        const module = moduleList.courseModules.find((m)  => String(m.sectionid) === (detail.course as any)?.moodle_id);
        if (module) {
          const studentRule = await this.getStudentFromRules(rules, enrollment);
          if (studentRule) {
            // Encontrar la asistencia en las rules
            const attendance = studentRule.itemType?.attendance?.find((a) => a.cmid === module.id);
            if (attendance) {
              attendanceScore = attendance.graderaw;
            }
          }
        }
        // Guardar la información
        params.courses.push({
          schedulingDetails: detail._id,
          attendanceScore
        });
      }
    }
    return params;
  }

  private getStudentFromRules = async (rules: any, enrollment: IEnrollment) => {
    let student: any = undefined;
    if (rules && rules.completion && rules.completion.length) {
      // TODO: Verificar el caso en que el completion tiene mas de un item
      const listOfStudentProgress = rules.completion[0].listOfStudentProgress;
      if (listOfStudentProgress && listOfStudentProgress.length) {
        student = listOfStudentProgress.find((s) => String(s.student?.userData?.userid) === enrollment.user?.moodle_id);
        if (student && student.student) student = student.student;
      }
    }
    return student;
  }

}

export const courseSchedulingInformationService = new CourseSchedulingInformationService();
export { CourseSchedulingInformationService as DefaultAdminCourseCourseSchedulingInformationService };
