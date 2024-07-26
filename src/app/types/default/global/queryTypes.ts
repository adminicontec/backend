// @import types
// @end

// @add your types
export interface IQueryFind {
  query: QueryValues.ALL | QueryValues.ONE // Tipo de consulta
  where: IQueryWhereFind[] // Parametros de la consulta
  sort?: {
    field: string,
    direction: string
  },
}

interface IQueryWhereFind {
  field: string, // Campo en BD que se desea buscar
  value: Record<string, any> | string, // Valor en BD que se desea buscar
}

export enum QueryValues {
  ONE = 'one',
  ALL = 'all',
}
//@end

