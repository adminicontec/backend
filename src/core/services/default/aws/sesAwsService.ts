// @import_dependencies_node Import libraries
import * as AWS from "aws-sdk";
// @end

// @import_utilities Import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import_services Import services
import { DefaultAwsAwsService } from "@scnode_core/services/default/aws/awsService";
// @end

// @import_config_files
import { aws_config } from "@scnode_core/config/globals";
// @end

// @import types
import {SESCredentials} from "@scnode_core/types/default/aws/sesAwsTypes"
// @end

class SesAwsService extends DefaultAwsAwsService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {
    super();
  }

  /**
   * Metodo que permite generar una instancia de Amazon S3 segun la configuración
   * @param config_key
   * @returns
   */
  public instance = async (config_key: string) => {

    if (!aws_config.hasOwnProperty('SES')) return responseUtility.buildResponseFailed('json',null,{error_key: "aws.ses.config_invalid"});

    const aws_config_ses = aws_config['SES'];

    const fields_in_config = [
      {key: "AWS_ACCESS_KEY"},
      {key: "AWS_SECRET_ACCESS_KEY"},
      {key: "REGION"}
    ];

    const aws_config_arr = this.buildAwsConfig(aws_config_ses);

    const validation = await this.findAwsConfig(aws_config_arr,fields_in_config, config_key);
    if (validation.status === "error") return validation;

    const config = validation['config'];

    const sesClient = new AWS.SES({
      accessKeyId    : config.AWS_ACCESS_KEY,
      secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
      region         : config.REGION,
    });

    return responseUtility.buildResponseSuccess('json',null,{additional_parameters: {ses: sesClient}});
  }
}

export const sesAwsService = new SesAwsService();
export { SesAwsService as DefaultAwsSesAwsService, SESCredentials };
