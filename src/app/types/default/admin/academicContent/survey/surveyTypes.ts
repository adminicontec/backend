// @import types
// @end

// @add your types
export interface ISurvey {
  name?: string,
  description?: string,
  config?: any,
  status?: string,
  id?: string,
}

export interface ISurveyGhost {
  academic_resource_category?: string, // Identificador de AcademicResourceCategory. Representa el tipo de recurso que se desea crear
}

export interface ISurveyDelete {
  id: string
}

export interface ISurveyQuery {
  pageNumber?:string,
  nPerPage?:string,
  select?: string,
  search?:string,
  $or?:any,
}
//@end
