// @import types
// @end

// @add your types
export enum TimeZone {
  GMT_4 = 'GMT-4',
  GMT_5 = 'GMT-5',
  GMT_6 = 'GMT-6',
  GMT_7 = 'GMT-7',
  GMT_8 = 'GMT-8',
}

export const TIME_ZONES = [
  TimeZone.GMT_4,
  TimeZone.GMT_5,
  TimeZone.GMT_6,
  TimeZone.GMT_7,
  TimeZone.GMT_8
]

export const TIME_ZONES_WITH_OFFSET = {
  [TimeZone.GMT_4]: "-04:00",
  [TimeZone.GMT_5]: "-05:00",
  [TimeZone.GMT_6]: "-06:00",
  [TimeZone.GMT_7]: "-07:00",
  [TimeZone.GMT_8]: "-08:00",
}

export interface IUser {
  moodle?: 'off' | 'on',
  username?: string, // Nombre de usuario que es utilizado para iniciar sesión
  normalizedUserName?: string,
  email?: string, // Correo electronico del usuario
  normalizedEmail?: string
  emailConfirmed?: boolean // Establece si el email del usuario es valido
  current_password?: string // Contraseña actual del usuario
  password?: string // Contraseña sin encriptar (Proporcionada por el usuario)
  passwordHash?: string, // Contraseña encriptada (Generada por el sistema)
  securityStamp?: string,
  concurrencyStamp?: string,
  phoneNumber?: string, // Numero de telefono del usuario
  phoneNumberConfirmed?: boolean, // Establece si el numero de telefono del usuario es valido
  twoFactorEnabled?: boolean, // Establece si el usuario tiene autenticación de dos factores
  lockoutEnd?: string,
  lockoutEnabled?: boolean,
  accessFailedCount?: number,
  profile?: {
    doc_type?: string,
    doc_number?: string,
    first_name?: string, // Nombres del usuario
    last_name?: string, // Apellidos del usuario
    avatarImageUrl?: string, // Avatar del usuario
    city?: string,      // Ciudad del usuario
    country?: string,   // Pais del usuario
    birthDate?: string, // Fecha de nacimiento de usuario
    regional?: string,  // regional del Usuario
    origen?: string,
    genre?: string,
    alternativeEmail?: string,

    currentPosition?: string,
    carreer?: string,
    educationalLevel?: string,
    company?: string,

    timezone?: TimeZone,

    contractType?: {    // Datos solamente usados por Docentes y Tutores
      type?: string,
      isTeacher?: boolean,
      isTutor?: boolean,
      ranking: string
    },
  },
  curriculum_vitae?: {
    biography?: string, // Biografia curriculo del usuario
    laboral_experience?: ILaboralExperience[], // Array experiencia laboral del usuario
    academic_info?: IAcademicInfo[] // Array grados academicos del usuario
    skill?: ISkill[] // Array de habilidades
    language?: ILanguage[] // Array de Idiomas
  },
  roles?: Array<string> | string, // Roles asignados al usuario
  createdBy?: string,
  lastModifiedBy?: string,
  avatar?: string, // Objeto de clase File que posee el archivo que sera cargado al servidor
  moodle_id?: number,
  sendEmail?: boolean // Booleano que identifica si se va a enviar notificación de creación
  id?: string // Identificador del permiso
}

export interface ILaboralExperience {
  company_position: string, // Nombre del cargo que ocupo en la empresa
  company: string, // Empresa asociada al cargo
  start_date: string, // Fecha de inicio del cargo
  end_date: string, // Fecha de finalizacion del cargo
  currently: boolean // INdicador booleano si se encuentra actualmente en ese cargo
}

export interface IAcademicInfo {
  school: string, // Nombre del establecimiento educativo
  degree: string, // Grado obtenido
  start_date: string, // Fecha de inicio del cargo
  end_date: string, // Fecha de finalizacion del cargo
  currently: boolean // INdicador booleano si se encuentra actualmente en ese cargo
}

export interface ISkill {
  name: string, 	// Título de la habilidad
  score: string,	// valoración
}

export interface ILanguage {
  name: string, 	// Idioma
  score: string,	// valoración
}

export interface IUserDelete {
  id: string // Identificador del usuario
}

export interface IUserManyDelete {
  username?: Array<string> | string
}

export interface IUserQuery {
  pageNumber?: string, // Numero de pagina
  nPerPage?: string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?: string, // Busca sobre los campos de la coleccion
  roles?: Array<string> | string // Roles
  role_names?: Array<string> | string // Roles
  company?: string // Identificador de compañia
  without_company?: boolean | string
  sort?: string
  username?: Array<string> | string
  admin_company?: boolean   // Saber si es administrador de la empresa
}

export interface IUserDateTimezone {
  date?: string // Fecha a convertir
  user?: any | string // Objeto de clase User o Identificador de User
}

export interface SendRegisterUserEmailParams{
  emails: Array<string>
  paramsTemplate: any
  resend?: boolean
  isCompanyUser?: boolean
}
//@end
