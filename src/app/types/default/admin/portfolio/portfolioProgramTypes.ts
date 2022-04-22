import { IDocumentQueue } from '@scnode_app/types/default/admin/document/documentTypes';
// @import types
// @end

// @add your types
export interface IPortfolioProgram{
  id?: string;
  _id?: string;
  name?: string;
  code?: string;
  modular?: string;
  courses?: {
    name: string;
    code: string;
  }[];
}

export interface IPortfolioProgramDelete {
  id: string
}

export interface IPortfolioProgramQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
  modular?: string
}

export interface IPortfolioProgramProcessFile{
  recordToProcess: IDocumentQueue;
  contentFile: {
    name: string;
    data: any;
  }
}
//@end
