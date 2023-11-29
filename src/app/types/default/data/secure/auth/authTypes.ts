// @import types
// @end

// @add your types
export interface LoginFields {
	username: string // Nombre de usuario que lo identifica dentro del sistema
	password: string // Contraseña del usuario
}

export interface UserFields {
  _id: string
  username: string
  profile: any,
  roles: Array<any>
  moodle_id: string
  show_profile_interaction?: boolean
  company?: Record<any, string> | null | undefined
  admin_company?: boolean
  reviewData?: {
    status: 'pending' | 'reviewed',
    lastReview?: Date
  }
}

export interface IGenerateTokenFromDestination {
  subject: string,
  destination: 'email' | 'sms'
  email?: string
  cell_phone?: string
}

export interface ILoginTokenData {
  token_type?: 'destination' | 'confirm_email' | 'confirm_2fa',
  config?: object;
  numbers?: 1 | 0;
  symbols?: 1 | 0;
  uppercase?: 1 | 0;
  lowercase?: 1 | 0;
  extraData?: Record<string, any>
}

export interface IChangeRecoveredPassword {
  token: string
  password: string
}

export interface IValidateTokenGenerated {
  token: string
}

export interface IConfirm2FA {
  token: string
}
//@end
