// @import_dependencies_node Import libraries
import * as path from "path";
// @end

// @import_utilities Import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { requestUtility } from '@scnode_core/utilities/requestUtility';
import { generalUtility } from '@scnode_core/utilities/generalUtility';
import { fileUtility } from "@scnode_core/utilities/fileUtility";
// @end

// @import_config_files Import config files
import { driver, connection_data, global_extension_files } from '@scnode_core/config/globals';
// @end

type OrmMigrationOptions = {
    revert?    : boolean;
    revert_all?: boolean;
    revert_to? : null | string;
    create?    : string;
    update?    : string;
    model?     : string;
}

type OrmBuildParams = {
  id?       : string | number,                                                // Identificador unico en Base de datos
  where?    : Object,                                                         // Objeto de filtros para la consulta
  fields?   : Object,                                                         // Campos para actualizar o insertar en base de datos
  select?   : Array<{key: string, function?: string, alias?: string}> | null, // Campos a seleccionar de una consulta
  relations?: Array<Object>,                                                  // Objeto que representa las relaciones en Base de datos
  options?  : Object,                                                         // Opciones de configuracion adicionales
  get_query?: boolean,                                                        // Boleano que indica si se retorna la query o los datos
  sort?     : Array<{field: string, direction: string}> | null,               // Objeto que representa el orden de consulta
  max?      : string,                                                         // Nombre del campo que se desea obtener
}

type OrmParameters = {
  model: any,
  parameters: Object
}

class OrmService {

  private orm = 'orm'; // ORM Name

  private config = {
    models_dir: 'app/models',
  }

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {
    const base_dir               = __dirname.split('core');
          this.config.models_dir = base_dir[0] + this.config.models_dir;
  }

  /**
   * Metodo que permite realiar una conexion a base de datos
   * @returns
   */
  public initConfigDb = async () => {

    let response    = false;
    const request_orm = this.getOrm('config-db');

    if (request_orm.status === 'success') {
      const utility_instance = request_orm['utility_instance'];
      const method_formated  = request_orm['method_formated'];

      response = await utility_instance[method_formated](connection_data);
    }

    return response;
  }

  /**
   * Metodo que permite encontrar un registro en base de datos
   * @param model Entidad de tipo modelo sobre el cual se realizara la acción del metodo
   * @param parameters Objeto de parametros con los cuales se procesara el metodo
   * @returns  Objeto de tipo JSON
   */
  public findOne = (model, parameters: OrmBuildParams) => {
    return this.launch('find-one',{model: model, parameters: parameters});
  }

  /**
   * Metodo que permite insertar uno o varios registros en base de datos
   * @param model Entidad de tipo modelo sobre el cual se realizara la acción del metodo
   * @param parameters Objeto de parametros con los cuales se procesara el metodo
   * @returns  Objeto de tipo JSON
   */
  public create = (model, parameters: OrmBuildParams) => {
    return this.launch('create',{model: model, parameters: parameters});
  }

  /**
   * Metodo que permite obtener la información de un conjunto de modelos
   * @param options Array de nombres de los modelos que se desean configurar
   * @returns
   */
  public getModelInfo =  ( model_names: Array<String> = [] ) => {
      const request_orm = this.getOrm('get-model-info');
      if (request_orm.status === 'error') return request_orm;

      const utility_instance = request_orm['utility_instance'];
      const method_formated  = request_orm['method_formated'];

      const response = utility_instance[method_formated](model_names);

      return response;
  }

  /**
   * Metodo que permite generar la estructura del archivo principal de modelos
   * @param dir_path Directorio sobre el cual se buscaran los modelos
   * @returns
   */
  public buildModels = async (dir_path) => {

      const models = await this.getModelsReference(dir_path);

      const request_orm = this.getOrm('generate-model-index-file');
      if (request_orm.status === 'error') return request_orm;

      const utility_instance = request_orm['utility_instance'];
      const method_formated  = request_orm['method_formated'];

      const response = await utility_instance[method_formated](models);

      return response;
  }

  /**
   * Metodo que encuentra los modelos del sistema y genera una referencia a ellos
   * @param dir_path Directorio sobre el cual se buscaran los modelos
   * @returns
   */
  public getModelsReference = (dir_path) => {

    const path_type = fileUtility.getTargetType(dir_path);

    let models = [];

    if (path_type) {
      if (path_type === fileUtility.TARGET_DIRECTORY) {
        const files = fileUtility.readDirSync(dir_path);
        if (files && files.length > 0) {
          files.map((file) => {
            const full_path = `${dir_path}/${file}`;

            const models_aux = this.getModelsReference(full_path);

            models_aux.map((model) => {
                const _model = { full_path: full_path };
                Object.assign(_model,model);
                models.push(_model);
            })
          })
        }
      } else if (path_type === fileUtility.TARGET_FILE) {
        const file = dir_path;

        if (file.search("Model") !== -1) {

          const model_path = file.replace(`${this.config.models_dir}/`,'');
          const model_path_split = model_path.split('/');

          let basename = path.basename(file);
          basename = basename.replace('.' + global_extension_files,'');

          let import_class_name = '';
          let import_path = '@scnode_app/models';
          let export_var = '';

          model_path_split.map((part) => {
            import_class_name += part.charAt(0).toUpperCase() + part.slice(1);

            if (part.search('Model') === -1) {
              import_path += `/${part}`;
            }
          });

          import_class_name = import_class_name.replace('.' + global_extension_files,'');
          import_path += `/${basename}`;

          export_var = import_class_name;
          export_var = export_var.replace('Model','');

          models.push({
            import_class_name: import_class_name,
            import_path      : import_path,
            export_var       : export_var
          });
        }
      }
    }

    return models;
  }

  /**
   * Metodo que permite instalar el complemento para lanzamiento de seeders
   * @returns
   */
  public installSeederPlugin = async () => {

      const request_orm = this.getOrm('install-seeder-plugin');
      if (request_orm.status === 'error') return request_orm;

      const utility_instance = request_orm['utility_instance'];
      const method_formated  = request_orm['method_formated'];

      const response = await utility_instance[method_formated]();

      return response;
  }

  /**
   * Metodo que permite obtener la utilidad de ORM segun la base de datos
   * @param method Nombre del metodo a ejecutar separado por el caracter (-)
   * @returns
   */
  private getOrm = (method: string) => {

    if (!driver) {
      return responseUtility.buildResponseFailed('json',null,{error_key: "database.driver_invalid"})
    }

    const engine = `orm-${driver}`;

    const utility_response = requestUtility.utilityInstance(engine,`${this.orm}/`); // Generando instancia de la utilidad
    if (utility_response.status === 'error') return utility_response;

    const utility_instance = utility_response['utility'];
    const method_formated  = generalUtility.upperCaseString(method, true);  // Formatear nombre del metodo a ejecutar

    if (typeof utility_instance[method_formated] === "undefined") {
      return responseUtility.buildResponseFailed('json',null,{error_key: "version_in_request_invalid"});
    }

    return responseUtility.buildResponseSuccess('json',null,{additional_parameters: {utility_instance: utility_instance, method_formated: method_formated}});
  }

  /**
   * Metodo que permite invocar (segun el motor de base de datos utilizado) la clase lanzada y el metodo que corresponde dentro de dicha clase
   * @param model Entidad de tipo modelo sobre el cual se realizara la acción del metodo
   * @param parameters Objeto de parametros con los cuales se procesara el metodo
   * @returns  Objeto de tipo JSON
   */
  private launch = async (method, parameters: OrmParameters) => {

    const orm = this.getOrm(method);
    if (orm.status === 'error') return orm;

    const utility_instance = orm['utility_instance'];
    const method_formated  = orm['method_formated'];

    const response = await utility_instance[method_formated](parameters.model,parameters.parameters);
    return response;
  }
}

export const ormService = new OrmService();
export { OrmService as DefaultOrmService, OrmMigrationOptions, OrmBuildParams };
