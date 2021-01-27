// @import types
// @end

// @add your types
export interface LoginFields {
	username: string // Nombre de usuario que lo identifica dentro del sistema
	password: string // Contraseña del usuario
}

export interface UserFields {
  _id: string
  userName: string
  profile: any,
  roles: Array<any>
}
//@end
