// @import_dependencies_node Import libraries
// @end

// @import_models Import models
// @end

// @import_utilities Import utilities
import {fileUtility} from '@scnode_core/utilities/fileUtility'
import {consoleUtility} from '@scnode_core/utilities/consoleUtility'
// @end

// @import types
import {RunSeeder} from '@scnode_core/types/default/seeder/seederTypes'
// @end

class RunSeederService {

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
  public init = async (params: RunSeeder) => {
    try {
      const path_app = '/src/seeders'
      const item_directory = `${process.cwd()}${path_app}` // Directorio donde se alojara el elemento

      let executed = 0;
      const files = fileUtility.readDirSync(item_directory);

      if (files && files.length > 0) {

        for await (const i of files) {
          const file = i;

          if (file.search("Seeder") !== -1) {
            const file_parts = file.split('_');
            if (file_parts[1]) {
              let file_name = file_parts[1];
              file_name = file_name.replace(/\.ts|\.js$/,'');
              if (!params.class || (params.class && params.class === file_name)) {
                const seeder_class = file_name.charAt(0).toUpperCase() + file_name.slice(1);
                const seeder = require(`${item_directory}/${file}`)[file_name];
                const response_seeder = await seeder.main(seeder_class,params);
                if (response_seeder['status'] === 'success') {
                  executed++;
                  console.log('------------------------------------------------------');
                  consoleUtility.showSuccessConsole(`Seeder ${file_name}: ${response_seeder['message']}`);
                  console.log('------------------------------------------------------');
                } else {
                  console.log('------------------------------------------------------');
                  consoleUtility.showErrorConsole(`Seeder ${file_name}: ${response_seeder['message']}`);
                  console.log('------------------------------------------------------');
                }
              }
            }
          }
        }
      }

      if (executed === 0) {
        console.log('------------------------------------------------------');
        consoleUtility.showSuccessConsole(`No hay seeders para lanzar`);
        console.log('------------------------------------------------------');
      }
      process.exit(0);
    } catch(e) {
      process.exit(1)
    }
  }
}

export const runSeederService = new RunSeederService();
export { RunSeederService as DefaultPluginsSeederRunSeederService };
