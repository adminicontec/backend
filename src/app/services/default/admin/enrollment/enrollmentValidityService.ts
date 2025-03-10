
import moment from "moment";

import { CertificateQueue, CourseScheduling, CourseSchedulingStatus, Enrollment, User } from "@scnode_app/models";
import { TypeCourse } from "@scnode_app/types/default/admin/course/courseSchedulingTypes";
import { EnrollmentStatus } from '@scnode_app/types/default/admin/enrollment/enrollmentTypes';
import { enrollmentService } from "@scnode_app/services/default/admin/enrollment/enrollmentService"
import { courseSchedulingNotificationsService } from '@scnode_app/services/default/admin/course/courseSchedulingNotificationsService';
import { certificateMultipleService } from "@scnode_app/services/default/admin/certificate/certificateMultipleService";
import { ICertificateMultipleDataCertification } from '@scnode_app/types/default/admin/certificate/certificateMultipleTypes';
import { system_user } from '@scnode_core/config/globals';
import { CourseSchedulingStatusName } from "@scnode_app/types/default/admin/course/courseSchedulingStatusTypes";

interface IEnrollment {
  _id: string
  created_at: string
  user: string
  course_scheduling: string
}

class EnrollmentValidityService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor() { }

  public verifyStudentsValidity = async () => {
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
      }).select('_id metadata serviceValidity withoutTutor quickLearning program typeCourse')
      .populate({path: 'program', select: 'id name'})

      for (const courseScheduling of courseSchedulings) {

        const enrollments = await Enrollment.find({
          course_scheduling: courseScheduling._id,
          deletedAt: { $exists: false },
        }).select('_id created_at user course_scheduling')

        if (!enrollments?.length) continue;

        const certificationsByService = await CertificateQueue.find({
          courseId: courseScheduling._id
        })
        const certificatesByUser = certificationsByService.reduce((accum, element) => {
          if (!accum[element.userId]) {
            accum[element.userId] = element
          }
          return accum
        }, {})

        for (const enrollment of enrollments) {
          console.group(`Student::${enrollment.user}`)
          // @INFO: Obtener estado del estudiante según actividad en Moodle y Certificación
          let {currentStatus, generalProgress} = await this.getCurrentEnrollmentStatus(enrollment._id)
          console.log(`Estado actual del estudiante::${currentStatus}::${generalProgress}`)

          let userCertificated = currentStatus === EnrollmentStatus.CERTIFIED || certificatesByUser[enrollment.user] ? true : false;

          const withoutTutor = courseScheduling?.withoutTutor ?? false
          const freeOrMooc = [TypeCourse.FREE, TypeCourse.MOOC].includes(courseScheduling?.typeCourse)
          const quickLearning = courseScheduling?.quickLearning ?? false

          let daysBeforeEnd = 30;
          let additionalDaysAfterCompletionToDeregister = 0;
          let unenrolment = true;

          if (freeOrMooc) daysBeforeEnd = 8
          if (withoutTutor) {
            daysBeforeEnd = 0
            additionalDaysAfterCompletionToDeregister = 3
          }
          if (quickLearning) {
            daysBeforeEnd = 5
            additionalDaysAfterCompletionToDeregister = 1
          }

          // @INFO: Obtener fechas de vencimiento del curso según estudiante
          const {hasEnded, isEndingSoon, daysSinceEnd, daysToEnding, courseEndDate} = enrollmentService.getCourseEndStatus(
            enrollment.created_at,
            {
              serviceStartDate: courseScheduling.startDate,
              serviceEndDate: courseScheduling.endDate
            },
            Number(courseScheduling.serviceValidity),
            daysBeforeEnd
          )

          if (generalProgress > 0 || currentStatus === EnrollmentStatus.IN_PROGRESS) {
          // if (currentStatus === EnrollmentStatus.IN_PROGRESS) {
            // @INFO: Verificar estado academico y de certificaciones del estudiante
            userCertificated = await this.verifyStudentQualifications(enrollment, courseScheduling, courseScheduling?.withoutTutor ? false : true)
            const {currentStatus: newCurrentStatus} = await this.getCurrentEnrollmentStatus(enrollment._id)
            currentStatus = newCurrentStatus
            console.log(`Estado actualizado del estudiante::${currentStatus}::${userCertificated}`)
          }

          // if (userCertificated && withoutTutor) additionalDaysAfterCompletionToDeregister = 0

          // @INFO: Gatillar notificaciones del usuario
          await Promise.all(
            this.launchNotifications(
              courseScheduling,
              enrollment,
              userCertificated,
              currentStatus,
              {
                isEndingSoon,
                daysToEnding,
                additionalDaysAfterCompletionToDeregister,
                courseEndDate,
                generalProgress
              }))

          console.log(`Información de la matricula`, {
            hasEnded,
            isEndingSoon,
            daysSinceEnd,
            daysToEnding,
            courseEndDate,
            additionalDaysAfterCompletionToDeregister
          })

          if (hasEnded && unenrolment) {
            if (daysSinceEnd > additionalDaysAfterCompletionToDeregister) {
              console.log('Unenrollment student')
              const result = await enrollmentService.delete({ id: enrollment._id })
              if (result.status === 'error') {
                console.log('FreeCoursesProgram -> validateConditionsToRemoveUser -> removeEnrollmentError: ', result)
              }
            }
          }
          console.groupEnd()
        }
      }
    } catch (e) {
      console.log('FreeCoursesProgram -> verifyStudentsValidity -> ERROR: ', e)
    }
  }

  private launchNotifications (
    courseScheduling: any,
    enrollment: any,
    userCertificated: boolean,
    userStatus: EnrollmentStatus,
    options: {
      isEndingSoon: boolean,
      daysToEnding: number,
      additionalDaysAfterCompletionToDeregister: number,
      courseEndDate: string,
      generalProgress: number
    }
  ) {
    const {isEndingSoon, daysToEnding, additionalDaysAfterCompletionToDeregister, courseEndDate, generalProgress} = options;
    const withoutTutor = courseScheduling?.withoutTutor ?? false
    const freeOrMooc = [TypeCourse.FREE, TypeCourse.MOOC].includes(courseScheduling?.typeCourse)
    const quickLearning = courseScheduling?.quickLearning ?? false
    const notifications = []
    console.group('Notifications')
    if (withoutTutor) {
      const phaseDuration = Number(courseScheduling.serviceValidity / 3);
      const customData: any = {
        additionalDaysAfterCompletionToDeregister,
        courseEndDate
      }
      // @INFO: Primera tercera parte
      if (this.shouldTriggerAction(enrollment.created_at, phaseDuration) && !userCertificated) {
        const stage = generalProgress > 0 || userStatus !== EnrollmentStatus.REGISTERED ? 'first_success' : 'first_failed'
        console.log(`withoutTutor - First Notification launched`,{stage, customData})
        notifications.push(courseSchedulingNotificationsService.sendReminderEmailForWithoutTutor(courseScheduling._id, enrollment._id, enrollment.user, { stage, customData }))
      }
      // @INFO: Segunda tercera parte
      if (this.shouldTriggerAction(enrollment.created_at, phaseDuration * 2) && !userCertificated) {
        customData.daysToEnding = daysToEnding;
        customData.generalProgress = generalProgress
        const stage = generalProgress > 0 || userStatus !== EnrollmentStatus.REGISTERED ? 'second_success' : 'second_failed'
        console.log(`withoutTutor - Second Notification launched`, {stage, customData})
        notifications.push(courseSchedulingNotificationsService.sendReminderEmailForWithoutTutor(courseScheduling._id, enrollment._id, enrollment.user, { stage, customData }))
      }
      // @Info: Fin del curso
      if (this.shouldTriggerAction(enrollment.created_at, Number(courseScheduling.serviceValidity))) {
        const stage = userCertificated ? 'finished_success' : 'finished_failed'
        console.log(`withoutTutor - Finished Notification launched`, {stage, customData})
        notifications.push(courseSchedulingNotificationsService.sendReminderEmailForWithoutTutor(courseScheduling._id, enrollment._id, enrollment.user, {stage, customData}))
      }
    } else if (quickLearning) {
      if (isEndingSoon && daysToEnding > 0) {
        const customData = {
          daysToEnding
        }
        notifications.push(courseSchedulingNotificationsService.sendReminderEmailForQuickLearning(courseScheduling, enrollment.user, {customData}))
      }
    } else if (freeOrMooc) {
      if (isEndingSoon && daysToEnding > 0) {
        const customData = {
          daysToEnding
        }
        notifications.push(courseSchedulingNotificationsService.sendReminderEmailForFreeOrMooc(courseScheduling._id, enrollment.user, {customData}))
      }

      if (userCertificated) {
        notifications.push(courseSchedulingNotificationsService.sendFreeMoocCourseFinished(courseScheduling._id, enrollment.user))
      }
    }
    console.groupEnd()
    return notifications
  }

  private shouldTriggerAction(enrollmentDate: string, durationSeconds: number): boolean {
    // Convert enrollmentDate to a moment object
    console.group('Notification::ShouldTriggerAction')
    const startDate = moment(enrollmentDate);
    console.log('- startDate', startDate)

    if (!startDate.isValid()) {
      throw new Error('Invalid enrollment date');
    }

    // Calculate the first third of the duration in seconds
    const seconds = Math.floor(durationSeconds);

    // Calculate the end date of the first third part
    const endDate = startDate.clone().add(seconds, 'seconds');
    console.log('- endDate', endDate)
    console.log(`Estado de condición::${moment().isAfter(endDate)}`)
    console.groupEnd()
    // Check if the current date is past the first third end date
    return moment().isAfter(endDate);
  }

  private verifyStudentQualifications = async (enrollment: IEnrollment, courseScheduling: any, needPayment: boolean): Promise<boolean> => {
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
          },
          synchronousProcedure: true
        })
        if (response?.status === 'error') {
          console.log('FreeCoursesProgram -> verifyStudentQualifications -> GenerateCertificates -> ERROR: ', response)
          return false
        }
      }
      return courseHasFinished
    } catch (e) {
      console.log('FreeCoursesProgram -> verifyStudentQualifications -> ERROR: ', e)
      return false
    }
  }

  private getCurrentEnrollmentStatus = async (enrollmentId: string): Promise<{currentStatus: EnrollmentStatus, generalProgress: number} | null> => {
    const currentStatusResponse: any = await enrollmentService.getCurrentEnrollmentStatus({ enrollmentId })
    if (currentStatusResponse?.status === 'error') return null
    return {currentStatus: currentStatusResponse.currentStatus, generalProgress: currentStatusResponse.generalProgress}
  }
}


export const enrollmentValidityService = new EnrollmentValidityService();
export { EnrollmentValidityService as DefaultAdminEnrollmentEnrollmentValidityService };
