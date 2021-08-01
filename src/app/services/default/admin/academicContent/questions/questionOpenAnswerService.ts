// @import_dependencies_node Import libraries
// @end

// @import services
import {DefaultAdminAcademicContentQuestionsQuestionService} from '@scnode_app/services/default/admin/academicContent/questions/questionService'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
// @end

// @import types
import {IQuestion,IQuestionOptions} from '@scnode_app/types/default/admin/academicContent/questions/questionTypes'
// @end

class QuestionOpenAnswerService extends DefaultAdminAcademicContentQuestionsQuestionService {

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

    // @INFO: Validando valor de la pregunta
    // const validateValueRequired = await this.validateValueRequired(params, options)
    // if (validateValueRequired.status === 'error') return validateValueRequired

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        params
      }
    })
  }
}

export const questionOpenAnswerService = new QuestionOpenAnswerService();
export { QuestionOpenAnswerService as DefaultAdminAcademicContentQuestionsQuestionOpenAnswerService };
