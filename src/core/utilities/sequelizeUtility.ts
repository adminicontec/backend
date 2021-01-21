// @import_dependencies_node Import libraries
// @end

// @import services
import { ormService } from "@scnode_core/services/default/orm/ormService";
// @end

// @import_config_files Import config files
import { global_extension_files, sequelize } from "@scnode_core/config/globals";
import { Sequelize } from "@scnode_core/config/globals";
// @end

// Libreria utilizada: Sequelize: http://docs.sequelizejs.com/

class SequelizeUtility {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite inicializar la configuración de base de datos para el ORM Sequelize
   * @param connection_data Array con parametros de configuración para la conexión
   * @param [dialect] Motor de base de datos
   * @returns
   */
  public sequelizeSetup = (connection_data, dialect: string = "mysql") => {

    connection_data["dialect"] = dialect;

    let _sequelize = null;

    if (dialect === 'sqlite') {
      _sequelize = new Sequelize(connection_data);
    } else if (connection_data.database) {
      _sequelize = new Sequelize(
        connection_data.database,
        connection_data.username,
        connection_data.password,
        connection_data,
      );
    }

    return _sequelize;
  }

  /**
   * Metodo que permite inicializar los modelos de Sequelize
   * @returns  Objeto de modelos inicializados
   */
  public models =  () => {

    let _models = {};
    let models_reference = [];

    if (sequelize) {

      const base_dir = __dirname.split('core');
      const models_dir = base_dir[0] + 'app/models';

      models_reference = ormService.getModelsReference(models_dir);

      models_reference.map((model_reference) => {
        let full_path = model_reference.full_path;
        full_path = full_path.replace('.' + global_extension_files,'');
        const model = require(full_path)(sequelize, Sequelize.DataTypes);
        _models[model_reference.export_var] = model;
      })

      Object.keys(_models).forEach(modelKey => {
        // Create model associations
        if ('associate' in _models[modelKey]) {
          _models[modelKey].associate(_models)
        }
      });
    }

    return _models;
  }
}

export const sequelizeUtility = new SequelizeUtility();
export { SequelizeUtility }
