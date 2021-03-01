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
import {S3Credentials} from "@scnode_core/types/default/aws/s3AwsTypes"
// @end

class S3AwsService extends DefaultAwsAwsService {

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

    if (!aws_config.hasOwnProperty('S3')) return responseUtility.buildResponseFailed('json',null,{error_key: "aws.s3.config_invalid"});

    const aws_config_s3 = aws_config['S3'];

    const fields_in_config = [
      {key: "AWS_ACCESS_KEY"},
      {key: "AWS_SECRET_ACCESS_KEY"},
      {key: "REGION"},
      {key: "Bucket"}
    ];

    const aws_config_arr = this.buildAwsConfig(aws_config_s3);

    const validation = await this.findAwsConfig(aws_config_arr,fields_in_config,config_key);
    if (validation.status === "error") return validation;

    const config = validation['config'];

    const s3Client = new AWS.S3({
      accessKeyId    : config['AWS_ACCESS_KEY'],
      secretAccessKey: config['AWS_SECRET_ACCESS_KEY'],
      region         : config['REGION']
    });

    const uploadParams = {
      Bucket: config['Bucket'],
      Key   : '',                 // pass key
      Body  : null,               // pass file body
    };

    const s3 = {};
    s3['s3Client'] = s3Client;
    s3['uploadParams'] = uploadParams;

    return responseUtility.buildResponseSuccess('json',null,{additional_parameters: {s3: s3}});
  }
}

export const s3AwsService = new S3AwsService();
export { S3AwsService as DefaultAwsS3AwsService, S3Credentials };
