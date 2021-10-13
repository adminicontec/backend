// @import types
// @end

// @add your types
export interface IFileProcessResult{
  row?: number,    // Nro de registro a cargar
  status?: string, // status de carga
  messageProcess?: string,
  details?: object
}
//@end
