// @import types
// @end

// @add your types

export interface IDocumentQueueQuery {
  pageNumber?: string, // Numero de pagina
  nPerPage?: string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?: string, // Busca sobre los campos de la coleccion
  status?: string,
}

export interface IDocumentQueue {
  id?: string,
  userId?: string,
  docPath?: string,
  status: string,
  processLog?: any,
  errorLog?: any,
}

export interface IDocumentQueueDelete {
  id: string
}

//@end
