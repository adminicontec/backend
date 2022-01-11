// @import types
// @end

// @add your types
export interface ILike{
  user: any;
  forumMessage: any;
  _id: string;
}

export interface IParamsInsertOrUpdateLike{
  user: string;
  forumMessage: string;
  _id?: string;
}

export interface IParamsRemoveLike{
  _id: string;
}

export interface ILikeQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
}
//@end
