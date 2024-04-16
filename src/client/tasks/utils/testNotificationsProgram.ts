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
}

class TestNotificationsProgram extends DefaultPluginsTaskTaskService {

  /**
   * Metodo que contiene la logica de la tarea
   * @return Booleano que identifica si se pudo o no ejecutar la tarea
   */
  public run = async (taskParams: TaskParams) => {
    // @task_logic Add task logic
    // @end
    await this.executeNotification(Notification.FREE_COURSE_FINISHED)

    return true; // Always return true | false
  }

  private executeNotification = async (template: Notification, email = 'davidtest@test.com') => {
    const mail = await mailService.sendMail({
      emails: [email],
      mailOptions: {
        subject: 'Recordatorio finalización de curso',
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
      studentName: 'David Test',
      courseName: 'Course name test',
      first_name: 'David',
      last_name: 'Test',
      courseType: 'mooc',
      course_name: 'Course name test',
      service_id: '5TR202404164587',
      course_start: '2024-04-12',
      course_end: '2024-04-20',
      username: '12365874562',
      firstName: 'David',
      duration: '15',
      token: 'https://campus.icontecvirtual.edu.co',
      goToConfirm: 'https://campus.icontecvirtual.edu.co',
      goToCertifications: 'https://campus.icontecvirtual.edu.co',
      certifications: [
        {
          certificateName: 'Certificate test 1'
        },
        {
          certificateName: 'Certificate test 2'
        }
      ]
    }
  }

  // @add_more_methods
  // @end
}

export const testNotificationsProgram = new TestNotificationsProgram();
export { TestNotificationsProgram };
