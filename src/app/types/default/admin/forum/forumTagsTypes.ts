// @import types
// @end

// @add your types
export interface IForumTag{
  name: string;
  _id: string;
}

export interface IParamsInsertOrUpdateForumTag{
  name: string;
  _id?: string;
}

export interface IParamsRemoveForumTag{
  _id: string;
}

export interface IForumTagQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
}
//@end
