// @import types
// @end

// @add your types
export interface ICheckSurveyAvailable {
  user: string // Identificador del usuario
  moodle_id: string // Identificador del curso de moodle
}

export interface ICheckCharacterizationSurveyAvailable {
  user: string
}

export interface IGetAvailableSurveysParams {
  user: string
  moodle_id: string
  schedulingId?: string
}
//@end
