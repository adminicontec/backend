// @import_dependencies_node Import libraries
// @end

// @import services
import { userService } from '@scnode_app/services/default/admin/user/userService';
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { requestUtility } from '@scnode_core/utilities/requestUtility';
// @end

// @import models
// @end

// @import types
import { QueryValues } from '@scnode_app/types/default/global/queryTypes';
import {
  IFetchAcademicResourceData,
  IModulesAvailableByConfig
} from '@scnode_app/types/default/data/academicContent/academicResource/academicResourceDataTypes'
// @end

class AcademicResourceDataService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite obtener la estructura por defecto para el populate de una configuración de recurso y recurso academico
   * @returns
   */
  protected getResourceContainerPopulateStructure = () => {

    const structure = {
      path: 'config.content actions.config.content',
      populate: [
        {
          path: 'academic_resource',
          populate: [
            {
              path: 'academic_resource_category'
            },
            {
              path: 'config.questions.question',
              populate: {
                path: 'question_category', select: 'id name description config'
              }
            }
          ]
        },
        {
          path: 'source.config_category',
          select: 'id name description config'
        }
      ],
    }
    return structure
  }

  /**
   * Metodo que permite obtener el elemento contenedor del recurso academico
   * @param params Objeto con los datos para buscar la información del recurso
   * @returns
   */
  protected getResourceContainer = async (params: IFetchAcademicResourceData) => {
    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        academicResourceConfig: {},
        academicResource: {},
        resourceContainer: {}
      }
    })
  }

  /**
   * Metodo que permite consultar la información de un recurso
   * @param params Objeto con los datos para buscar la información del recurso
   * @returns
   */
  public fetchAcademicResourceData = async (params: IFetchAcademicResourceData) => {

    try {

      let user = null

      // @INFO: Validando usuario
      const user_exists: any = await userService.findBy({query: QueryValues.ONE, where: [{field: '_id', value: params.user}]})
      if (user_exists.status === 'error') return user_exists
      user = user_exists.user

      const {
        academicResourceConfig,
        academicResource,
        resourceContainer
      }: any = await this.getResourceContainer(params)

      // @INFO: Generando instancia de servicio para cada tipo de recurso
      const service_instance = requestUtility.serviceInstance(`academic-resource-data-${academicResource.academic_resource_category.name}`, "default", "data/academicContent/academicResource/academicResourceData");
      if (service_instance.status === 'error') return responseUtility.buildResponseFailed('json')

      const instance = service_instance['service']

      let processAcademicResourceDataResponse = await instance.processAcademicResourceData({
        academicResourceConfig,
        academicResource,
        user,
      })
      if (processAcademicResourceDataResponse.status === 'error') return processAcademicResourceDataResponse

      const resource = processAcademicResourceDataResponse.resource
      const possible_launch_config = (processAcademicResourceDataResponse.possible_launch_config) ? processAcademicResourceDataResponse.possible_launch_config : {}
      const default_module = (processAcademicResourceDataResponse.props && processAcademicResourceDataResponse.props.default_module) ? processAcademicResourceDataResponse.props.default_module : null

      let launch_config = {...academicResourceConfig.config}

      // @INFO: Construyendo información para el cliente
      let academicResourceData = {
        academic_resource: academicResource._id,
        academic_resource_config: academicResourceConfig._id,
        academic_resource_config_category: (academicResourceConfig.source && academicResourceConfig.source.config_category && academicResourceConfig.source.config_category._id) ? academicResourceConfig.source.config_category._id : null,
        title: resourceContainer.name,
        name: resourceContainer.name,
        description: (resourceContainer.description) ? resourceContainer.description : '',
        thumbnail: (resourceContainer.props && resourceContainer.props.thumbnail) ? resourceContainer.props.thumbnail : null,
        config: resource,
        category: {
          _id: academicResource.academic_resource_category._id,
          name: academicResource.academic_resource_category.name,
        },
        modules: [],
        default_module,
        launch_config,
        possible_launch_config,
        status: (resourceContainer.status) ? resourceContainer.status : null,
      }

      // @INFO: Consultando los modulos disponibles segun el modo de lanzamiento
      academicResourceData.modules = await this.getModulesAvailableByConfig({
        academicResourceConfig
      })

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          academicResourceData
        }
      })

    } catch (e) {
      console.log('e', e)
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que extrae los modulos disponibles de la configuración y los asigna a un array
   * @param params Objeto con la configuración para extraer los modulos
   * @returns
   */
  private getModulesAvailableByConfig = async (params: IModulesAvailableByConfig) => {
    let modules = []
    if (params.academicResourceConfig.config) {
      let items = { ...params.academicResourceConfig.config }
      for (const key in items) {
        if (key.search(/_module/g) !== -1 && items[key] === true) {
          modules.push(key)
        }
      }
    }
    return modules
  }

  /**
   * Metodo que permite consultar las posibles herramientas de configuración de un recurso
   * @param academicResourceConfig
   * @param academicResource
   * @returns
   */
  public getPosibleLaunchConfig = async (academicResourceConfig: any, academicResource: any) => {

    let possible_launch_config = {}

    if (
      (academicResourceConfig && academicResourceConfig.source && academicResourceConfig.source.config_category && academicResourceConfig.source.config_category.config) &&
      (academicResource.academic_resource_category && academicResource.academic_resource_category.config)
    ) {
      // @INFO: Se consultan las posibles configuraciones según el origen del contenedor AcademicResourceConfigCategory
      let config_by_source = academicResourceConfig.source.config_category.config

      // @INFO: Se iteran las posibles configuraciones según el recurso AcademicResourceCategory
      for (const key in academicResource.academic_resource_category.config) {
        if (Object.prototype.hasOwnProperty.call(academicResource.academic_resource_category.config, key)) {
          // @INFO: Solamente se agregan las configuraciones que sean iguales en ambas categorias
          if (config_by_source[key]) {
            possible_launch_config[key] = config_by_source[key]
          }
        }
      }
    }

    return possible_launch_config
  }

}

export const academicResourceDataService = new AcademicResourceDataService();
export { AcademicResourceDataService as DefaultDataAcademicContentAcademicResourceAcademicResourceDataService };
