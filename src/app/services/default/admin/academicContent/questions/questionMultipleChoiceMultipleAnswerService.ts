// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { IQuestion, IQuestionOptions } from '@scnode_app/types/default/admin/academicContent/questions/questionTypes';
import { DefaultAdminAcademicContentQuestionsQuestionService } from '@scnode_app/services/default/admin/academicContent/questions/questionService';
// @end

// @import models
// @end

// @import types
// @end

class QuestionMultipleChoiceMultipleAnswerService extends DefaultAdminAcademicContentQuestionsQuestionService {

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
   * Metodo que se ejecuta antes de almacenar el registro en BD,
   * @param params Elementos a registrar
   * @returns
   */
  public preSave = async (params: IQuestion, options: IQuestionOptions) => {

    let answers = await this.mergeAnswers(params, options)

    // @INFO: Validando valor de la pregunta
    // const validateValueRequired = await this.validateValueRequired(params, options)
    // if (validateValueRequired.status === 'error') return validateValueRequired

    // @INFO: Si se esta creando el registro se debe validar siempre que exista al menos una respuesta
    if (options.action === 'new') {
        if (answers.length === 0) return responseUtility.buildResponseFailed('json', null, {error_key: 'question.answers.required'})
    }

    if (!params.force) {
      // @INFO: Validando que exista al menos 1 respuesta correcta para este tipo de pregunta
      const answersCorrected = await this.getAnswersCorrected(answers)
      if (answersCorrected.length === 0) return responseUtility.buildResponseFailed('json', null, {error_key: {key: 'question.answers.answer_corrected_required', params: {number: 1}}})
      if (answersCorrected.length > 1) return responseUtility.buildResponseFailed('json', null, {error_key: {key: 'question.answers.answer_corrected_limit', params: {number: 1}}})

      // @INFO: Validando el valor de la pregunta contra el valor de las respuestas
      const validateValue = await this.validateValue(params, options, answers)
      if (validateValue.status === 'error') return validateValue

    }

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        params
      }
    })
  }

}

export const questionMultipleChoiceMultipleAnswerService = new QuestionMultipleChoiceMultipleAnswerService();
export { QuestionMultipleChoiceMultipleAnswerService as DefaultAdminAcademicContentQuestionsQuestionMultipleChoiceMultipleAnswerService };
