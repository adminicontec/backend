// @import types
// @end

// @add your types
export type TypeFormatsAttachedCategory = 'xlsx' | 'png' | 'jpg' | 'gif' | 'pdf' | 'ppt';

export interface IAttachedCategory{
  _id?: string;
  id?: string;
  name: string;
  description: string;
  config?: {
    unlimited?: boolean;
    limit_files?: number;
    formats?: TypeFormatsAttachedCategory[];
    limit_size_KB?: number;
  }
}

export interface IAttachedCategoryDelete {
  id: string // Identificador de la categoría
}

export interface IAttachedCategoryQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la colección a buscar
  search?:string, // Busca sobre los campos de la colección
}
//@end
