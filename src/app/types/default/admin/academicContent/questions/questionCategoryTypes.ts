// @import types
// @end

// @add your types
export interface IQuestionCategoryFind {
  field: string,
  value: string,
}

export interface IQuestionCategory {
  name: string,
  description: string,
  config?: any,
  id?: string
}

export interface IQuestionCategoryDelete {
  id: string
}

export interface IQuestionCategoryQuery {
  pageNumber?:string,
  nPerPage?:string,
  select?: string,
  search?:string,
  $or?:any,
}
//@end
