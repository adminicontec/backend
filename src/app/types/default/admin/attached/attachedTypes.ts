// @import types
import { IAttachedCategory } from '@scnode_app/types/default/admin/attachedCategory/attachedCategoryTypes';
// @end

// @add your types
export interface IAttached{
  _id?: string;
  id?: string;
  category: string | IAttachedCategory;
  files: {
    url: string;
    uuid: string;
    unique?: string;
  }[];
  files_upload?: any[];
}

export interface IAttachedDelete {
  id: string // Identificador de la categoría
}

export interface IAttachedQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la colección a buscar
  search?:string, // Busca sobre los campos de la colección
}
//@end
