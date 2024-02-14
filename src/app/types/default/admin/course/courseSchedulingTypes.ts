import { TimeZone } from '@scnode_app/types/default/admin/user/userTypes';
import { ICourseSchedulingDetailsModification, TCourseSchedulingDetailsModificationFn } from '@scnode_app/types/default/admin/course/courseSchedulingDetailsTypes';
// @import types
// @end

// @add your types

export enum TypeCourse {
  MOOC = 'mooc',
  FREE = 'free'
}

export enum CourseSchedulingModification {
  SCHEDULING_OBSERVATIONS = 'observations',
  MODALITY = 'modality',
  ADDRESS = 'address',
}

export interface ICourseSchedulingModification {
  message: string;
  type?: CourseSchedulingModification;
}

export type TCourseSchedulingModificationFn = (timezone?: TimeZone) => Promise<ICourseSchedulingModification[]>

export interface ICourseSchedulingSession {
  startDate: string // Fecha de inicio
  duration: number // Duración
}

export interface ICourseSchedulingEmailDestination {
  email: string;
  timezone?: TimeZone;
}

export enum CourseSchedulingUpdateNotification {
  TEACHER = 'teacher',
  STUDENT = 'student',
}

export enum CourseSchedulingEventType {
  PROVISIONING_MOODLE_COURSES = 'courseScheduling:provisioning-moodle-courses'
}

export enum CourseSchedulingProvisioningMoodleStatus {
  IN_PROCESS = 'in-process',
  COMPLETED = 'completed',
  ERROR = 'error',
}

export interface ICourseSchedulingUpdatedNotificationParams {
  mailer: string;
  service_id: string;
  program_name: string;
  course_name?: string;
  notification_source: string;
  changesFn: TCourseSchedulingModificationFn | TCourseSchedulingDetailsModificationFn;
  changes?: ICourseSchedulingModification[] | ICourseSchedulingDetailsModification[];
  type: CourseSchedulingUpdateNotification;
  amount_notifications?: number;
}

export interface IProvisioningMoodleCoursesParams {
  steps: any[]
  paramsMoodle: any
  params: any
  response: any   // CourseScheduling that has been created/updated
  _id: string   // CourseScheduling ID created/updated
  prevSchedulingStatus: any
  shouldDuplicateSessions?: boolean
  originalScheduling?: any   // Only when use shouldDuplicateSessions, it will take the sessions to duplicate
  itemsToDuplicate?: ItemsToDuplicate[]
}

export interface ICourseSchedulingInsertOrUpdateOptions {
  shouldDuplicateSessions?: boolean
  originalScheduling?: any   // Only when use shouldDuplicateSessions, it will take the sessions to duplicate
  itemsToDuplicate?: ItemsToDuplicate[]
}

export interface ICourseScheduling {
  _id?: string;
  logReprograming?: {
    count?: number,
    log: {reason: string, date: any}[]
  }
  reprograming?: string
  disabledCreateMasterMoodle?: boolean
  moodle_id?: string
  metadata?: {
    user: string // Identificador del usuario que genera el registro
    date: string // Fecha del servicio
    service_id: string // Campo unico que identifica el servicio
    year: string // Año en que se genera el servicio
  }
  address?: string
  classroom?: string
  user?: string // Identificador del usuario logueado
  schedulingMode?: {value: number, label: string} | string // Identificador del modo de programación
  schedulingModeDetails?: 'in_situ' | 'online',
  modular?: string // Identificador del modular
  program?: {value: number, label: string} | string // Identificador del programa
  schedulingType?: string // Identificador del tipo de programación
  schedulingStatus?: string //Identificador del estado de programación
  confirmed_date?: Date | null;
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
  priceCOP?         : number,             // Precio en Pesos Colombianos
  priceUSD?         : number,             // Precio en Dólares Estadounidenses
  discount?         : number,             // Porcentaje de descuento del precio
  endPublicationDate?: any | null,
  endDiscountDate?: any | null,
  enrollmentDeadline?: any | null,
  id?: string // Identificador de la categoria
  certificate_icon_1?: string
  certificate_icon_2?: string
  signature_1?: string
  signature_2?: string
  signature_3?: string
  auditor_modules?: string | Array<string>
  cancelationTracking?: {
    date: string;
    personWhoCancels: string;
  }
  reactivateTracking?: {
    date: string;
    personWhoReactivates: string;
  },
  hasMultipleCertificate?: boolean | string;
  multipleCertificate?: {
    status: boolean,
    editingStatus?: boolean
  }
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
  company?: string
  schedulingAssociation?: string;
  teacher?: string;
  program?: string
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

export enum ReprogramingLabels {
  client = 'Solicitud del cliente',
  account_executive = 'Ejecutivo de cuenta',
  internal = 'Operaciones Icontec',
}

export enum ItemsToDuplicate {
  COURSE_SCHEDULING = 'course_scheduling',
  COURSE_SCHEDULING_DETAILS = 'course_scheduling_details',
  ENROLLMENT = 'enrollment'
}

export interface IDuplicateCourseScheduling {
  courseSchedulingId: string;
  itemsToDuplicate: ItemsToDuplicate[];
  user?: string
}

export interface IReactivateService {
  id: string;
  user: string;
}

export enum ForceStatus {
  PROGRAMMED = 'programmed',
  CONFIRMED = 'confirmed',
  EXECUTED = 'executed',
  CANCELLED = 'cancelled',
}

export interface IForceStatusService {
  id: string,
  user: string,
  status: ForceStatus
}

export interface IDuplicateService {
  id: string;
  user: string;
  itemsToDuplicate: ItemsToDuplicate[];
}

export interface IChangeSchedulingModular {
  modularOrigin: string;
  modularEnd: string;
  output: 'json' | 'db'
  courseSchedulings: string[]
}

export interface IChangeSchedulingElement {
  databaseElement: {
    query: any,
    update: any
  }
  output: 'json' | 'db'
  courseSchedulings: string[]
}

export interface IDownloadCalendar {
  service_id: string
}

export enum CourseSchedulingDetailsSync {
  SYNCHRONIZED = 'synchronized',
  PENDING = 'pending',
  DISABLED = 'disabled',
}

export enum ChangeTeacherStatusAction {
  REMOVE = 'remove',
  INSERT = 'insert',
}

export interface IChangeTeachersStatusFromCourseScheduling {
  courseSchedulingId: string
  action: ChangeTeacherStatusAction
}

export interface IProcessedTeacher {
  email: string
  _id: string
  moodle_id: string
}

export interface ISendEnrollmentUserParams {
  mailer: unknown
  first_name?: string
  course_name?: string
  username?: string
  service_id?: string
  course_start?: string
  course_end?: string
  notification_source: string
  type: string
  amount_notifications?: number
  observations?: string
  subject?: string
  courseType?: string
  teacher?: unknown
  program?: unknown
  service?: unknown
  courses?: unknown
  has_sessions?: unknown
}
//@end
