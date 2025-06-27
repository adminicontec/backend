// @import types
import {Question} from '@scnode_app/models'
// @end

// @add your types
export interface IProcessQuestionsData {
  questions: Array<any> // Array de las preguntas
}

export interface IQuestionFind {
  field: string,
  value: string,
}

export interface IQuestionAnswer {
  unique?: string, // Identificador unico para las opciones de respuesta
  content?: string, // Contenido de la respuesta (descripción)
  feedback?: string, // Información con la retroalimentación de la respuesta
  value?: number, // Valor de la opción de respuesta. Utilizado al momento de calificar
  is_correct?: boolean // Representación de la respuesta con respecto a la pregunta
  config?: any // Objeto con la configuración segun cada tipo de pregunta/respuesta
  _id?: string
}

export interface IQuestion {
  content?: string, // COntenido de la pregunta (descripción)
  value?: number, // Valr de la pregunta. Utilizado al momento de calificar
  question_category?: string, // Categoria de la pregunta
  // level?: number, // Nivel que se asigna a la pregunta
  config?: any, // Configuración adicional de la pregunta, puede variar segun la categoria
  answers?: IQuestionAnswer[],  // Array con opciones de respuesta para la pregunta
  answer?: IQuestionAnswer, // Opcion de respuesta para la pregunta
  parent?: string, // Padre de la pregunta
  // tags?: Array<string> // Array de tags asignados a una pregunta
  // metadata?: IMetadataItem[], // Metadatos de la pregunta
  force?: boolean
  id?: string,
}

export interface IQuestionDelete {
  id: string
}

export interface IQuestionQuery {
  pageNumber?:string,
  nPerPage?:string,
  select?: string,
  search?:string,
  $or?:any,
}

export interface IQuestionOptions {
  question?: typeof Question | null,
  action: 'new' | 'update'
}

export interface IInstance {
  type: 'by_question' | 'by_category', // Formato para la generación de la instancia
  category?: any // Identificador de QuestionCategory | Objeto de clase QuestionCategory
  question?: any // Identificador de Question | Objeto de clase Question
}

//@end
