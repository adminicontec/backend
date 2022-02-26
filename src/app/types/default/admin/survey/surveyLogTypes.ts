// @import types
// @end

// @add your types
export interface ISaveSurveyLog{
  course_scheduling: string;
  course_scheduling_details?: string;
  endDate?: Date;
}

export interface IAddAttemptSurveyLog{
  surveyRelated: string;
  userId: string;
}
//@end
