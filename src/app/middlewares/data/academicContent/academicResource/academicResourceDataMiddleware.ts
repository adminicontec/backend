// @import_dependencies_node Import libraries
import { Request, Response, NextFunction } from 'express';
// @end

// @import services
import {academicResourceConfigCategoryService} from '@scnode_app/services/default/admin/academicContent/academicResource/academicResourceConfigCategoryService'
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility, ValidatorRequest } from "@scnode_core/utilities/requestUtility";
// @end

// @import_types Import types
import {QueryValues} from '@scnode_app/types/default/global/queryTypes'
// @end

class AcademicResourceDataMiddleware {

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

  public fetchAcademicResourceData = async (req: Request, res: Response, next: NextFunction) => {
    const fields_config = [];

    await requestUtility.middlewareValidator(fields_config, req, res, next)
  }

  /**
   * Metodo que valida si la categoria del componente academico ha sido proporcionada y genera el servicio que corresponde a ella
   * @param req
   * @param res
   * @param next
   * @returns
   */
  public validateCategory = async (req: Request, res: Response, next: NextFunction) => {
    let isValid = false

    let category_exists = null

    if (req.headers["academic-resource-config-category"]) {
      let categoryId = req.headers["academic-resource-config-category"]
      category_exists = await academicResourceConfigCategoryService.findBy({query: QueryValues.ONE, where: [{field: '_id', value: categoryId.toString()}]})
    }

    if (category_exists && category_exists.status === 'success') {
      req.headers["academic-resource-config-category"] = category_exists.category.name

      const name = category_exists.category.name.replace(/_/g, '-')
      const service_instance = requestUtility.serviceInstance(`academic-resource-config-category-${name}`,"default", "data/academicContent/academicResource/academicResourceConfigCategories");
      if (service_instance.status === 'success') {
        isValid = true
        res.service = service_instance['service'];
      }
    }

    if (isValid === true) {
      next()
    } else {
      return responseUtility.buildResponseFailed('http', res)
    }

}


}

export const academicResourceDataMiddleware = new AcademicResourceDataMiddleware();
export { AcademicResourceDataMiddleware as DataAcademicContentAcademicResourceAcademicResourceDataMiddleware }
