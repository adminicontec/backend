// @import types
// @end

// @add your types
export interface OrmMigrationOptions {
  revert?    : boolean;
  revert_all?: boolean;
  revert_to? : null | string;
  create?    : string;
  update?    : string;
  model?     : string;
}

export interface OrmBuildParams {
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

export interface OrmParameters {
  model: any,
  parameters: Object
}


export interface MongoConnectionData {
  host  : string,
  dbname: string,
  uri?: string
  cert?: string,
  options?: string
}

export interface MongoQueryStructure {
  get_query? : boolean,                // Retorna el objeto de consulta
  filters    : Object,                 // Filtros para generar la consulta
  projection?: string | null,          // Query.prototype.select()
  options?   : Object                  // Opciones adicionales
  relations? : string | Array<Object>  // Relaciones de base de datos
}

export interface MongoCreateStructure {
  get_query?: boolean,                  // Retorna el objeto de consulta
  doc       : Array<Object> | Object,   // Documentos a insertar, puede ser un objeto o y un array de objetos
}

export interface MysqlConnectionData {
  database: string,
  host    : string,
  username: string,
  password: string,
  port?   : string,
  dialect?: string,
}

export interface MysqlCreateStructure {
  get_query?: boolean,   // Retorna el objeto de consulta
  doc      : Object,    // Documentos a insertar, puede ser un objeto o y un array de objetos
}

export interface MysqlQueryStructure {
  get_query?: boolean,                // Retorna el objeto de consulta
  filters   : Object,                 // Filtros para generar la consulta
  relations?: string | Array<Object>  // Relaciones de base de datos
}
//@end
