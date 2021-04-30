// @import types
// @end

// @add your types
export interface IGoogleSheet {
  google_sheet_id: string // Identificador de google para la hoja de calculo
  credentials?: string // Cadena de texto que representa la llave dentro de env.json que contiene las credenciales para autenticación con Google
}
export interface IGoogleSheetLoad extends IGoogleSheet {}
//@end
