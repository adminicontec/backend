// @import types
// @end

// @add your types
export interface IMoodleUser {
  email: string,          // email del usuario
  username: string,        // username del Usuario
  password: string,       // Contraseña del Usuario
  firstname: string,      // Nombre de Usuario
  lastname: string,       // Apellido de Usuario
  regional?: string,      // Campo opcional: regional a la que pertenece
  fechaNacimiento?: string, // Campo opcional: fecha de nacimiento (Unix time)
  email2?: string,       // Campo opcional: email alternativo
  cargo?: string,         // Campo opcional: cargo dentro de la empresa
  profesion?:string,      // Campo opcional: profesion
  nivelEducativo?:string, // Campo opcional: Nivel educativo
  empresa?:string,        // Campo opcional: empresa
  origen?:string,         // Campo opcional: Origen ??
  genero?:string,         // Campo opcional: género
  id?: string             // Identificador del usuario en Moodle
}
//@end


export interface IMoodleUserQuery {
  id?: string             // Identificador del curso en Moodle
  email?: string,         // email del usuario
  username?: string,
}
