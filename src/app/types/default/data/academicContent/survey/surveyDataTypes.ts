// @import types
// @end

// @add your types
export interface IGenerateSurveyReport {
  title?: string
  user: string;
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

export interface IReportSurveyGeneralInfo {
  programName: string;
  programCode: string;
  startDate: string;
  endDate: string;
  teacher: string;
  courseName?: string;
  courseCode?: string;
  serviceId: string;
  modalityName: string;
  regional: string;
  city: string;
  companyName: string;
  accountExecutive: string;
  personWhoGeneratesReport: string;
  reportDate: string;
}

export interface IReportSurvey {
  generalInfo: IReportSurveyGeneralInfo
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

export interface IConsolidateSurveyQuestionRangeQuestionAnswer {
  totalPoints: number;
  list: string[]
}
export interface IConsolidateSurveyQuestionRangeQuestion {
  questionId: string;
  questionAverage: number;
  totalAnswers: number;
  answers: IConsolidateSurveyQuestionRangeQuestionAnswer
}
export interface IConsolidateSurveyQuestionRange {
  sectionId: string;
  averageSection: number;
  questions: IConsolidateSurveyQuestionRangeQuestion[]
}

export interface IConsolidateSurveyQuestionsWithOptionsAnswer {
  unique: string;
  totalAnswers: number;
  averageQuestion: number
}
export interface IConsolidateSurveyQuestionsWithOptions {
  questionId: string;
  answers: IConsolidateSurveyQuestionsWithOptionsAnswer[],
  totalAnswers: number
}
export interface IConsolidateSurvey {
  courseScheduling: string;
  courseSchedulingDetail?: string;
  isVirtual: boolean;
  totalSurvey: number;
  teacher: string;
  questionsRange: IConsolidateSurveyQuestionRange[],
  questionsRangeAverage: number;
  surveyPercentage: number;
  questionsWithOptions: IConsolidateSurveyQuestionsWithOptions[]
}

export interface IConsolidateSurveyIn {
  output_format?: 'db' | 'json'
}
//@end
