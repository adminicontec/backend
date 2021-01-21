// @import_dependencies_node Import libraries
import { Op } from "sequelize";
import * as pluralize from "pluralize";
import * as moment from "moment";
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
// import { systemUtility } from "@scnode_core/utilities/systemUtility";
// import { fileUtility } from "@scnode_core/utilities/fileUtility";
// import { generalUtility } from "@scnode_core/utilities/generalUtility";
import { sequelizeUtility } from "@scnode_core/utilities/sequelizeUtility";
// @end

// @import_services Import services
import { OrmMigrationOptions, OrmBuildParams } from "@scnode_core/services/default/orm/ormService";
// import { installService as pluginsInstallService }  from "@scnode_core/services/default/plugins/installService";
// @end

// @import_config_files Import config files
import { sequelize } from "@scnode_core/config/globals";
// @end

type ConnectionData = {
    database: string,
    host    : string,
    username: string,
    password: string,
    port?   : string,
    dialect?: string,
}

type MysqlCreateStructure = {
  get_query?: boolean,   // Retorna el objeto de consulta
  doc      : Object,    // Documentos a insertar, puede ser un objeto o y un array de objetos
}

type MysqlQueryStructure = {
  get_query?: boolean,                // Retorna el objeto de consulta
  filters   : Object,                 // Filtros para generar la consulta
  relations?: string | Array<Object>  // Relaciones de base de datos
}

class OrmMysqlUtility {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite realiar una conexion a base de datos
   * @param connection_data
   * @returns
   */
  public configDb = async (connection_data: ConnectionData) => {

    if (
      connection_data.hasOwnProperty('database') &&
      connection_data.hasOwnProperty('host') &&
      connection_data.hasOwnProperty('username') &&
      connection_data.hasOwnProperty('password')
    ) {
      const dialect = "mysql";

      try {

        await sequelize.authenticate();

        console.log(`Conexión a BD ${dialect} realizada correctamente`);

        await this.init();

      } catch (err) {
        console.log('Se ha presentado un error al conectar con la base de datos');
        process.exit(1);
      }
    }
  }

  /**
   * Metodo que permite iniciailizar el ORM
   * @returns
   */
  private init = async () => {
    // await sequelizeUtility.models();
  }

  /**
   * Metodo que permite obtener la información de un conjunto de modelos
   * @param options Array de nombres de los modelos (en cammel case) que se desean configurar, si se envia vacío taerá la información de todos los modelos
   * @returns
   */
  public getModelInfo = ( model_names: Array<String> = []) => {
    // var models_data: Array<Object> = [];
    // return responseUtility.buildResponseSuccess('json',null,{additional_parameters: {models_data: models_data}});
  }

  /**
   * Metodo que permite encontrar un registro en base de datos
   * @param model Entidad de tipo modelo sobre el cual se realizara la acción del metodo
   * @param parameters Objeto de parametros con los cuales se procesara el metodo
   * @returns  Objeto de tipo JSON
   */
  public findOne = async (model, parameters: OrmBuildParams) => {

    let params: MysqlQueryStructure = {
      get_query : false,
      filters   : {
        limit: 1
      },
    };

    // Construir parametros
    params = await this.addGetQuery(params,parameters);
    params = await this.addQueryWhere(params,parameters);
    params = await this.addQuerySelect(params,parameters);
    params = await this.addQueryRelations(params,parameters);
    params = await this.addQuerySort(params,parameters)

    try {
      const query = model.findAll(params.filters);
      if (params.get_query === true) return responseUtility.buildResponseSuccess('json',null,{additional_parameters: {query: query}});

      var response = await query;
      if (!response || (response && response.length == 0)) return responseUtility.buildResponseFailed('json',null,{error_key: "database.orm.register_not_found"});

      var register = await this.transformData(params,response,true);
      return responseUtility.buildResponseSuccess('json',null,{additional_parameters: {register: register}})
    } catch (err) {
        return responseUtility.buildResponseFailed('json',null,{error_key: "database.orm.failed_query", additional_parameters: {error: err.message}});
    }
  }

  /**
   * Metodo que permite insertar uno o varios registros en base de datos
   * @param model Entidad de tipo modelo sobre el cual se realizara la acción del metodo
   * @param parameters Objeto de parametros con los cuales se procesara el metodo
   * @returns  Objeto de tipo JSON
   */
  public create = async (model, parameters: OrmBuildParams) => {
    var params: MysqlCreateStructure = {
        doc: {}
    }

    // Construir parametros
    params = await this.addQueryFields(params,parameters);

    try {
      var query = model.create(params.doc);
      var create = await query;
      // this.executePostSave(create, 'create', parameters);
      return responseUtility.buildResponseSuccess('json',null,{additional_parameters: {create: create}});
    } catch (err) {
      return responseUtility.buildResponseFailed('json',null,{error_key: "database.orm.failed_creation", additional_parameters: {error: err.message}});
    }
  }

  /*===============================================================
  =            Agregar elementos a la Query parametros            =
  ===============================================================*/

      /**
       * Metodo que permite agregar a la estructura de campos relacionados a la modificacion de datos en base de datos
       * @param params Parametros base de la ejecucion en base de datos
       * @param parameters Parametros proporcionados por el usuario destinados a ejecutar en base de datos
       * @returns
       */
      private addGetQuery = (params, parameters: OrmBuildParams) => {
        if (parameters.hasOwnProperty('get_query') && typeof parameters['get_query'] === 'boolean' && parameters['get_query'] === true) {
            params.get_query = true;
        }
        return params;
    }

    /**
     * Metodo que permite agregar a la estructura de campos relacionados a la modificacion de datos en base de datos
     * @param params Parametros base de la ejecucion en base de datos
     * @param parameters Parametros proporcionados por el usuario destinados a ejecutar en base de datos
     * @returns
     */
    private addQueryFields = (params, parameters: OrmBuildParams) => {
        if (parameters.hasOwnProperty('fields') && typeof parameters['fields'] === 'object') {
            Object.assign(params.doc,parameters['fields']);
        }
        return params;
    }

    /**
     * Metodo que permite agregar a la estructura del objeto para almacenar condiciones de busqueda
     * @param params Parametros base de la ejecucion en base de datos
     * @param parameters Parametros proporcionados por el usuario destinados a ejecutar en base de datos
     * @returns
     */
    private addQueryWhere = (params, parameters: OrmBuildParams) => {
        if (parameters.hasOwnProperty('where') && typeof parameters['where'] === 'object') {
            if (!params.filters.hasOwnProperty('where')) params.filters['where'] = {};
            Object.assign(params.filters['where'],parameters['where']);
        }

        params.filters['where'] = this.buildWhere(params.filters['where']);

        return params;
    }

    /**
     * Metodo que permite agregar a la estructura del objeto para almacenar condiciones de agrupación de  busqueda
     * @param params Parametros base de la ejecucion en base de datos
     * @param parameters Parametros proporcionados por el usuario destinados a ejecutar en base de datos
     * @returns
     */
    private addQueryGroup = (params, parameters: OrmBuildParams) => {
        if (parameters.hasOwnProperty('group') && typeof parameters['group'] === 'string') {
            if (!params.filters.hasOwnProperty('group')) params.filters['group'] = '';
            params.filters['group'] = parameters['group'];
        }
        return params;
    }

    /**
     * Metodo que construye la propiedad where de la consulta
     * @param [where] Objeto JSON
     * @returns
     */
    private buildWhere = (where = {}) => {
        for (const key in where) {
            if (where.hasOwnProperty(key)) {
                const element = where[key];
                if (element) {
                    if (key === '$or') { //
                        if (Array.isArray(element) === true) {
                            where[Op.or] = element
                            delete where["$or"];
                        }
                    } else if (element.hasOwnProperty('$in')) {
                        where[key] = element['$in'];
                    } else{
                        for (const k in where[key]){
                            let regexp =  RegExp(/\$/,'i');

                            if (k.match(regexp)){
                                let new_key = k.replace('$', '') ;
                                if ( Op.hasOwnProperty(new_key) ){
                                    where[key][Op[new_key]] = where[key][k];
                                    delete where[key][k];
                                }

                            }
                        }
                    }
                } else {
                    if (typeof element === 'undefined') {
                        delete where[key];
                    }
                }
            }
        }

        if (typeof where['_id'] !== "undefined"){
            where['id'] = where['_id'];
            delete where['_id'];
        }

        return where;
    }


    /**
     * Metodo que permite agregar a la estructura del objeto para almacenar el identificador de base de datos
     * @param params Parametros base de la ejecucion en base de datos
     * @param parameters Parametros proporcionados por el usuario destinados a ejecutar en base de datos
     * @returns
     */
    private addQueryId = (params, parameters: OrmBuildParams) => {
        if (parameters.hasOwnProperty('id') && (typeof parameters['id'] === 'string' || typeof parameters['id'] === 'number')) {
            params.id = parameters['id'];
        }
        return params;
    }

    /**
     * Metodo que permite agregar a la estructura del objeto para filtrar campos que son retornados
     * @param params Parametros base de la ejecucion en base de datos
     * @param parameters Parametros proporcionados por el usuario destinados a ejecutar en base de datos
     * @returns
     */
    private addQuerySelect = (params, parameters: OrmBuildParams) => {
        if (parameters.hasOwnProperty('select') && typeof parameters['select'] === "object") {
            if (!params.filters.hasOwnProperty('attributes')) params.filters['attributes'] = [];
            params.filters['attributes'] = this.buildSelect(parameters['select']);
        }
        return params;
    }

    /**
     * Metodo que construye la propiedad select
     * @param [select] Objeto JSON
     * @returns
     */
    private buildSelect = (select = []) => {

        let _buildSelect = [];
        for (const key in select) {
            if (select.hasOwnProperty(key)) {
                const element = select[key];

                if (element.hasOwnProperty('alias')) {
                    if (element.hasOwnProperty('key')) {
                        var _sub = [];
                        if (element.hasOwnProperty('function')){
                            _sub.push( sequelize.fn(element['function'], sequelize.col(element['key'])) );
                        }else{
                            _sub.push(element['key']);
                        }
                        _sub.push(element['alias']);
                        _buildSelect.push(_sub);
                    }
                } else {
                    if (element.hasOwnProperty('key')) {
                        if (element.hasOwnProperty('function')){
                            _buildSelect.push( sequelize.fn(element['function'], sequelize.col(element['key'])) );
                        }else{
                            _buildSelect.push(element['key']);
                        }
                    }
                }

            }
        }

        return _buildSelect;
    }

    /**
     * Metodo que permite agregar a la estructura del objeto que almacena relaciones en Base de datos
     * @param params Parametros base de la ejecucion en base de datos
     * @param parameters Parametros proporcionados por el usuario destinados a ejecutar en base de datos
     * @returns
     */
    private addQueryRelations = (params, parameters: OrmBuildParams) => {
        if (parameters.hasOwnProperty('relations') && typeof parameters['relations'] === "object") {
            if (!params.filters.hasOwnProperty('include')) params.filters['include'] = [];
            for (const key in parameters['relations']) {
                if (parameters['relations'].hasOwnProperty(key)) {
                    const element = parameters['relations'][key];
                    if (element.hasOwnProperty('model')) {
                        let item = {model: element['model'], ket_alias: element['alias']}
                        if (element.hasOwnProperty('select')) {
                            item['attributes'] = this.buildSelect(element['select']);
                        }
                        if (element.hasOwnProperty('model_name_alias')) {
                            item['model_name_alias'] = element['model_name_alias']
                        }

                        if (element.hasOwnProperty('where') && typeof element['where'] === 'object') {
                            let where = {};
                            Object.assign(where,element['where']);

                            item['where'] = this.buildWhere(where);
                        }

                        if (element.hasOwnProperty('relations') && typeof element['relations'] === 'object'){
                            item['include'] = this.addQueryRelations({ filters:{} }, { relations: element['relations']} );

                            item['include'] = item['include'].filters.include;
                        }

                        params.filters['include'].push(item);
                    }
                }
            }
        }
        return params;
    }

    /**
     * Metodo que permite agregar a la estructura del objeto que ordena la query
     * @param params Parametros base de la ejecucion en base de datos
     * @param parameters Parametros proporcionados por el usuario destinados a ejecutar en base de datos
     * @returns
     */
    private addQuerySort = (params, parameters: OrmBuildParams) => {

        if (parameters.hasOwnProperty('sort') && Array.isArray(parameters['sort'])) {
            if (!params.filters.hasOwnProperty('order')) params.filters['order'] = [];
            parameters['sort'].map((o) => {
                params.filters['order'].push([o.field,o.direction]);
            })
        }
        return params;
    }

    /**
     * Metodo que permite agregar a la estructura del objeto el orden de consulta
     * @param params Parametros base de la ejecucion en base de datos
     * @param parameters Parametros proporcionados por el usuario destinados a ejecutar en base de datos
     * @returns
     */
    private addQueryMax = (params, parameters: OrmBuildParams) => {
        if (parameters.hasOwnProperty('max') && typeof parameters['max'] === "string" && parameters['max'] != "") {
            params.max = parameters['max'];
        }
        return params;
    }

  /*======  END  =====*/

  /**
     * Metodo que permite transformar los registros retornados por una consulta y ajustarlos a los requisitos del sistema
     * @param params Parametros base de la ejecucion en base de datos
     * @param query_registers Registros obtenidos desde una consulta
     * @param only_one Boleano que identifica si solo se debe procesar el primer registro
     * @returns
     */
    private transformData = (params, query_registers, only_one: boolean = false) => {
      if (only_one === true) {
          if (query_registers.length === 0) return null;
          var element = query_registers[0];
          var values = element.dataValues;
          if (params.hasOwnProperty('filters') && params['filters'].hasOwnProperty('include') && typeof params['filters']['include'] === 'object') {
              params['filters']['include'].map((val) => {
                  if (val.hasOwnProperty('ket_alias') && val.hasOwnProperty('model')) {
                      let model_name = val['model'].name;
                      if (val.hasOwnProperty('model_name_alias')) {
                          model_name = val['model_name_alias'];
                      }
                      if (element.hasOwnProperty(model_name)) {
                          delete values[model_name]
                          if (typeof element[model_name].dataValues === 'undefined') {
                              values[val['ket_alias']] = element[model_name].map((_i) => {
                                  return _i.dataValues
                              });
                          } else {
                              values[val['ket_alias']] = element[model_name].dataValues;
                          }
                      }
                  }
              });
          }
          return values;
      } else {
          var registers = [];
          // console.log(query_registers)
          for (const key in query_registers) {
              if (query_registers.hasOwnProperty(key)) {
                  const element = query_registers[key];
                  var values = element.dataValues;
                  if (params.hasOwnProperty('filters') && params['filters'].hasOwnProperty('include') && typeof params['filters']['include'] === 'object') {
                      params['filters']['include'].map((val) => {
                          if (val.hasOwnProperty('ket_alias') && val.hasOwnProperty('model')) {
                              let model_name = val['model'].name;
                              if (val.hasOwnProperty('model_name_alias')) {
                                  model_name = val['model_name_alias'];
                              }
                              if (element.hasOwnProperty(model_name)) {
                                  delete values[model_name]
                                  if (typeof element[model_name].dataValues === 'undefined') {
                                      values[val['ket_alias']] = element[model_name].map((_i) => {
                                          return _i.dataValues
                                      });
                                  } else {
                                      values[val['ket_alias']] = element[model_name].dataValues;
                                  }
                              }
                          }
                      });
                  }
                  registers.push(values);
              }
          }
          return registers;
      }
  }
}

export const ormMysqlUtility = new OrmMysqlUtility();
export { OrmMysqlUtility }
