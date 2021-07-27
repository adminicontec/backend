// @import_dependencies_node Import libraries
// @end

// @import services
import {academicResourceService} from '@scnode_app/services/default/admin/academicContent/academicResource/academicResourceService'
import {academicResourceDataService} from '@scnode_app/services/default/data/academicContent/academicResource/academicResourceDataService'
import {questionService} from '@scnode_app/services/default/admin/academicContent/questions/questionService'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { mapUtility } from '@scnode_core/utilities/mapUtility';
// @end

// @import models
// @end

// @import types
import {
  IProcessAcademicResourceData
} from '@scnode_app/types/default/data/academicContent/academicResource/academicResourceDataTypes'
// @end

class AcademicResourceDataSurveyService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite procesar la información del recurso y generar la data necesaria segun su tipo
   * @param params Objeto con los datos del recurso academico
   * @returns
   */
  public processAcademicResourceData = async (params: IProcessAcademicResourceData) => {

    let possible_launch_config = await academicResourceDataService.getPosibleLaunchConfig(params.academicResourceConfig,params.academicResource)

    if (!params.academicResource.config) {
      params.academicResource.config = {}
    }

    // @INFO: Generando instancia del administrador de recursos academicos segun categoria de recurso
    const academicResourceInstanceService = await academicResourceService.getInstance({
      type: 'by_resource',
      resource: params.academicResource
    })
    if (academicResourceInstanceService && params.academicResource.config && params.academicResource.config.questions) {
      // @INFO: Procesar las preguntas para agrupar los estimulos y sus correspondientes preguntas
      params.academicResource.config.questions = await academicResourceInstanceService.mergeContainerQuestions(params.academicResource.config.questions)

      // @INFO: Procesando la data de las preguntas
      params.academicResource.config.questions = await questionService.processQuestionsData({
        questions: params.academicResource.config.questions
      })
    }

    params.academicResource.config.attempt_active = null
    params.academicResource.config.number_of_attempts = 0
    params.academicResource.config.max_attemps = responseUtility.buildResponseSuccess('json')

    if (
      params.academicResourceConfig &&
      params.academicResourceConfig.config
    ) {

      // @INFO: Orden de las preguntas
      if (
          params.academicResourceConfig.config.order_of_questions &&
          params.academicResourceConfig.config.order_of_questions === 'random'
      ) {
          params.academicResource.config.questions = mapUtility.shuffle(params.academicResource.config.questions)
      }

      // @INFO: Consultando el intento activo de un usuario para el ejercicio
      // if (
      //   params.academicResourceConfig.config.continue_exercise &&
      //   params.academicResourceConfig.config.continue_exercise === true
      // ) {
      //   params.academicResource.config.attempt_active = await academicResourceDataAttemptService.getAttemptActive({
      //     structure: (params.structure && params.structure._id) ? params.structure._id : null,
      //     user: params.user._id,
      //     alliance_id: params.user.alliance_id,
      //     academic_resource_config: params.academicResourceConfig._id
      //   })
      // }
    }

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        resource: params.academicResource.config,
        possible_launch_config,
        props: {}
      }
    })
  }

}

export const academicResourceDataSurveyService = new AcademicResourceDataSurveyService();
export { AcademicResourceDataSurveyService as DefaultDataAcademicContentAcademicResourceAcademicResourceDataAcademicResourceDataSurveyService };
