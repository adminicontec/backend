// @import types
// @end

import { BooleanModel } from "aws-sdk/clients/gamelift";

// @add your types

export interface IDocumentQueueQuery {
  pageNumber?: string, // Numero de pagina
  nPerPage?: string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?: string, // Busca sobre los campos de la coleccion
  status?: string,
  id?: string
  sort?: {
    field: string,
    direction: string
  },
  document_type?: string
}

export interface IDocumentQueue {
  id?: string,
  userId?: string,
  docPath?: string,
  status: string,
  type?: string,
  sendEmail?: boolean,
  processLog?: any,
  errorLog?: any,
  processLogTutor?: any,
  errorLogTutor?: any,
}

export interface IDocumentQueueDelete {
  id: string
}

//@end
