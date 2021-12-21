// @import types
// @end

// @add your types
export interface ICourseSchedulingSession {
  startDate: string // Fecha de inicio
  duration: number // Duración
}

export interface ICourseScheduling {
  disabledCreateMasterMoodle?: boolean
  metadata?: {
    user: string // Identificador del usuario que genera el registro
    date: string // Fecha del servicio
    service_id: string // Campo unico que identifica el servicio
    year: string // Año en que se genera el servicio
  }
  user: string // Identificador del usuario logueado
  schedulingMode: {value: number, label: string} | string // Identificador del modo de programación
  schedulingModeDetails: 'in_situ' | 'online',
  modular: string // Identificador del modular
  program: {value: number, label: string} | string // Identificador del programa
  schedulingType: string // Identificador del tipo de programación
  schedulingStatus: string //Identificador del estado de programación
  startDate?: string // Fecha de inicio de la programación
  endDate?: any  // Fecha de finalización de la programación
  regional?: string // Regional de la programación
  regional_transversal?: string // Regional de la programación
  city?: string // Identificador de la ciudad
  country?: string
  amountParticipants?: string // Cantidad de participantes
  observations?: string // Observaciones
  client?: string // Cliente
  duration?: number // Duración del programa
  in_design?: boolean | string // Booleano que indica si esta en diseño o no
  sendEmail?: boolean | 'true' | 'false' // Booleano que indica si se debe enviar email de notificación
  // schedulingCode: string // Codigo de programación
  // course?: string // Curso de la programación
  // teacher?: string // Docente de la programación
  // sessions?: Array<ICourseSchedulingSession> // Array de sesiones de clase
  hasCost?         : boolean | string,   // Indica si el curso es de pago o no
  priceCOP         : number,             // Precio en Pesos Colombianos
  priceUSD         : number,             // Precio en Dólares Estadounidenses
  discount         : number,             // Porcentaje de descuento del precio
  endDiscountDate?: string | null
  id?: string // Identificador de la categoria
  certificate_icon_1?: string
  certificate_icon_2?: string
  certificate_icon_3?: string
}

export interface ICourseSchedulingDelete {
  id: string // Identificador de la programación
}

export interface ICourseSchedulingQuery {
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
}

export interface ICourseSchedulingReport {
  course_scheduling?: string // Identificador del programa
  type: 'single' | 'multiple'
  format: 'xlsx' | 'pdf'
}

export interface ICourseSchedulingReportData {
  courses: Array<any>,
  total_scheduling: number
  scheduling_free: number
}
//@end
