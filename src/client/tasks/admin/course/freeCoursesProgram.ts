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
  course_scheduling: string
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
        // _id: '67bcde30d2884794704e1e78',
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
        schedulingStatus: { $in: courseSchedulingStatus?.map(({ _id }) => _id) },
        $or: [
          { typeCourse: { $in: [TypeCourse.FREE, TypeCourse.MOOC] } },
          { quickLearning: true },
          { withoutTutor: true}
        ],
      }).select('_id metadata serviceValidity withoutTutor quickLearning program')
      .populate({path: 'program', select: 'id name'})

      for (const courseScheduling of courseSchedulings) {
        const validityTime = courseScheduling?.serviceValidity ? courseScheduling.serviceValidity : 0
        const enrollments = await Enrollment.find({
          course_scheduling: courseScheduling._id,
          // origin: EnrollmentOrigin.AUTOREGISTRO,
          deletedAt: { $exists: false },
        }).select('_id created_at user course_scheduling')
        if (!enrollments?.length) continue
        for (const enrollment of enrollments) {
          let currentStatus = await this.getCurrentEnrollmentStatus(enrollment._id)
          console.log('enrollment', enrollment)
          // TODO: PReguntar si para esta funcionalidad debe eliminar al finalziar, ¿aplicar validaciones de estado?
          // const userWasRemoved = await this.validateConditionsToRemoveUser(enrollment, validityTime, courseScheduling)
          // if (userWasRemoved) continue;

          console.log('InitialCurrentStatus', { currentStatus })
          if (currentStatus === EnrollmentStatus.IN_PROGRESS) {
            // TODO: Notificación de certificación lista para descarga (Historia IX)

            await this.verifyStudentQualifications(enrollment, courseScheduling, courseScheduling?.withoutTutor ? false : true)
            currentStatus = await this.getCurrentEnrollmentStatus(enrollment._id)
            // console.log({ currentStatus })
          }
          console.log('AfterCurrentStatus', { currentStatus })
          if ([EnrollmentStatus.REGISTERED, EnrollmentStatus.IN_PROGRESS].includes(currentStatus)) {

            if (courseScheduling?.withoutTutor && this.shouldTriggerFirstThirdAction(enrollment.created_at, Number(courseScheduling.serviceValidity))) {
              // TODO: Pendiente el texto y data del email
              await courseSchedulingNotificationsService.sendReminderEmailForWithoutTutor(courseScheduling._id, enrollment.user, {stage: 'first'})
            }
            let daysBeforeEnd = 8;
            if (courseScheduling?.withoutTutor) daysBeforeEnd = 2
            const {hasEnded, isEndingSoon, daysSinceEnd} = this.getCourseEndStatus(enrollment.created_at, Number(courseScheduling.serviceValidity), daysBeforeEnd)
            console.log({hasEnded, isEndingSoon})
            if (hasEnded || isEndingSoon) {
              if (courseScheduling?.withoutTutor) {
                let customData = {
                  primaryMessage: `Queremos recordarte que restan ${daysBeforeEnd} dias para la finalización de tu curso ${courseScheduling?.program?.name}`,
                }
                if (hasEnded) customData.primaryMessage = `Queremos informarte que tu programa ${courseScheduling?.program?.name} ha finalizado.`
                // TODO: Pendiente el texto y data del email
                console.log('')
                await courseSchedulingNotificationsService.sendReminderEmailForWithoutTutor(courseScheduling._id, enrollment.user, {stage: 'ending_soon', customData})
              } else if ([TypeCourse.FREE, TypeCourse.MOOC].includes(courseScheduling?.typeCourse)) {
                await courseSchedulingNotificationsService.sendReminderEmailForFreeOrMooc(courseScheduling._id, enrollment.user)
              }
              console.log('Esta priximo a finalizar', daysBeforeEnd)
            }
            // await this.sendReminderBeforeFinishCourse(enrollment, validityTime, courseScheduling)
          }
        }
      }
    } catch (e) {
      console.log('FreeCoursesProgram -> verifyStudentsValidity -> ERROR: ', e)
    }
  }

  private shouldTriggerFirstThirdAction(enrollmentDate: string, durationSeconds: number): boolean {
    // Convert enrollmentDate to a moment object
    const startDate = moment(enrollmentDate);

    if (!startDate.isValid()) {
      throw new Error('Invalid enrollment date');
    }

    // Calculate the first third of the duration in seconds
    const firstThirdSeconds = Math.floor(durationSeconds / 3);

    // Calculate the end date of the first third part
    const firstThirdEndDate = startDate.clone().add(firstThirdSeconds, 'seconds');

    // Check if the current date is past the first third end date
    return moment().isAfter(firstThirdEndDate);
  }

  private getCourseEndStatus(
    enrollmentDate: string,
    durationSeconds: number,
    daysBeforeEnd: number
  ): {hasEnded: boolean;isEndingSoon: boolean;daysSinceEnd: number;} {
    // Convert enrollmentDate to a moment object
    const startDate = moment(enrollmentDate);

    if (!startDate.isValid()) {
      throw new Error('Invalid enrollment date');
    }

    // Calculate the course end date
    const courseEndDate = startDate.clone().add(durationSeconds, 'seconds');

    // Calculate the trigger date (courseEndDate - daysBeforeEnd)
    const triggerDate = courseEndDate.clone().subtract(daysBeforeEnd, 'days');

    // Determine if the course has ended
    const hasEnded = moment().isAfter(courseEndDate);

    // Determine if the course is ending soon
    const isEndingSoon = moment().isSameOrAfter(triggerDate) && !hasEnded;

    // Calculate days since the course ended (0 if not ended)
    const daysSinceEnd = hasEnded
      ? moment().diff(courseEndDate, 'days')
      : 0;

    return {
      hasEnded,
      isEndingSoon,
      daysSinceEnd,
    };
  }

  private validateConditionsToRemoveUser = async (enrollment: IEnrollment, validityTime: number, courseScheduling: any): Promise<boolean> => {
    try {
      const startDate = moment(enrollment.created_at)
      const today = moment()
      const seconds = today.diff(startDate, 'seconds')
      const days = this.getDays(validityTime - seconds)
      // console.log({ days, seconds, validityTime, enrollment: enrollment?._id })
      if (days <= -1) {
        console.log(`${days} dia(s) despues de vencer el plazo del curso`)
        if (seconds > validityTime) {
          const result = await enrollmentService.delete({ id: enrollment._id })
          if (result.status === 'success') return true
          if (result.status === 'error') {
            console.log('FreeCoursesProgram -> validateConditionsToRemoveUser -> removeEnrollmentError: ', result)
          }
        }
      } else if (days === 5) {
        if (courseScheduling?.quickLearning) {
          console.log('5 Dias antes, enviando notificación...')
          await courseSchedulingNotificationsService.sendReminderEmailForQuickLearning(enrollment.course_scheduling, enrollment.user)
        }
      }
      return false
    } catch (e) {
      console.log('FreeCoursesProgram -> validateConditionsToRemoveUser -> ERROR: ', e)
      return false
    }
  }

  // private sendReminderBeforeFinishCourse = async (enrollment: IEnrollment, validityTime: number, courseScheduling: any): Promise<boolean> => {
  //   try {
  //     const startDate = moment(enrollment.created_at)
  //     const expectedFinishDate = moment(enrollment.created_at).add(validityTime, 'second')
  //     const validityTimeInDays = expectedFinishDate.diff(startDate, 'days')
  //     const today = moment()
  //     const daysRemaining = expectedFinishDate.diff(today, 'days')
  //     // console.log({ daysRemaining, validityTimeInDays })
  //     if ([TypeCourse.FREE, TypeCourse.MOOC].includes(courseScheduling?.typeCourse)) {
  //       if (validityTimeInDays > 8 && daysRemaining === 8) {

  //         return true
  //       }
  //     }
  //     return false
  //   } catch (e) {
  //     console.log('FreeCoursesProgram -> sendReminderBeforeFinishCourse -> ERROR: ', e)
  //     return false
  //   }
  // }

  private verifyStudentQualifications = async (enrollment: IEnrollment, courseScheduling: any, needPayment: boolean): Promise<Boolean> => {
    try {
      const certifications = await certificateMultipleService.certificateData({
        course_scheduling: courseScheduling._id,
        studentId: enrollment.user,
        without_certification: true,
      })
      const allCertifications: ICertificateMultipleDataCertification[] = certifications?.student?.certifications || []
      const approvedCertifications = allCertifications?.filter((certification) => certification.approved)
      const courseHasFinished = allCertifications?.length > 0 && allCertifications?.length === approvedCertifications?.length
      // console.log({ approvedCertifications, certifications, courseHasFinished, allCertifications })
      if (approvedCertifications?.length) {
        const systemUser = await User.findOne({ username: system_user }).select('_id')
        const response = await certificateMultipleService.generateCertificate({
          courseSchedulingId: courseScheduling._id,
          students: [{
            userId: enrollment.user,
            certificateSettings: approvedCertifications?.map((certificate) => ({
              certificateSettingId: certificate.certificateSettingId,
              isPartial: certificate.isPartial,
            }))
          }],
          user: systemUser?._id,
          needPayment,
          retryConfig: {
            maxRetries: 3
          }
        })
        if (response?.status === 'error') {
          console.log('FreeCoursesProgram -> verifyStudentQualifications -> GenerateCertificates -> ERROR: ', response)
          return false
        }
      }
      if (courseHasFinished) {
        // TODO: MOdificar este correo electronico para cursos autogestionados
        const withoutTutor = courseScheduling?.withoutTutor ?? false
        console.log('withoutTutor', withoutTutor)
        if (withoutTutor) {
          await courseSchedulingNotificationsService.sendReminderEmailForWithoutTutor(courseScheduling._id, enrollment.user, {stage: 'finished'})
        } else if ([TypeCourse.FREE, TypeCourse.MOOC].includes(courseScheduling?.typeCourse)) {
          await courseSchedulingNotificationsService.sendFreeMoocCourseFinished(courseScheduling._id, enrollment.user)
        }
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

  private getDays(seconds) {
    return Math.floor(seconds / (24 * 60 * 60));
  }
  // @end
}

export const freeCoursesProgram = new FreeCoursesProgram();
export { FreeCoursesProgram };
