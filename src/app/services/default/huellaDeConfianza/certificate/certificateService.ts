// @import_dependencies_node Import libraries
// @end

// @import services
import { userService } from '@scnode_app/services/default/admin/user/userService';
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { certificate_setup } from '@scnode_core/config/globals';
import { queryUtility } from '@scnode_core/utilities/queryUtility';
// @end

// @import models
// @end

// @import types
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes'
import { IQueryUserToCertificate, ICertificate, IQueryCertificate } from '@scnode_app/types/default/admin/certificate/certificateTypes';
import { generalUtility } from '@scnode_core/utilities/generalUtility';
import { UserType } from 'aws-sdk/clients/workdocs';
// @end

class CertificateService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor() { }

  public alltemplates = async (params: IQueryCertificate) => {

    try {

      let respToken: any = await this.login();

      if (respToken.status == 'error') {
        return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'certificate.login_invalid' } })
      }


      console.log("Token: ");
      var tokenHC = respToken.token;

      // Build request for GetAllTemplate
      let respHuella: any = await queryUtility.query({
        method: 'get',
        url: certificate_setup.endpoint.get_templates,
        api: 'huellaDeConfianza',
        headers: { Authorization: tokenHC }
      });

      if (respHuella.estado == 'Error') {
        console.log(respHuella);
        return responseUtility.buildResponseFailed('json', null,
          {
            error_key: { key: 'certificate.generation' }
          })
      }

      // Get All templates
      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          tokenHC: tokenHC,
          template: respHuella.resultado
        }
      });

    }

    catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }


  public setCertificate = async (params: IQueryUserToCertificate) => {

    try {

      let certificateConsecutive = params.consecutive;
      console.log("Certifcate for username: " + params.username);

      //#region  querying data for user to Certificate, param: username
      let respDataUser: any = await userService.findBy({
        query: QueryValues.ONE,
        where: [{ field: 'profile.doc_number', value: params.username }]
      })

      // usuario no existe
      if (respDataUser.status === "error") return respDataUser

      // return responseUtility.buildResponseSuccess('json', null, {
      //   additional_parameters: {
      //     tokenHC: tokenHC,
      //     userData: respDataUser
      //   }
      // });
      //#endregion

      //#region Build the certificate Parameters
      const timeElapsed = Date.now();
      const currentDate = new Date(timeElapsed);

      let certificateParams: ICertificate = {
        modulo: params.module,
        numero_certificado: certificateConsecutive.toString(),
        correo: respDataUser.user.email,
        documento: respDataUser.user.profile.doc_type + " " + respDataUser.user.profile.doc_number,
        nombre: respDataUser.user.profile.first_name + " " + respDataUser.user.profile.last_name,
        asistio: 'SI',
        certificado: 'DIPLOMADO EN GESTIÓN DE CALIDAD BAJO LA NTC ISO 9001:2015',
        certificado_ingles: '',
        alcance: '',
        alcance_ingles: '',
        intensidad: '',
        listado_cursos: '',
        ciudad: 'Bogotá',
        pais: 'Colombia',
        fecha_certificado: new Date(2021, 11, 12),
        fecha_aprobacion: new Date(2021, 10, 30),
        fecha_ultima_modificacion: null,
        fecha_renovacion: null,
        fecha_vencimiento: null,
        fecha_impresion: currentDate
      }
      //#endregion
      console.log("Certificate Params");
      console.log(certificateParams);

      //#region Request to Create Certificate

      let respToken: any = await this.login();

      if (respToken.status == 'error') {
        return responseUtility.buildResponseFailed('json', null,
          { error_key: { key: 'certificate.login_invalid' } })
      }

      console.log("Token: ");
      var tokenHC = respToken.token;

      // Build request for Create Certificate
      let respHuella: any = await queryUtility.query({
        method: 'post',
        url: certificate_setup.endpoint.create_certificate,
        api: 'huellaDeConfianza',
        headers: { Authorization: tokenHC },
        params: JSON.stringify(certificateParams)
      });

      if (respHuella.estado == 'Error') {

        console.log(respHuella);
        return responseUtility.buildResponseFailed('json', null,
          {
            error_key: { key: 'certificate.generation', params: {error: respHuella.resultado}}
          })
      }
      //#endregion
      // certificateConsecutive++;

      // Get All templates
      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          tokenHC: tokenHC,
          certificate: respHuella.resultado
        }
      });

    }

    catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }


  private login = async () => {

    var endpoint = certificate_setup.endpoint.signin;
    console.log("get Token from Huella de Confianza...");

    let respHuella = await queryUtility.query({
      method: 'post',
      url: certificate_setup.endpoint.signin,
      api: 'huellaDeConfianza',
      params: JSON.stringify(certificate_setup.credentials)
    });

    // console.log(respHuella);

    if (respHuella.estado == "Error") {
      return responseUtility.buildResponseFailed('json', null,
        {
          error_key: { key: 'certificate.login_invalid', params: { name: respHuella.result } }
        })
    }

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        token: respHuella.result.accessToken
      }
    });

  }

}

export const certificateService = new CertificateService();
export { CertificateService as DefaultHuellaDeConfianzaCertificateCertificateService };
