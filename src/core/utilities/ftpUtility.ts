
// @import_dependencies_node Import libraries
const ftp = require("basic-ftp")
// @end

// @import_utilities
import { requestUtility } from "@scnode_core/utilities/requestUtility";
import { responseUtility } from "@scnode_core/utilities/responseUtility";
// @end

// @import_config_files
import { ftp_config } from "@scnode_core/config/globals";
// @end

import {FtpConfig, FtpStructureConfig} from '@scnode_core/types/default/ftp/ftpTypes'

// @INFO - Plugin utilizado https://www.npmjs.com/package/basic-ftp
// @INFO - Especificación completa https://github.com/patrickjuchli/basic-ftp#readme

class FtpUtility {

  private client = null;

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite validar y generar una instancia del cliente FTP
   * @param credential Credencial que contiene la configuración de conexión a FTP
   * @returns
   */
  private instance = async (credential: string = "") => {
    if (!ftp_config.hasOwnProperty('connections')) return responseUtility.buildResponseFailed('json',null,{error_key: "ftp.config_invalid"});

    const connections = ftp_config['connections'];

    const fields_in_config = [
      {key: "base_path"},
      {key: "server_url"},
      {key: "connection"}
    ];

    // @INFO: Extrae solo las conexiones que tengan una llave
    let ftp_config_arr = [];
    for (const key in connections) {
      if (connections.hasOwnProperty(key)) {
        const element = connections[key];
        ftp_config_arr.push(element);
      }
    }

    // @INFO: Obtiene los datos de conexión
    const validation = await this.findFtpConfig(ftp_config_arr,fields_in_config,credential);
    if (validation.status === "error") return validation;

    let config = validation['config'];

    // @INFO: Inicia proceso de conexión FTP
    const response_connection = await this.connect(config['connection']); // Ftp connect
    if (response_connection.status === 'error') return response_connection;

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        connection: config
      }
    });
  }

  /**
   * Metodo que permite encontrar una configuración valida de FTP a partir de una clave
   * @param connections Objeto de configuraciones FTP
   * @param fields_in_config Variables que deben estar presentes en la configuración
   * @param config_key Clave de configuración
   * @returns
   */
  private findFtpConfig = async (connections: Array<any>, fields_in_config: any, config_key: string | null) => {
    let config: any = {};

    if (config_key && config_key !== "") {
      connections.map((values) => {
        if (values.key === config_key) {
          config = values;
        }
      })
    } else {
      if (connections.length > 0) {
        config = connections[0];
      }
    }

    const validation: any = await this.checkFieldsRequired(config, fields_in_config);
    if (validation.status === "error") return validation;

    return responseUtility.buildResponseSuccess('json',null,{additional_parameters: {config: config}});
  }

  /**
   * Metodo que verifica si los campos requeridos estan presentes en la configuración FTP
   * @param fields_request Configuración
   * @param fields_config Variables que deben estar presentes en la configuración
   * @returns
   */
  private checkFieldsRequired = async (fields_request: any, fields_config: any) => {
    const validation = await requestUtility.validator(fields_request,{},fields_config);
    if (validation.hasError === true) return responseUtility.buildResponseFailed('json',null,{error_key: "ftp.config_invalid"});

    return responseUtility.buildResponseSuccess('json',null);
  }

  /**
   * Metodo que permite iniciar conexión entre el cliente y el servidor FTP
   * @param ftp_config Configuración necesaria para iniciar la conexión entre cliente y servidor
   * @returns
   */
  private connect = async (ftp_config: FtpConfig) => {
    this.client = new ftp.Client(0)
    this.client.ftp.verbose = (ftp_config.debug) ? true : false; // Esta linea muestra por consola el Log del FTP
    try {
      await this.client.access(ftp_config)
      return responseUtility.buildResponseSuccess('json', null);
    }
    catch(err) {
      return responseUtility.buildResponseFailed('json', null, {
        additional_parameters: {
          reason: err
        }
      });
    }
  }

  /**
   * Finaliza la conexión entre el cliente y el servidor FTP
   */
  private disconnect = () => {
    if (this.client) {
      this.client.close();
      this.client = null;
    }
  }

  /**
   * Metodo que permite cargar un archivo desde el cliente al servidor FTP. Si el archivo ya existe será sobreescrito
   * @param upload_config Configuración donde se indica información del archivo a cargar
   * @param credential Credencial que contiene la configuración de conexión a FTP
   * @returns
   */
  public uploadFrom = async (upload_config: FtpStructureConfig, credential: string = "") => {

    // @INFO: Genera instancia de conexión FTP
    const instance = await this.instance(credential);
    if (instance.status === 'error') return instance;

    const connection = instance['connection'];
    let config = {};
    Object.assign(config,connection);
    Object.assign(config,upload_config);

    let path_remote = `${config['server_url']}/`;

    try {
      if (config.hasOwnProperty('base_path') && config['base_path'] !== "") {
        await this.client.cd(config['base_path']); // Posicionarse en una ubicación especifica dentro del servidor FTP
      }

      if (config.hasOwnProperty('file_dir_path') && config['file_dir_path'] !== "") {
        await this.client.ensureDir(config['file_dir_path']); // Verificar si existen los directorios necesarios para almacenar el archivo
        path_remote += `${config['file_dir_path']}`;
      }

      await this.client.uploadFrom(
        config['file_information']['local_path'], // Ubicación local del archivo a subir
        config['file_information']['remote_file_name'] // Nombre que se asignara en el servidor FTP
      );

      path_remote += `${config['file_information']['remote_file_name']}`;

    } catch (e) {

      this.disconnect();

      return responseUtility.buildResponseFailed('json', null, {
        additional_parameters: {
          reason: e
        }
      })
    }

    this.disconnect();

    return responseUtility.buildResponseSuccess('json',null,{additional_parameters: {
      path     : path_remote,
      file_name: config['file_information']['remote_file_name'],
    }});
  }
}

export const ftpUtility = new FtpUtility();
export { FtpUtility, FtpStructureConfig }
