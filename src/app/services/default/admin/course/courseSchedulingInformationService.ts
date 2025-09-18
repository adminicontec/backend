// @import_dependencies_node Import libraries
// @end

// @import services
import { courseContentService } from '@scnode_app/services/default/moodle/course/courseContentService';
import { certificateService } from '@scnode_app/services/default/huellaDeConfianza/certificate/certificateService';
import { customLogService } from '@scnode_app/services/default/admin/customLog/customLogService';
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import { AppConfig, CourseSchedulingStatus, CourseScheduling, CourseSchedulingDetails, Enrollment, CertificateQueue, CourseSchedulingInformation } from '@scnode_app/models';
// @end

// @import types
import { ICourseScheduling } from '@scnode_app/types/default/admin/course/courseSchedulingTypes';
import { ICourseSchedulingInformation, ICourseSchedulingInformationProcess, IGetCourseSchedulingList, IParamsCourseSchedulingInformationList } from '@scnode_app/types/default/admin/course/courseSchedulingInformationTypes';
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
        if (!params.user || !params.courseScheduling) {
          return responseUtility.buildResponseFailed('json');
        }
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

    let select = undefined;
    if (filters.select) {
      select = filters.select
    }

    let where = {}

    if (filters.where && Array.isArray(filters.where)) {
      filters.where.map((p) => where[p.field] = p.value)
    }

    let registers = []
    try {
      registers =  await CourseSchedulingInformation.find(where)
      .select(select)
      .skip(paging ? (pageNumber > 0 ? ( ( pageNumber - 1 ) * nPerPage ) : 0) : null)
      .limit(paging ? nPerPage : null)
    } catch (e) {}

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        courseSchedulingInformation: [
          ...registers
        ],
        total_register: (paging) ? await CourseSchedulingInformation.find(where).count() : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    })
  }

  private getAppConfigValue = async (key: string, defaultValue: any) => {
    try {
      const config = await AppConfig.findOne({ key }).lean();
      if (config && config.value !== undefined && config.value !== null) {
        return config.value;
      }
    } catch (e) {
      // log error if needed
    }
    return defaultValue;
  }

  public processInformation = async (params: ICourseSchedulingInformationProcess & { batchSize?: number, maxServicesPerRun?: number, schedulingBatchSize?: number }) => {
    // Obtener valores de configuración desde BD si no vienen en params
    const BATCH_SIZE = params.batchSize ?? await this.getAppConfigValue('csi_batchSize', 30);
    const MAX_SERVICES_PER_RUN = params.maxServicesPerRun ?? await this.getAppConfigValue('csi_maxServicesPerRun', 100);
    const SCHEDULING_BATCH_SIZE = params.schedulingBatchSize ?? await this.getAppConfigValue('csi_schedulingBatchSize', 10);

    // Obtener días de reproceso desde configuración
    const DAYS_TO_REPROCESS = await this.getAppConfigValue('csi_daysToReprocess', 8);

    console.log(`[processInformation] Parámetros de ejecución - BATCH_SIZE: ${BATCH_SIZE}, MAX_SERVICES_PER_RUN: ${MAX_SERVICES_PER_RUN}, SCHEDULING_BATCH_SIZE: ${SCHEDULING_BATCH_SIZE}, courseSchedulings: ${params.courseSchedulings || 'N/A'}, DAYS_TO_REPROCESS: ${DAYS_TO_REPROCESS}`);

    // console.time('processInformation::total');
    try {
      // Usar getCourseSchedulingList con prioridad a courseSchedulings
      const schedulings = await this.getCourseSchedulingList({
        ...params,
        lastProcessedAt: null,
        limit: MAX_SERVICES_PER_RUN
      });

      console.log(`[processInformation] Schedulings sin procesar encontrados: ${schedulings.length}`);

      // Calcular fechas solo si NO se pasa courseSchedulings
      let today: Date, daysAgoForStudent: Date;
      today = new Date();
      today.setHours(0,0,0,0);
      daysAgoForStudent = new Date(today);
      daysAgoForStudent.setDate(today.getDate() - DAYS_TO_REPROCESS);

      for (let i = 0; i < schedulings.length; i += SCHEDULING_BATCH_SIZE) {
        const schedulingBatch = schedulings.slice(i, i + SCHEDULING_BATCH_SIZE);

        await Promise.all(schedulingBatch.map(async (scheduling) => {
          // console.time(`processInformation::scheduling::${scheduling._id}`);
          const [details, rules, moduleList, enrollments] = await this.getSchedulingInformation(scheduling);
          console.log(`[processInformation] Scheduling ${scheduling._id} - Enrollments: ${enrollments?.length || 0}`);

          if (enrollments && enrollments.length) {
            const userIds = enrollments.map(e => e.user?._id).filter(Boolean);
            const csiDocs = await CourseSchedulingInformation.find({
              courseScheduling: scheduling._id,
              user: { $in: userIds }
            }).select('user lastProcessedAt').lean();

            const csiByUserId = csiDocs.reduce((acc, doc) => {
              acc[String(doc.user)] = doc;
              return acc;
            }, {});

            // Lógica de filtrado flexible para enrollments
            const enrollmentsToProcess = enrollments.filter(enrollment => {
              const csi = csiByUserId[String(enrollment.user?._id)];
              // Si se pasa courseSchedulings, procesar todos los enrollments (sin filtro de fecha)
              if (params.courseSchedulings) {
                return true;
              }
              // Si nunca ha sido procesado
              if (!csi || !csi.lastProcessedAt) return true;
              // Si fue procesado hace más de N días (variable)
              if (csi.lastProcessedAt < daysAgoForStudent) return true;
              // Si fue procesado entre hoy y N días atrás, permitir reprocesar si no fue procesado hoy
              if (csi.lastProcessedAt >= daysAgoForStudent && csi.lastProcessedAt < today) return true;
              // Si fue procesado hoy, no procesar
              return false;
            });

            for (let j = 0; j < enrollmentsToProcess.length; j += BATCH_SIZE) {
              const batch = enrollmentsToProcess.slice(j, j + BATCH_SIZE);
              // console.time(`processInformation::scheduling::${scheduling._id}::batch_${j/BATCH_SIZE}`);

              await Promise.all(batch.map(async (enrollment) => {
                try {
                  let infoParams: ICourseSchedulingInformation = {
                    user: enrollment.user?._id,
                    courseScheduling: scheduling._id
                  };

                  infoParams = await this.getGeneralSchedulingStats(infoParams, rules, enrollment, scheduling);
                  infoParams = await this.getCertificateSchedulingStats(infoParams);
                  infoParams = await this.getSchedulingDetailsStats(infoParams, details, moduleList, rules, enrollment);
                  infoParams = this.setCertificateStats(infoParams);

                  infoParams.lastProcessedAt = new Date();

                  await this.insertOrUpdate(infoParams);
                } catch (err) {
                  await customLogService.create({
                    label: 'csiPi - Course scheduling information failed',
                    description: `Error processing enrollment ${enrollment?.user?._id} in scheduling ${scheduling?._id}`,
                    content: {
                      schedulingId: scheduling?._id,
                      userId: enrollment?.user?._id,
                      error: err?.message || err,
                      stack: err?.stack
                    }
                  });
                }
              }));
              // console.timeEnd(`processInformation::scheduling::${scheduling._id}::batch_${j/BATCH_SIZE}`);
            }

            const totalCSI = await CourseSchedulingInformation.countDocuments({
              courseScheduling: scheduling._id,
              user: { $in: userIds }
            });
            const processedCSI = await CourseSchedulingInformation.countDocuments({
              courseScheduling: scheduling._id,
              user: { $in: userIds },
              lastProcessedAt: { $ne: null }
            });

            if (totalCSI > 0 && totalCSI === processedCSI) {
              await CourseScheduling.findByIdAndUpdate(scheduling._id, { lastProcessedAt: new Date() });
              console.log(`[processInformation] Servicio ${scheduling._id} marcado como procesado.`);
            } else {
              console.log(`[processInformation] Servicio ${scheduling._id} aún tiene registros CourseSchedulingInformation sin procesar (${totalCSI - processedCSI}).`);
            }
          } else {
            await CourseScheduling.findByIdAndUpdate(scheduling._id, { lastProcessedAt: new Date() });
            console.log(`[processInformation] Servicio ${scheduling._id} sin enrollments, marcado como procesado.`);
          }
          // console.timeEnd(`processInformation::scheduling::${scheduling._id}`);
        }));
      }

      // console.timeEnd('processInformation::total');
      return responseUtility.buildResponseSuccess('json');
    } catch (error) {
      // console.timeEnd('processInformation::total');
      console.log('Error CourseSchedulingInformationService => processInformation: ', error);
      return responseUtility.buildResponseFailed('json', null, { additional_parameters: { err: error?.message } });
    }
  }

  private getCourseSchedulingList = async (params: IGetCourseSchedulingList & { lastProcessedAt?: any, limit?: number, daysToReprocess?: number }): Promise<ICourseScheduling[]> => {
    const status = await CourseSchedulingStatus.find({name: {$in: ['Confirmado', 'Ejecutado']}});
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);

    // NUEVO: Obtener días de reproceso desde configuración
    const DAYS_TO_REPROCESS = params.daysToReprocess ?? 8;

    // Calcular rango de fechas para servicios vencidos entre hoy y N días atrás
    const today = new Date();
    today.setHours(0,0,0,0);
    const daysAgoForService = new Date(today);
    daysAgoForService.setDate(today.getDate() - DAYS_TO_REPROCESS);

    let query: any;

    // Si se proporciona courseSchedulings, priorizar y omitir los demás filtros
    if (params.courseSchedulings) {
      if (typeof params.courseSchedulings === 'string') {
        query = { _id: { $in: params.courseSchedulings.split(',') } };
      } else if (Array.isArray(params.courseSchedulings)) {
        query = { _id: { $in: params.courseSchedulings } };
      } else {
        query = {};
      }
    } else {
      query = {
        schedulingStatus: { $in: status.map(s => s._id) },
        endDate: {
          $gte: threeMonthsAgo,
          $lte: now
        }
      };

      // Regla flexible para lastProcessedAt:
      // 1. Si lastProcessedAt es null => incluir siempre (no procesado nunca)
      // 2. Si endDate está entre hoy y N días atrás:
      //    - incluir si lastProcessedAt es null o lastProcessedAt < hoy
      // 3. Si endDate < N días atrás:
      //    - incluir solo si lastProcessedAt es null

      query['$or'] = [
        // Nunca procesados
        { lastProcessedAt: null },
        // Vencidos entre hoy y N días atrás, permitir reprocesar si no fue procesado hoy
        {
          endDate: { $gte: daysAgoForService, $lte: today },
          $or: [
            { lastProcessedAt: null },
            { lastProcessedAt: { $lt: today } }
          ]
        }
      ];
    }

    let schedulingsQuery = CourseScheduling.find(query).select('id moodle_id duration endDate lastProcessedAt');
    if (params.limit) {
      schedulingsQuery = schedulingsQuery.limit(params.limit);
    }
    const schedulings = await schedulingsQuery.lean();
    return schedulings && schedulings.length ? schedulings : [];
  }

  private getSchedulingInformation = async (scheduling: ICourseScheduling): Promise<[ICourseSchedulingDetail[], any, any, IEnrollment[]]> => {
    const moduleType: string[] = ['attendance'];
    const [details, rules ,moduleList, enrollments] = await Promise.all([
      CourseSchedulingDetails.find({course_scheduling: scheduling._id}).populate({path: 'course', select: 'id moodle_id'}).lean() as Promise<ICourseSchedulingDetail[]>,
      certificateService.rulesForCompletion({ courseID: scheduling.moodle_id, course_scheduling: scheduling._id, without_certification: false }),
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
      // Nota de tareas
      if (student.itemType && student.itemType.assign && student.itemType.assign.length) {
        let taskSum = student.itemType.assign.reduce((accum, item) => accum += item.graderaw || 0 , 0);
        taskSum = Math.round(taskSum / student.itemType.assign.length);
        params.taskScore = taskSum;
      }
      // Nota de evaluaciones
      if (student.itemType && student.itemType.quiz && student.itemType.quiz.length) {
        let examSum = student.itemType.quiz.reduce((accum, item) => accum += item.graderaw || 0 , 0);
        examSum = Math.round(examSum / student.itemType.quiz.length);
        params.examsScore = examSum;
      }
      // Nota de foros
      if (student.itemType && student.itemType.forum && student.itemType.forum.length) {
        let forumSum = student.itemType.forum.reduce((accum, item) => accum += item.graderaw || 0 , 0);
        forumSum = Math.round(forumSum / student.itemType.forum.length);
        params.forumsScore = forumSum;
      }
      if (student.studentProgress) {
        // Nota final
        params.totalScore = student.studentProgress.average_grade; // OK - Para virtual:
        // Porcentaje de completitud
        params.completion = student.studentProgress.completion; // OK
        // Calificación de examen de auditor
        params.auditExamScore = student.studentProgress.auditorGradeC1;
        // Verificar si aprueba o no el examen de auditor
        params.isAuditExamApprove = student.studentProgress.auditor;
        // Tipo de certificado de auditor
        params.auditCertificateType = student.studentProgress.auditorCertificate;
        // Verificar si es certificado parcial
        params.isPartialCertification = student.studentProgress.attended_approved === 'Certificado parcial.';
        // Verificar si es certificado de asistencia
        params.isAttendanceCertification = student.studentProgress.attended_approved === 'Asistencia.';

        params.certificationData = {
          isAuditorCerficateEnabled: rules?.isAuditorCerficateEnabled || false,
          firstCertificateIsAuditor: rules?.firstCertificateIsAuditor || false,
          certificationLabel: student.studentProgress.attended_approved, // OK - Para cualquier modalidad aparece
          virtualProgress: student.studentProgress.completion || undefined, // OK - Para virtual representa el progreso
          virtualActivities: student.studentProgress.average_grade || undefined, // OK - Para virtual representa el score de activides
          assistance: student.studentProgress?.assistanceDetails?.percentage || undefined,
          auditorCertificate: {
            certificationLabel: student.studentProgress?.auditorCertificate || undefined,
            auditorExamScore: Math.round(student.studentProgress?.auditorGradeC2 * 100) / 100 || undefined
          },
          firstCertificateIsAuditorContent: {
            auditorExamScore: Math.round(student.studentProgress?.auditorGradeC1*100) / 100 || undefined
          }
        }

      }
    }
    return params;
  }

  private getCertificateSchedulingStats = async (_params: ICourseSchedulingInformation): Promise<ICourseSchedulingInformation> => {
    const params = _params;
    const certificatesQueue = await CertificateQueue.find({userId: params.user, courseId: params.courseScheduling});
    if (certificatesQueue && certificatesQueue.length) {
      certificatesQueue.forEach((certificateQueue) => {
        if (certificateQueue) {
          if (certificateQueue.certificateType === 'academic') {
            params.certificationDate = certificateQueue?.certificate?.date;
            params.certificationDownloadDate = certificateQueue?.downloadDate;
            params.assistanceCertificate = certificateQueue?.auxiliar;
          } else if (certificateQueue.certificateType === 'auditor'){
            params.auditCertificationDate = certificateQueue?.certificate?.date;
            params.auditCertificationDownloadDate = certificateQueue?.downloadDate;
            params.auditAssistanceCertificate = certificateQueue?.auxiliar;
          }
        }
      });
    }
    return params;
  }

  private getSchedulingDetailsStats = async (_params: ICourseSchedulingInformation, details: ICourseSchedulingDetail[], moduleList: any, rules: any, enrollment: IEnrollment): Promise<ICourseSchedulingInformation> => {

    const params = _params;
    params.courses = [];
    if (details && details.length) {
      for await (let detail of details) {
        // Encontrar el modulo en los módulos
        let attendanceScore: number = 0;
        let progressPercentage = 0;
        const studentRule = await this.getStudentFromRules(rules, enrollment);
        if (studentRule) {
          if (moduleList && moduleList.courseModules) {
            const module = moduleList.courseModules.find((m)  => String(m.sectionid) === (detail.course as any)?.moodle_id);
            if (module) {
              // Encontrar la asistencia en las rules
              const attendance = studentRule.itemType?.attendance?.find((a) => a.cmid === module.id);
              if (attendance) {
                attendanceScore = attendance.graderaw;
              }
            }
          }

          if (studentRule?.studentProgress?.progressByModule) {
            if (studentRule?.studentProgress?.progressByModule[(detail.course as any)?.moodle_id]) {
              progressPercentage = studentRule?.studentProgress?.progressByModule[(detail.course as any)?.moodle_id].percentage || 0
            }
          }
        }
        // Guardar la información
        params.courses.push({
          schedulingDetails: detail._id,
          attendanceScore,
          progressPercentage
        });
      }
    }
    return params;
  }

  private setCertificateStats = (_params: ICourseSchedulingInformation): ICourseSchedulingInformation => {
    const params: ICourseSchedulingInformation = _params;
    params.certificateStats = {};
    params.auditCertificateStats = {};
    // Estadisticas de certificado
    if (params.totalAttendanceScore === 100) {
      params.certificateStats.isAttendanceComplete = true;
    }
    if (params.completion === 100) {
      params.certificateStats.isProgressComplete = true;
    }
    if (params.certificationDate) {
      params.certificateStats.isCertificate = true;
    }
    if (params.certificationDownloadDate) {
      params.certificateStats.isDownloadCertificate = true;
    }
    // Estadisticas de certificado de auditor
    // TODO: Falta la asistencia de auditor
    if (params.isAuditExamApprove) {
      params.auditCertificateStats.isExamApprove = true;
    }
    if (params.auditCertificationDate) {
      params.auditCertificateStats.isCertificate = true;
    }
    if (params.auditCertificationDownloadDate) {
      params.auditCertificateStats.isDownloadCertificate = true;
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
