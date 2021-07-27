// @import types
// @end

// @add your types
export interface IAcademicResourceConfig {
  academic_resource?: string,
  source?: {
    config_category: string,
  }
  config?: any,
  id?: string,
}

export interface IAcademicResourceConfigDelete {
  id: string
}

export interface IAcademicResourceConfigQuery {
  pageNumber?:string,
  nPerPage?:string,
  select?: string,
  search?:string,
  $or?:any,
}
//@end
