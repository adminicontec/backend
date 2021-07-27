// @import_dependencies_node Import libraries
// @end

// @import services
import {DefaultDataAcademicContentAcademicResourceAcademicResourceDataService} from '@scnode_app/services/default/data/academicContent/academicResource/academicResourceDataService'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import {Survey} from '@scnode_app/models'
// @end

// @import types
import {
  IFetchAcademicResourceData
} from '@scnode_app/types/default/data/academicContent/academicResource/academicResourceDataTypes'
// @end

class AcademicResourceConfigCategorySurveyService extends DefaultDataAcademicContentAcademicResourceAcademicResourceDataService {

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
     * Metodo que permite obtener el elemento contenedor del recurso academico
     * @param params Objeto con los datos para buscar la información del recurso
     * @returns
     */
   protected getResourceContainer = async (params: IFetchAcademicResourceData) => {

    if (!params.survey) return responseUtility.buildResponseFailed('json', null, {error_key: 'academicResource.fetchAcademicResourceData.survey.invalid'})

    const populate = this.getResourceContainerPopulateStructure()
    // @INFO: Validando encuesta
    const survey = await Survey.findOne({_id: params.survey})
    .select('id name description config status')
    .populate(populate).lean()

    if (!survey) return responseUtility.buildResponseFailed('json', null, {error_key: 'academicResource.fetchAcademicResourceData.survey.invalid'})

    if (!survey.config && !survey.config.content && !survey.config.content.academic_resource) return responseUtility.buildResponseFailed('json', null, {error_key: 'academicResource.fetchAcademicResourceData.survey.invalid'})

    let resourceContainer = {
      name: survey.name,
      description: survey.description,
      status: survey.status,
      props: {}
    }

    return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
      academicResourceConfig: survey.config.content,
      academicResource: survey.config.content.academic_resource,
      resourceContainer
    }})
  }

}

export const academicResourceConfigCategorySurveyService = new AcademicResourceConfigCategorySurveyService();
export { AcademicResourceConfigCategorySurveyService as DefaultDataAcademicContentAcademicResourceAcademicResourceConfigCategoriesAcademicResourceConfigCategorySurveyService };
