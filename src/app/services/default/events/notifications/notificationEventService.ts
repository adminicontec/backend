// @import_dependencies_node Import libraries
// @end

// @import services
import { mailService } from "@scnode_app/services/default/general/mail/mailService";
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { i18nUtility } from "@scnode_core/utilities/i18nUtility";
// @end

// @import models
import { User, CourseScheduling } from "@scnode_app/models";
// @end

// @import types
import { ISendNotificationParticipantCertificated } from "@scnode_app/types/default/events/notifications/notificationTypes";
// @end

class NotificationEventService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  public sendNotificationParticipantCertificated = async (params: ISendNotificationParticipantCertificated) => {
    try {
      const user: any = await User.findOne({_id: params.participantId}).select('id email profile.first_name profile.last_name')
      if (!user) return responseUtility.buildResponseFailed('json', null, {error_key: 'user.not_found'})

      const courseScheduling: any = await CourseScheduling.findOne({_id: params.courseSchedulingId}).select('id program')
      .populate({path: 'program', select: 'id name code'})
      if (!courseScheduling) return responseUtility.buildResponseFailed('json', null, {error_key: 'course_scheduling.not_found'})

      const path_template = 'course/participantCertificated'

      const paramsTemplate = {
        user_name: `${user.profile.first_name}`,
        program_name: courseScheduling?.program?.name || '-',
        amount_notifications: 1,
        notification_source: `participant_certificated_${user._id}_${courseScheduling._id}`
      }

      const mail = await mailService.sendMail({
        emails: [user.email],
        mailOptions: {
          subject: i18nUtility.__('mailer.participant_certificated_notification.subject'),
          html_template: {
            path_layout: 'icontec',
            path_template: path_template,
            params: { ...paramsTemplate }
          },
          amount_notifications: (paramsTemplate.amount_notifications) ? paramsTemplate.amount_notifications : null
        },
        notification_source: paramsTemplate.notification_source
      })

      return responseUtility.buildResponseSuccess('json')
    } catch (error) {
      return responseUtility.buildResponseFailed('json')
    }
  }
}

export const notificationEventService = new NotificationEventService();
export { NotificationEventService as DefaultEventsAcademicContentSurveyNotificationEventService };
