// @import_dependencies_node Import libraries
// @end

// @import_utilities Import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { queryUtility } from '@scnode_core/utilities/queryUtility';
// @end

// @import_services Import services
// @end

// @import_config_files
// @end

// @import types
// @end


class SendPulseService {

  public api_url = "https://api.sendpulse.com"
  private token = null

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite generar el token de autenticación para el servicio SendPulse
   * @param credentials
   * @returns
   */
  public getToken = async (credentials) => {

    if (this.token) return this.token

    let tokenResponse = await queryUtility.query({
      method: 'post',
      url: '/oauth/access_token',
      api_link: this.api_url,
      params: {
        grant_type: 'client_credentials',
        client_id: credentials.cli_id,
        client_secret: credentials.secret_id,
      }
    });

    if (tokenResponse.status && tokenResponse.status === 'error') return responseUtility.buildResponseFailed('json')
    if (!tokenResponse.access_token) return responseUtility.buildResponseFailed('json')

    this.token = tokenResponse

    return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
      token: this.token
    }})
  }
}

export const sendPulseService = new SendPulseService();
export { SendPulseService };
