// @import types
// @end

// @add your types

export interface IAcademicResourceConfigCategory {
  name: string,
  description: string,
  config?: any,
  id?: string
}

export interface IAcademicResourceConfigCategoryDelete {
  id: string
}

export interface IAcademicResourceConfigCategoryQuery {
  pageNumber?:string,
  nPerPage?:string,
  select?: string,
  search?:string,
  $or?:any,
}
//@end
