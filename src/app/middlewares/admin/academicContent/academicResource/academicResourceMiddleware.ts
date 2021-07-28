// @import_dependencies_node Import libraries
import { Request, Response, NextFunction } from 'express';
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility, ValidatorRequest } from "@scnode_core/utilities/requestUtility";
// @end

// @import services
import {academicResourceCategoryService} from '@scnode_app/services/default/admin/academicContent/academicResource/academicResourceCategoryService'
// @end

// @import types
import {QueryValues} from '@scnode_app/types/default/global/queryTypes'
// @end

class AcademicResourceMiddleware {

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
			{ key: 'title', label: 'Nombre del recurso' },
      { key: 'academic_resource_category', label: 'Categoria del recurso' },
		];

		await requestUtility.middlewareValidator(fields_config, req, res, next)
  }

  /**
   * Metodo que valida si la categoria del recurso ha sido proporcionada y genera el servicio que corresponde a ella
   * @param req
   * @param res
   * @param next
   * @returns
   */
  public validateCategory = async (req: Request, res: Response, next: NextFunction) => {

    let isValid = false
    if (req.headers["academic-resource-category"]) {
      let categoryId = req.headers["academic-resource-category"]
      const category_exists: any = await academicResourceCategoryService.findBy({query: QueryValues.ONE, where: [{field: '_id', value: categoryId.toString()}]})
      if (category_exists.status === 'success') {
        req.headers["academic-resource-category"] = category_exists.category.name

        const service_instance = requestUtility.serviceInstance(`academic-resource-${category_exists.category.name}`,"default", "admin/academicContent/academicResource");
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
        error_key: 'academicResource.category_invalid',
      })
    }
  }
}

export const academicResourceMiddleware = new AcademicResourceMiddleware();
export { AcademicResourceMiddleware as AdminAcademicContentAcademicResourceAcademicResourceMiddleware }
