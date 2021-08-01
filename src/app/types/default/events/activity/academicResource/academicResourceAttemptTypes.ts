// @import types
// @end

// @add your types
export interface IAcademicResourceAttempResultsAnswers {
  question: string, // Identificador de la pregunta
  answer: any // Respuesta asignada
  status?: 'correct' | 'incorrect' | 'not_answered', // Estado que representa si el usuario respondio correctamente o no a la pregunta
  evaluation_date?: string // Fecha en la que se evaluo la pregunta
  answer_label?: string // String que contiene el texto de la respuesta que selecciono el usuario
  answers_corrected?: Array<string> // Array con la información de las respuestas contestadas correctamente
}

export interface IAcademicResourceAttempResults {
  status?: 'started' | 'ended' | 'loop' // Estado del intento
  questionsToEvaluate?: Array<string> // Array de preguntas que seran evaluadas, es decir, las preguntas que se le genereraron y presentaron al usuario
  questionsByConfiguration?: any // Objeto con información de las preguntas
  score?: string | number, // Representa la calificación que se asigno al usuario tras finalizar el ejercicio segun las preguntas que tuvo correctas
  scoreByAnswers?: string | number, // Representa la calificación que se asigno al usuario tras finalizar el ejercicio segun las respuestas que tuvo correctas
  score_date?: string, // Representa la fecha en la que se genero la calificación
  time_taken?: number, // Representa el tiempo que le tomo al usuario finalizar el ejercicio
  statistics?: IAcademicResourceAttempResultsAnswers[], // Array con los datos de las preguntas que el usuario respondio
  answer?: IAcademicResourceAttempResultsAnswers // Datos de la pregunta respondida
  deliverable?: any // Datos de entrega de tarea (EditorJS)
  deliverable_date?: string // Fecha en la cual se subió una entrega de tarea
  qualification?: {
    status: 'pending' | 'qualified'
    date: Date | string
    score: string
  }
  files?: {
    name: string
    filename: string
  }[]
}

export interface IAcademicResourceAttempt {
  user: string, // Identificador del usuario
  academic_resource_config: string, // Identificador de la configuración
  results?: IAcademicResourceAttempResults // Objeto que contiene toda la información relacionada a los resultados del intento
  qualify?: boolean // Booleano que indica si se debe calificar o no el recurso
  force?: boolean // Booleano que indica si se forzara sin importar ninguna validación
}

export interface IEnableAcademicResourceAttempt{
  state: boolean    // Estado del attempt
  id: string        // Identificador del attempt
}
//@end
