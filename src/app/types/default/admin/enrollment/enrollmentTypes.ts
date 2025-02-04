import { TimeZone } from '@scnode_app/types/default/admin/user/userTypes';
// @import types
// @end

// @add your types
export enum EnrollmentOrigin {
  AUTOREGISTRO='autoregistro'
}

export enum EnrollmentStatus {
  REGISTERED = 'registered',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  CERTIFIED = 'certified',
}

export interface IAddCourseSchedulingEnrollment {
  enrollmentIds: string[]
  force?: boolean
  courseSchedulingId: string;
}
export interface IEnrollment{
  courseScheduling?: string    // Identificador de la programación
  user?: string | any // Identificador del usuario en campus
  email: string,          // email de estudiante
  password: string,
  firstname: string,      // Nombre de estudiante
  lastname: string,       // Apellido de estudiante
  documentType?: string,   // Tipo de documento (CC, CE, PAS )
  documentID?: string,     // Documento de identidad
  phoneNumber?: string // Numero de telefono
  courseID: string,       // ID de curso (listado de cursos en CV)
  rolename?: string,
  sendEmail?: boolean | 'true' | 'false' // Booleano que indica si se debe enviar notificación via email
  regional?: string,
  city?:string,
  country?:string,
  birthdate?:string,
  emailAlt?:string,
  job?:string,
  title?:string,
  educationalLevel?:string,
  company?:string,
  genre?:string,
  origin?:string,
  enrollmentCode?: number,
  id?: string             // Identificador del Enrollment
  timezone?: TimeZone
  created_at?: string
  updated_at?: string
}

export interface IEnrollmentQuery {
  courseID?: string // Identificador del curso de moodle
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
  course_scheduling?: string;
  without_certification?: boolean
  check_certification?: boolean,
  origin?: string
}

export interface IMassiveEnrollment{
  courseID        : string,   // ID de curso (listado de cursos en CV)
  courseScheduling: string    // Identificador de la programación
  sendEmail?: boolean | 'true' | 'false' // Booleano que indica si se debe enviar notificación via email
  contentFile     :           // contento of file to be processed.
  {
    name: string,
    data: Buffer,
  }
}

export interface IEnrollmentDelete {
  id: string // Identificador de la matrícula en Campus Digital
  sendEmail?: boolean | 'true' | 'false' // Booleano que indica si se debe enviar notificación via email
}

export interface IEnrollmentFindStudents{
  name?: string;
  email?: string;
  docNumber?: string;
}

export interface IParamsUpdateLoadParticipantsSchedule{
  schedulingId: string;
  loading: boolean;
  status?: 'success' | 'error';
  errors?: any[];
  success?: any[];
  lastUploadDate?: Date;
}

export interface ILogEnrollment {
  status: 'ERROR' | 'OK'
  message?: string
  row: number
}

export interface IGetCurrentEnrollmentStatusParams {
  enrollmentId: string
}

export interface IBuyCoursesByShoppingCart {
  itemsToBuy: IShoppingCarItem[]
}


export interface IShoppingCarItem {
  identifier: string,
  image: string,
  description: string,
  price: string,
  startDate: string,
  modality: string,
  priceWithDiscount?: string | null,
}

//@end
