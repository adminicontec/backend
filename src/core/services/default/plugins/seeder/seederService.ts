// @import_dependencies_node Import libraries
// @end

// @import_models Import models
const Seeder = require('@scnode_app/models').Seeder;
import { orm } from "@scnode_core/config/globals";
// @end

// @import_utilities Import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import types
import {RunSeeder} from '@scnode_core/types/default/seeder/seederTypes'
// @end

class SeederService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite iniciar la ejecución de un seeder
   * @param seeder_class Nombre del seeder a ejecutar (Ex: demoSeeder)
   * @param [config] Configuraciones del seeder a ejecutar
   * @returns
   */
  public main = async (seeder_class:string, config: RunSeeder = {}) => {
    let process_seeder = false;

    if (config.hasOwnProperty('force') && typeof config['force'] === 'boolean' && config.force === true) {
      process_seeder = true;
    } else {
      const parameters = {
        where: { "seeder": seeder_class }
      }

      const response = await orm.findOne(Seeder,parameters);
      if (response['status'] === 'error') process_seeder = true;
    }

    if (process_seeder === true) {
      const seeder = await this.run();
      if (seeder === true) {
        await this.afterRunning(seeder_class);
        return responseUtility.buildResponseSuccess('json',null,{success_key: "database.seeder.executed_successfully"});
      } else {
        return responseUtility.buildResponseSuccess('json',null,{success_key: "database.seeder.executed_warning"});
      }
    } else {
      return responseUtility.buildResponseFailed('json',null,{error_key: "database.seeder.executed_previously"});
    }
  }

  /**
   * Metodo principal de ejecución. Se sobreescribe por cada seeder que lo ejecuta
   * @returns
   */
  public run = async () => {
    return true;
  }

  /**
   * Metodo que contiene las acciones que se ejecutan despues de lanzar un seeder
   * @param seeder_class Nombre del seeder ejecutado
   */
  private afterRunning = async (seeder_class) => {

    let parameters: any = {
      where: { "seeder": seeder_class }
    }
    const response = await orm.findOne(Seeder,parameters);

    if (response['status'] === 'error') {
      parameters = {
        fields: { seeder: seeder_class }
      }
      await orm.create(Seeder,parameters);
    }
  }
}

export const seederService = new SeederService();
export { SeederService as DefaultPluginsSeederSeederService };
