// @import types
// @end

// @add your types
interface CertificateSettingsModuleItem {
  status?: boolean,
  percentage?: number
}

export interface CertificateSettingsModules {
  courseSchedulingDetail: string,
  moodleMaster: string,
  exam?: CertificateSettingsModuleItem,
  attendance?: CertificateSettingsModuleItem,
  progress?: CertificateSettingsModuleItem,
}

interface CertificateSettingsMetadata {
  createdBy?: {
    username: string
    name: string,
  },
  lastUpdatedBy?: {
    username: string,
    name: string,
  },
}


export interface ICertificateSettings {
  id?: string,
  certificateName: string,
  courseScheduling: string,
  modules: CertificateSettingsModules[],
  metadata?: CertificateSettingsMetadata,
  user?: string
}
export interface ICertificateSettingsDelete {
  id: string
}
export interface ICertificateSettingsQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
  courseScheduling?: string
}
//@end
