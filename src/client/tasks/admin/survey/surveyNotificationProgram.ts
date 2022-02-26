// @import_services Import Services
import { DefaultPluginsTaskTaskService } from "@scnode_core/services/default/plugins/tasks/taskService";
import { courseSchedulingNotificationsService } from '@scnode_app/services/default/admin/course/courseSchedulingNotificationsService';
// @end

// @import_models Import models
import { SurveyLog } from '@scnode_app/models';
// @end

// @import_utilitites Import utilities
import moment from 'moment';
// @end

// @import types
import {TaskParams} from '@scnode_core/types/default/task/taskTypes'
// @end

class SurveyNotificationProgram extends DefaultPluginsTaskTaskService {

  /**
   * Metodo que contiene la logica de la tarea
   * @return Booleano que identifica si se pudo o no ejecutar la tarea
   */
  public run = async (taskParams: TaskParams) => {
    // @task_logic Add task logic

    // @INFO Buscar los survey_log que no hayan sido respondidos
    const logs = await SurveyLog.find({answer_users: {$size: 0}});
    if (logs && logs.length) {
      // @INFO Verificar si ha pasado el tiempo suficiente
      const hoursToVerify = 24;
      for await (let log of logs) {
        const endDate = moment(log.endDate);
        const today = moment();
        if (today.isAfter(endDate.add(hoursToVerify, 'hours'))) {
          // @INFO Notificar al auxiliar logístico del servicio
          if (log.course_scheduling && log.course_scheduling_details) {
            await courseSchedulingNotificationsService.sendSurveyAssistanceNotification(log.course_scheduling, log.course_scheduling_details);
          }
        }
      }
    }
    // @end

    return true; // Always return true | false
  }

  // @add_more_methods
  // @end
}

export const surveyNotificationProgram = new SurveyNotificationProgram();
export { SurveyNotificationProgram };
