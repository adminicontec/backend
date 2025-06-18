import { TimeZone } from '@scnode_app/types/default/admin/user/userTypes';
import { EfipayCurrency } from '../../efipay/efipayTypes';
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
  trackingEnrollment?: boolean
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
  buyerId: string,
  itemsToBuy: IShoppingCarItem[],
  force?: boolean
  billingInfo?: IBillingInfo
}

export interface IBillingInfo {
  fullName: string,
  docNumber: string,
  docType: string,
  nature: string,
  classification: string,
  country: string,
  department: string,
  city: string,
  currency: EfipayCurrency,
  address1?: string,
  address2?: string,
  email?: string,
  phone?: string
}


// Add a new interface for the transaction creation
export interface ICreateShoppingCartTransaction {
  buyerId: string,
  items: IShoppingCarItem[],
  billingInfo: IBillingInfo;
}


export enum BUY_ACTION {
  FOR_MYSELF = "for_myself",
  FOR_OTHERS = "for_others",
  FOR_ME_AND_OTHERS = 'for_me_and_others'
};

export interface IShoppingCarItem {
  identifier: string,
  programCode: string,
  externalId: string,
  description: string,
  image: string,
  price: string,
  priceNumeric: number,
  startDate: string,
  modality: string,
  priceWithDiscount: string,
  priceWithDiscountNumeric: number,
  numberOfPlaces: number,
  dateOfAddition: number,
  buyAction: BUY_ACTION
}

export enum PROCESS_ITEM_PURCHASE {
  WARNING = 'warning',
  RESTRICTED = 'restricted',
  AVAILABLE = 'available',
}

export enum PROCESS_PURCHASE {
  VERIFY_PURCHASE = 'verify_purchase',
  REDIRECT = 'redirect'
}

export type ObjectsToBuy = Record<string, IObjectToBuy>;

export interface IObjectToBuy {
  processPurchase: PROCESS_ITEM_PURCHASE
  reason: string,
  programCode: string,
  programName: string,
  externalId: string,
  identifier: string
}
//@end
