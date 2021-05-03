// @import types
// @end

// @add your types
export interface IMoodleUser{
  email: string,          // email del usuario
  username:string,        // username del Usuario
  password: string,       // Contraseña del Usuario
  firstname: string,      // Nombre de Usuario
  lastname: string,       // Apellido de Usuario
  id?: string             // Identificador del usuario en Moodle
}
//@end


export interface IMoodleUserQuery{
  id?: string             // Identificador del curso en Moodle
  email?: string,         // email del usuario
  username?:string,
}
