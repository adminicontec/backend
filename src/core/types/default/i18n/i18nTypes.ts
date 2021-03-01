// @import types
// @end

// @add your types
export interface IAddResourceBundle {
  lng       : string,
  resources : object,
  ns?       : string,
  deep?     : boolean,
  overwrite?: boolean,
}
//@end

