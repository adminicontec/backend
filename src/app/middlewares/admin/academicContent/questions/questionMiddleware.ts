// @import_dependencies_node Import libraries
import { Request, Response, NextFunction } from 'express';
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility, ValidatorRequest } from "@scnode_core/utilities/requestUtility";
// @end

// @import types
import {QueryValues} from '@scnode_app/types/default/global/queryTypes'
// @end

// @import services
import {questionCategoryService} from '@scnode_app/services/default/admin/academicContent/questions/questionCategoryService'
// @end

class QuestionMiddleware {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = (req: Request, res: Response, next: NextFunction) => {
      const fields_config: ValidatorRequest[] = [
        { key: 'one_field', label: 'This is a short description'},
      ]
      await requestUtility.middlewareValidator(fields_config, req, res, next)
    }
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  public create = async (req: Request, res: Response, next: NextFunction) => {
		const fields_config = [
      { key: 'content', label: 'Pregunta' },
      { key: 'question_category', label: 'Categoria de la pregunta' },
		];

		await requestUtility.middlewareValidator(fields_config, req, res, next)
  };

  /**
   * Metodo que valida si la categoria del recurso ha sido proporcionada y genera el servicio que corresponde a ella
   * @param req
   * @param res
   * @param next
   * @returns
   */
  public validateCategory = async (req: Request, res: Response, next: NextFunction) => {
    let isValid = false
    if (req.headers["question-category"]) {
      let categoryId = req.headers["question-category"]
      const category_exists: any = await questionCategoryService.findBy({query: QueryValues.ONE, where: [{field: '_id', value: categoryId.toString()}]})
      if (category_exists.status === 'success') {
        req.headers["question-category"] = category_exists.category.name

        const service_instance = requestUtility.serviceInstance(`question-${category_exists.category.name}`,"default", "admin/academicContent/questions");
        if (service_instance.status === 'success') {
          isValid = true
          res.service = service_instance['service'];
        }
      }
    }
    if (isValid === true) {
      next()
    } else {
      return responseUtility.buildResponseFailed('http', res, {
        error_key: 'question.category_invalid',
      })
    }
  }
}

export const questionMiddleware = new QuestionMiddleware();
export { QuestionMiddleware as AdminAcademicContentQuestionsQuestionMiddleware }
