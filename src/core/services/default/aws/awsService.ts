// @import_dependencies_node Import libraries
// @end

// @import_utilities Import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

class AwsService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Construye la estructura de configuración Amazon
   * @param aws_config Objeto de configuraciones Amazon
   * @returns
   */
  public buildAwsConfig = (aws_config: any) => {

    let aws_config_aux = [];

    for (const key in aws_config) {
      if (aws_config.hasOwnProperty(key)) {
        const element = aws_config[key];
        aws_config_aux.push(element);
      }
    }
    return aws_config_aux;
  }

  /**
   * Metodo que permite encontrar una configuración valida de Amazon a partir de una clave
   * @param aws_config Objeto de configuraciones Amazon
   * @param fields_in_config Variables que deben estar presentes en la configuración
   * @param config_key Clave de configuración
   * @returns
   */
  public findAwsConfig = async (aws_config: Array<any>, fields_in_config: any, config_key: string | null) => {

    let config: any = {};

    if (config_key && config_key !== "") {
      aws_config.map((values) => {
        if (values.key === config_key) {
          config = values;
        }
      })
    } else {
      if (aws_config.length > 0) {
        config = aws_config[0];
      }
    }

    const validation: any = await this.checkFieldsRequired(config, fields_in_config);
    if (validation.status === "error") return validation;

    return responseUtility.buildResponseSuccess('json',null,{additional_parameters: {config: config}});
  }

  /**
   * Metodo que verifica si los campos requeridos estan presentes en la configuración Amazon
   * @param fields_request Configuración
   * @param fields_config Variables que deben estar presentes en la configuración
   * @returns
   */
  private checkFieldsRequired = async (fields_request: any, fields_config: any) => {
    const validation = await requestUtility.validator(fields_request,{},fields_config);
    if (validation.hasError === true) return responseUtility.buildResponseFailed('json',null,{error_key: "aws.config_invalid"});
    return responseUtility.buildResponseSuccess('json',null);
  }

}

export const awsService = new AwsService();
export { AwsService as DefaultAwsAwsService };
