// @import_services Import Services
import { DefaultPluginsTaskTaskService } from "@scnode_core/services/default/plugins/tasks/taskService";
// @end

// @import_models Import models
// @end

// @import_utilitites Import utilities
// @end

// @import types
import {TaskParams} from '@scnode_core/types/default/task/taskTypes'
import { mailService } from '@scnode_app/services/default/general/mail/mailService';
import { customs } from "@scnode_core/config/globals";
// @end

enum Notification {
  FREE_COURSE_FINISHED = 'course/schedulingFreeMoocFinished',
  CERTIFICATION_FREE_COURSES_REMINDER = 'user/freeMoocCertificationsReminder',
  CONFIRM_EMAIL = 'user/confirmEmail',
  CONFIRM_2FA = 'user/confirm2FA',
  WELCOME_FREE_COURSE = 'user/selfRegistrationEnrollment',
  FINISH_FREE_COURSE_REMINDER = 'course/schedulingFreeMoocReminder',
  ENROLLMENT_USER = 'user/enrollmentUser',
  ENROLLMENT_USER_QUICK_LEARNING = 'user/enrollmentUserQuickLearning',
  WELCOME_PLATFORM = 'user/welcomeUser',
  EXAM_TO_PARTICIPANT = 'course/schedulingExamToParticipant'
}

const SUBJECTS = {
  [Notification.WELCOME_PLATFORM]: '¡Bienvenid@ al Campus Digital Icontec!',
  [Notification.ENROLLMENT_USER]: 'Inicio del curso/programa/diplomado',
  [Notification.EXAM_TO_PARTICIPANT]: 'Activación de examen'
}

interface IExecuteNotificationParams {
  template: Notification
  email?: string
  withRealSubject?: boolean
}

class TestNotificationsProgram extends DefaultPluginsTaskTaskService {

  /**
   * Metodo que contiene la logica de la tarea
   * @return Booleano que identifica si se pudo o no ejecutar la tarea
   */
  public run = async (taskParams: TaskParams) => {
    // @task_logic Add task logic
    // @end
    await this.executeNotification({
      template: Notification.ENROLLMENT_USER,
      withRealSubject: true
    })

    return true; // Always return true | false
  }

  private executeNotification = async ({
    template,
    email = 'davidtest@test.com',
    withRealSubject
  }: IExecuteNotificationParams) => {
    const mail = await mailService.sendMail({
      emails: [email],
      mailOptions: {
        subject: (withRealSubject && SUBJECTS[template]) ? SUBJECTS[template] : `Test email - ${template}`,
        html_template: {
          path_layout: 'icontec',
          path_template: template,
          params: this.getMockParams()
        },
        amount_notifications: null
      },
      notification_source: `test_notification_task_${template}`
    });
    console.log({ mail })
  }

  private getMockParams = () => {
    return {
      mailer: customs['mailer'],
      studentName: 'Demo Test',
      courseName: 'Course name test',
      first_name: 'Demo',
      last_name: 'Test',
      courseType: 'mooc',
      course_name: 'Course name test',
      service_id: '5TR202404164587',
      course_start: '2024-04-12',
      course_end: '2024-04-20',
      username: '12365874562',
      password: '12365874562',
      firstName: 'Demo',
      duration: '15',
      token: '859140',
      goToConfirm: 'https://campus.icontecvirtual.edu.co',
      goToCertifications: 'https://campus.icontecvirtual.edu.co',
      serviceValidity:'20 días',
      footerText: 'pilla',
      certifications: [
        {
          certificateName: 'Certificate test 1'
        },
        {
          certificateName: 'Certificate test 2'
        }
      ],
      studentParams: {
        studentName: 'Demo Test',
        moduleName: 'Módulo prueba',
        endDate: 'YYYY-MM-DD 23:59:59',
        serviceId: '5TR202404164587',

      }
    }
  }

  // @add_more_methods
  // @end
}

export const testNotificationsProgram = new TestNotificationsProgram();
export { TestNotificationsProgram };
