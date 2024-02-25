// @import types
// @end

// @add your types
export interface ICustomLog {
  _id?: string
  label: string
  content: unknown
  userId?: string
  description?: string
  schedulingMoodleId?: string
}

export interface ICustomLogListParams {
  label?: string
  content?: object
  userID?: string
  description?: string
  schedulingMoodleId?: string
  limit?: number
  sort?: unknown
}
//@end
