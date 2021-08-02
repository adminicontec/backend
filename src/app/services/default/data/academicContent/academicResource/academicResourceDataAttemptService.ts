// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import {AcademicResourceAttempt} from '@scnode_app/models'
// @end

// @import types
import {
  IGetAttemptActive
} from '@scnode_app/types/default/data/academicContent/academicResource/academicResourceDataAttemptTypes'
// @end

class AcademicResourceDataAttemptService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite consultar el intento activo del usuario y ejercicio
   * @param params Objeto con la data necesaria para la consulta
   * @returns
   */
  public getAttemptActive = async (params: IGetAttemptActive) => {

    let status = ['started']
    if (params.status && Array.isArray(params.status)) {
      status = params.status
    }

    let query = {
      user: params.user,
      academic_resource_config: params.academic_resource_config,
      'results.status': status
    }

    const lastAttemp = await AcademicResourceAttempt.findOne(query)
    return lastAttemp
}

  /**
   * Metodo que permite consultar la cantidad de intentos realizados por un usuario en un ejercicio
   * @param params Objeto con la data necesaria para la consulta
   * @returns
   */
  public getNumberAttemptsEnded = async (params: IGetAttemptActive) => {

    let query = {
      user: params.user,
      academic_resource_config: params.academic_resource_config,
      'results.status': 'ended'
    }

    const numberAttemps = await AcademicResourceAttempt.findOne(query).countDocuments()
    return numberAttemps
  }
}

export const academicResourceDataAttemptService = new AcademicResourceDataAttemptService();
export { AcademicResourceDataAttemptService as DefaultDataAcademicContentAcademicResourceAcademicResourceDataAttemptService };
