// @import types
// @end

// @add your types
export interface IMoodleEnrollment{
  roleid?: number,
  courseid: number,
  userid: number
}

export interface IMoodleUpdateEnrollment{
  roleid?: number,
  courseid: number,
  olduserid: number,
  newuserid: number,
}
//@end
