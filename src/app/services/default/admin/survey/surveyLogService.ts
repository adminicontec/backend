// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import { SurveyLog } from '@scnode_app/models';
import { ISaveSurveyLog } from 'app/types/default/admin/survey/surveyLogTypes';
// @end

// @import types
// @end

class SurveyLogService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  public saveLog = async (params: ISaveSurveyLog) => {
    try{

      // @INFO Validar que solo exista un log
      if (params.course_scheduling && !params.course_scheduling_details) {
        const response = await SurveyLog.findOne({course_scheduling: params.course_scheduling, course_scheduling_details: {$exists: false}});
        if (response) return responseUtility.buildResponseFailed('json');
      } else if (params.course_scheduling && params.course_scheduling_details) {
        const response = await SurveyLog.findOne({course_scheduling: params.course_scheduling, course_scheduling_details: params.course_scheduling_details});
        if (response) return responseUtility.buildResponseFailed('json');
      }

      // @INFO Guardar el log
      const response = await SurveyLog.create(params);

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          surveyLog: response
        }
      });

    } catch(e){
      console.log('surveyLogService => saveLog => error: ', e);
      return responseUtility.buildResponseFailed('json');
    }
  }

}

export const surveyLogService = new SurveyLogService();
export { SurveyLogService as DefaultAdminSurveySurveyLogService };
