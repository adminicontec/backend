// @import types
// @end

// @add your types
export interface IFetchAcademicResourceData {
  user: string // Identificador del usuario
  survey?: string // Identificador de la encuesta
  academic_resource_config?: string // Identificador de un academicResourceConfig
}

export interface IModulesAvailableByConfig {
  academicResourceConfig: any // Objeto de clase AcademicResourceConfig con la configuración de lanzamiento del recurso
}

export interface IProcessAcademicResourceData {
  academicResourceConfig: any // Objeto de clase AcademicResourceConfig
  academicResource: any // Objeto de clase AcademicResource
  user: any // Objeto de clase User
}
//@end
