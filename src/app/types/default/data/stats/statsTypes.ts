// @import types
// @end

// @add your types
export interface IStatsScheduledHoursQuery {
  teacher?: string
  course_scheduling?: string // Identificador de la programación
}

export interface IStatsSurveysQuery {
  teacher?: string
  course_scheduling?: string // Identificador de la programación
  isVirtual: boolean
  year?: string
}
//@end
