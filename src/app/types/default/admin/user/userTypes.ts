// @import types
// @end

// @add your types
export interface IUser {
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
    first_name?: string, // Nombres del usuario
    last_name?: string, // Apellidos del usuario
    avatarImageUrl?: string, // Avatar del usuario
    city?: string,      // Ciudad del usuario
    country?: string,   // Pais del usuario
    regional?: string,  // regional del Usuario
    origen?: string,
    genero?: string,
    birthDate?:string, // Fecha de nacimiento de usuario
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
  avatar?: string // Objeto de clase File que posee el archivo que sera cargado al servidor
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

export interface IUserQuery {
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
  search?:string, // Busca sobre los campos de la coleccion
  roles?: Array<string> | string // Roles
}

export interface IUserDateTimezone {
  date?: string // Fecha a convertir
  user?: any | string // Objeto de clase User o Identificador de User
}
//@end
