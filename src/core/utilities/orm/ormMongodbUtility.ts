// @import_dependencies_node Import libraries
const fs = require('fs');
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { generalUtility } from "@scnode_core/utilities/generalUtility";
import { fileUtility } from "@scnode_core/utilities/fileUtility";
// @end

// @import_config_files Import config files
import { mongoose_global } from "@scnode_core/config/globals";
// @end

// @import_services Import services
// @end

// @import types
import {OrmBuildParams, MongoConnectionData, MongoQueryStructure, MongoCreateStructure} from "@scnode_core/types/default/orm/ormTypes"
// @end

// @import_models Import models
import * as SchemaModels from "@scnode_app/models" ;
// @end



class OrmMongodbUtility {

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
  public configDb = async (connection_data: MongoConnectionData) => {
    let connection = false;
    if (connection_data.hasOwnProperty('host') && connection_data.hasOwnProperty('dbname')) {
      try {
        let options: any = { useNewUrlParser: true, useUnifiedTopology: false, }
        if (connection_data.hasOwnProperty('cert')) {
            options.sslCA = fs.readFileSync(connection_data.cert);
        }
        //const mongoUrl = `mongodb://${connection_data['host']}/${connection_data['dbname']}${(connection_data.options) ? connection_data.options : ''}`;
        const mongoUrl = connection_data['uri'];
        mongoose_global.Promise = global.Promise;

        await mongoose_global.connect(mongoUrl, options);

        console.log(`Conexión a BD realizada correctamente`);

        await this.init();
        connection = true;
      } catch (error) {
        connection = false;
        console.log('Se ha presentado un error al conectar con la base de datos');
        console.log(error);
        process.exit(1);
      }
    }
    return connection;
  }

  /**
   * Metodo que permite iniciailizar el ORM
   * @returns
   */
  private init = async () => {
    return;
  }

  /**
   * Metodo que permite encontrar un registro en base de datos
   * @param model Entidad de tipo modelo sobre el cual se realizara la acción del metodo
   * @param parameters Objeto de parametros con los cuales se procesara el metodo
   * @returns  Objeto de tipo JSON
   */
  public findOne = async (model, parameters: OrmBuildParams) => {
    let params: MongoQueryStructure = {
      get_query : false,
      filters   : {},
      projection: null,
      options   : {},
      relations : null
    };

    // Construir parametros
    params = await this.addGetQuery(params,parameters);
    params = await this.addQueryWhere(params,parameters);
    params = await this.addQuerySelect(params,parameters);
    params = await this.addQueryOptions(params,parameters);
    params = await this.addQueryRelations(params,parameters);

    try {
      let query = model.findOne(params.filters,params.projection,params.options);
      query = await this.buildQueryRelations(query,params);

      if (params.get_query === true) return responseUtility.buildResponseSuccess('json',null,{additional_parameters: {query: query}});

      const object = await query;
      if (!object) return responseUtility.buildResponseFailed('json',null,{error_key: "database.orm.register_not_found"});

      const register = await this.transformData(params,object);
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
    let params: MongoCreateStructure = {
      doc: {}
    }

    // Construir parametros
    params = await this.addQueryFields(params,parameters);

    try {
      const query  = model.create(params.doc);
      const create = await query;
      // this.executePostSave(model, 'create', parameters, create);
      const register = await this.transformData(params,create);
      return responseUtility.buildResponseSuccess('json',null,{additional_parameters: {create: register}});
    } catch (err) {
      return responseUtility.buildResponseFailed('json',null,{error_key: "database.orm.failed_creation", additional_parameters: {error: err.message}});
    }
  }

  /**
   * Metodo que permite obtener la información de un conjunto de modelos
   * @param options Array de nombres de los modelos (en cammel case) que se desean configurar, si se envia vacío taerá la información de todos los modelos
   * @param exclude_invalid_fields Boleean dindica si se excluiran los campos descritos en el Schema dentro del metodo exclude_invalid_fields
   * @returns
   */
  public getModelInfo = ( model_names: Array<String> = [], exclude_invalid_fields = true) => {
    let models_data = {};
    let models : Array<Object> = [];

    if (model_names.length === 0){
      /*=================================================================
      =            Consultando todos los modelos del sistema            =
      =================================================================*/
      for (let _model in SchemaModels) {
        if (typeof SchemaModels[_model].schema !== "undefined"){
          models.push( _model );
        }
      }
      /*=====  End of Consultando todos los modelos del sistema  ======*/
    }else{
      for (let i = model_names.length - 1; i >= 0; i--) {
        models.push(generalUtility.upperCaseString(model_names[i].toString(),false));
      }
    }

    /*=======================================================================
    =            Consultando la información de todos los modelos            =
    =======================================================================*/
    for (let _model in SchemaModels) {
      if (typeof SchemaModels[_model].schema !== "undefined"){
        if (models.indexOf(_model) !== -1){
          let invalid_fields = [];
          if (exclude_invalid_fields){
            if (SchemaModels[_model].schema.methods.invalid_fields){
              invalid_fields = SchemaModels[_model].schema.methods.invalid_fields;
            }
          }

          let attr_data = {};
          for (let obj in SchemaModels[_model].schema.obj) {
            if (invalid_fields.indexOf(obj.toString()) === -1){
              attr_data[obj] = SchemaModels[_model].schema.path(obj).instance;
            }
          }
          models_data[_model] = attr_data;
        }
      }
    }
    /*=====  End of Consultando la información de todos los modelos  ======*/

    return responseUtility.buildResponseSuccess('json',null,{additional_parameters: {models_data: models_data}});
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
        for (var i in parameters['where']) {
          if(typeof i !== "undefined" && i == 'id'){
            parameters['where']['_id'] = parameters['where']['id'];
            delete parameters['where']['id'];
          }
          if(typeof parameters['where'][i] === 'object'){
            for (var j in parameters['where'][i]) {
              for (var k in parameters['where'][i][j]) {
                if(typeof k !== "undefined" && k == 'id'){
                  parameters['where'][i][j]['_id'] = parameters['where'][i][j]['id'];
                  delete parameters['where'][i][j]['id'];
                }
              }
            }
          }
        }
        Object.assign(params.filters,parameters['where']);
      }
      return params;
    }

    /**
     * Metodo que permite agregar a la estructura del objeto para opciones adicionales
     * @param params Parametros base de la ejecucion en base de datos
     * @param parameters Parametros proporcionados por el usuario destinados a ejecutar en base de datos
     * @returns
     */
    private addQueryOptions = (params, parameters: OrmBuildParams) => {
      if (parameters.hasOwnProperty('options') && typeof parameters['options'] === "object") {
        Object.assign(params.options,parameters['options']);
      }
      return params;
    }

    /**
     * Metodo que permite agregar a la estructura del objeto para almacenar el identificador de base de datos
     * @param params Parametros base de la ejecucion en base de datos
     * @param parameters Parametros proporcionados por el usuario destinados a ejecutar en base de datos
     * @returns
     */
    private addQueryId = (params, parameters: OrmBuildParams) => {
      if (parameters.hasOwnProperty('id') && (typeof parameters['id'] === 'string'  || typeof parameters['id'] === 'number' || typeof parameters['id'] === 'object')) {
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
        let select = "";
        for (const key in parameters['select']) {
          if (parameters['select'].hasOwnProperty(key)) {
            const element = parameters['select'][key];
            if (element.hasOwnProperty('key')) {
              let conector = "";
              if (select !== "") {
                  conector = " ";
              }
              select += conector + element['key'];
            }
          }
        }
        params.projection = select;
      }
      return params;
    }

    /**
     * Metodo que permite agregar a la estructura del objeto que almacena relaciones en Base de datos
     * @param params Parametros base de la ejecucion en base de datos
     * @param parameters Parametros proporcionados por el usuario destinados a ejecutar en base de datos
     * @returns
     */
    private addQueryRelations = (params, parameters: OrmBuildParams) => {
      if (parameters.hasOwnProperty('relations') && (typeof parameters['relations'] === "object")) {
        if (!params['relations']) params['relations'] = [];
        parameters['relations'].map((val) => {
          params['relations'].push({path: val['path'], ket_alias: val['alias']});
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
        let sort: any = {};
        sort[parameters['max']] = -1;
        params.max = parameters['max'];
        params.sort = sort;
      }
      return params;
    }

    /**
     * Metodo que permite agregar a la estructura del objeto el orden de consulta
     * @param params Parametros base de la ejecucion en base de datos
     * @param parameters Parametros proporcionados por el usuario destinados a ejecutar en base de datos
     * @returns
     */
    private addQuerySort = (params, parameters: OrmBuildParams) => {
      if (parameters.hasOwnProperty('sort') && typeof parameters['sort'] === "object") {
        let sort = {};
        for (const key in parameters['sort']) {
          if (parameters['sort'].hasOwnProperty(key)) {
            const element = parameters['sort'][key];
            if (element.hasOwnProperty('field') && element.hasOwnProperty('direction')) {
              sort[element['field']] = (element['direction'] === 'asc') ? 1 : 0;
            }
          }
        }
        params.sort = sort;
      }
      return params;
    }

    /**
     * Metodo que permite agregar a la estructura del objeto que almacena relaciones en Base de datos
     * @param query Objeto que representa la consulta a base de datos
     * @param params Parametros base de la ejecucion en base de datos
     * @returns
     */
    private buildQueryRelations = (query,params) => {
      if (params.relations) {
        for (const key in params.relations) {
          if (params.relations.hasOwnProperty(key)) {
            const element = params.relations[key];
            if (element.hasOwnProperty('path')) {
              query.populate({path: element['path']});
            }
          }
        }
      }
      return query;
    }

    /**
     * Metodo que permite agregar a la estructura del objeto los filtros de orden
     * @param query Objeto que representa la consulta a base de datos
     * @param params Parametros base de la ejecucion en base de datos
     * @returns
     */
    private buildQuerySort = (query,params) => {
      if (params.sort) {
        query.sort(params.sort);
      }
      return query;
    }

  /*======  END  =====*/

  /**
   * Metodo que permite transformar los registros retornados por una consulta y ajustarlos a los requisitos del sistema
   * @param params Parametros base de la ejecucion en base de datos
   * @param query_registers Registros obtenidos desde una consulta
   * @returns
   */
  private transformData = (params, query_registers) => {
    if (!Array.isArray(query_registers)) {
      const element = query_registers;
      let _values = {};
      Object.assign(_values,element['_doc']);
      if (_values.hasOwnProperty('_id')) {
        _values['id'] = _values['_id'];
      }
      if (params.hasOwnProperty('relations') && params['relations'] && typeof params['relations'] === 'object') {
        params['relations'].map((val) => {
          if (val.hasOwnProperty('ket_alias') && val.hasOwnProperty('path')) {
            if (typeof element[val['path']] !== 'undefined') {
              _values[val['ket_alias']] = element[val['path']];
            }
          }
        });
      }
      return _values;
    } else {
      let registers = [];
      for (const key in query_registers) {
        if (query_registers.hasOwnProperty(key)) {
          const element = query_registers[key];
          let values = {};
          Object.assign(values,element['_doc']);
          if (values.hasOwnProperty('_id')) {
            values['id'] = values['_id'];
          }
          if (params.hasOwnProperty('relations') && params['relations'] && typeof params['relations'] === 'object') {
            params['relations'].map((val) => {
              if (val.hasOwnProperty('ket_alias') && val.hasOwnProperty('path')) {
                if (typeof element[val['path']] !== 'undefined') {
                  values[val['ket_alias']] = element[val['path']];
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

export const ormMongodbUtility = new OrmMongodbUtility();
export { OrmMongodbUtility }
