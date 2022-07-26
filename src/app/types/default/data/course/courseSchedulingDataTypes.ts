// @import types
// @end

// @add your types
export interface IFetchCourseSchedulingByProgram {
  moodle_id: string // Identificador de moodle
  user?: string // Identificador del usuario logueado
  only_user_logged?: boolean // Booleano que indica si se buscara solo la programación del usuario logueado
  sessionStartDate?: {
    date: 'today' | string
    direction: 'gt' | 'gte' | 'lt' | 'lte' | 'eq'
  } // Fecha de busqueda
}

export interface IFetchCourseSchedulingExtend {
  user?: string // Identificador del usuario logueado
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
  course_scheduling_code?: string // Busca por codigo
  schedulingType?: string // Busca por tipo de programación
  schedulingStatus?: string // Busca por estado de programación
  schedulingMode?: string // Busca por modalidad
  regional?: string // Busca por regional
  client?: string // Busca por cliente
  service_id?: string
  start_date?: string // Buscar por fecha de inicio
  end_date?: string // Buscar por fecha de fin
  modular?: string
  program_course_name?: string
  account_executive?: string // Buscar solo resultados de ese accountExecutive
  company?: string // Identificador de cliente
  contact?: string // Identificador del contacto de la empresa
}

export interface ParamsSchedulingConfirmedByMonth{
  months?: number;    // Numero de meses a filtrar (por defecto últimos 12)
}
//@end
