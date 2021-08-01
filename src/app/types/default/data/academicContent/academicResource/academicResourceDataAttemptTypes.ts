// @import types
// @end

// @add your types
export interface IGetAttemptActive {
  user: string // Identificador de Usuario
  academic_resource_config: string // Identificador de la configuración de lanzamiento
  status?: Array<string> // Estados permitidos
}
//@end
