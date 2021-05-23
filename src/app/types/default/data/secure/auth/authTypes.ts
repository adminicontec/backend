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
}

export interface IGenerateTokenFromDestination {
  subject: string,
  destination: 'email' | 'sms'
  email?: string
  cell_phone?: string
}

export interface ILoginTokenData {
  token_type?: 'destination',
  config?: object
}

export interface IChangeRecoveredPassword {
  token: string
  password: string
}

export interface IValidateTokenGenerated {
  token: string
}
//@end
