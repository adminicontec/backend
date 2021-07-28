// @import types
// @end

// @add your types
export interface IAcademicResourceCategory {
  name: string,
  description: string,
  config?: any,
  id?: string
}

export interface IAcademicResourceCategoryDelete {
  id: string
}

export interface IAcademicResourceCategoryQuery {
  pageNumber?:string,
  nPerPage?:string,
  select?: string,
  search?:string,
  $or?:any,
}
//@end
