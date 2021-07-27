// @import types
import {AcademicResource} from '@scnode_app/models'
// @end

// @add your types
export interface IAcademicResources {
  types: 'survey'
}

export interface IAcademicResource {
  title?: string, // Titulo que representara el recurso en el sistema
  description?: string, // Descripción detallada del recurso
  academic_resource_category?: string, // Categoria del recurso
  config?: any, // Configuración adicional del recurso, puede variar segun el tipo de recurso
  // metadata?: IMetadataItem[], // Metadatos del recurso
  // tags?: Array<string> // Array de tags asignados a una pregunta
  attached?: any // Documento adjunto
  id?: string,
}

export interface IAcademicResourceDelete {
  id: string
}

export interface IAcademicResourceQuery {
  pageNumber?:string,
  nPerPage?:string,
  select?: string,
  search?:string,
  $or?:any,
}

export interface IAcademicResourceOptions {
  resource?: typeof AcademicResource | null,
  action: 'new' | 'update'
}

export interface IAcademicResourceQuestions {
  question: string, // Identificador de Question
  position: number // Posición de la pregunta con respecto a las demas
}

export interface IInstance {
  type: 'by_resource' | 'by_category', // Formato para la generación de la instancia
  category?: any // Identificador de AcademicResourceCategory | Objeto de clase AcademicResourceCategory
  resource?: any // Identificador de AcademicResource | Objeto de clase AcademicResource
}
//@end
