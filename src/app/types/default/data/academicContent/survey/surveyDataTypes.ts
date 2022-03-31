// @import types
// @end

// @add your types
export interface IGenerateSurveyReport {
  title?: string
  output_format?: 'xlsx' | 'json' // Formato de salida del reporte, por defecto es xlsx
  course_scheduling?: string
  course_scheduling_detail?: string
}

export interface IQuestionsRange {
  _id: string,
  title: string
  average: number,
  total_answers: number,
  answers: {
    total: number,
    list: Array<string>
  }
}

export interface ISectionQuestionsRange {
  _id: string
  title: string
  questions: Record<string, IQuestionsRange>
  average: number
}
export interface ISectionQuestionsOpen {
  _id: string
  title: string
  answers: string[]
}

export interface IAnswersChoiseSimple {
  unique: string,
  title: string,
  total_answers: number,
  average?: number,
}
export interface ISectionQuestionsChoiceSimple {
  _id: string
  title: string
  answers:  Record<string, IAnswersChoiseSimple>
  total_answers: number,
  average?: number,
}

export interface IReportSurvey {
  section_questions_range: ISectionQuestionsRange[]
  section_questions_open: Record<string, ISectionQuestionsOpen>
  section_questions_choice_simple: Record<string, ISectionQuestionsChoiceSimple>
}

export interface IGeneralReportSurvey {
  title: string;
  queryRange: {
    reportStartDate: string | undefined,
    reportEndDate: string | undefined
  },
  scheduling: any[]
  questionsRange: any[]
  questionsWithOptions: any
  totalSurvey: number,
  isVirtual: boolean
}
//@end
