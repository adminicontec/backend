// @import_dependencies_node Import libraries
// @end

// @import services
import {DefaultAdminAcademicContentAcademicResourceAcademicResourceService} from '@scnode_app/services/default/admin/academicContent/academicResource/academicResourceService'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
// @end

// @import types
import {IAcademicResource, IAcademicResourceOptions, IAcademicResourceQuestions} from '@scnode_app/types/default/admin/academicContent/academicResource/academicResourceTypes'
// @end

class AcademicResourceSurveyService extends DefaultAdminAcademicContentAcademicResourceAcademicResourceService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {
    super()
  }

  /**
     * Método que se ejecuta antes de almacenar el registro en BD,
     * @param params Elementos a registrar
     * @returns
     */
   public preSave = async (params: IAcademicResource, options: IAcademicResourceOptions) => {

    let questions: IAcademicResourceQuestions[] = (params.config && params.config.questions) ? params.config && params.config.questions : []

    if (options.resource && options.resource.config && options.resource.config.questions && questions.length === 0) questions = options.resource.config.questions

    if (questions.length > 0) {
      const questionsValid = await this.validateQuestionsStructure(questions)
      if (!questionsValid) return responseUtility.buildResponseFailed('json', null, {error_key: 'academicResource.resources.questions_invalid'})
    }

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        params
      }
    })
}

}

export const academicResourceSurveyService = new AcademicResourceSurveyService();
export { AcademicResourceSurveyService as DefaultAdminAcademicContentAcademicResourceAcademicResourceSurveyService };
