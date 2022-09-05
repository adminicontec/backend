// @import types
// @end

// @add your types
export interface IFileProcessResult{
  index?: number,
  teacher?: string     // Identificador del usuario en Campus Digital
  message?: string,
  status?: string
  details?: object
  sheetName?:string
}
//@end
