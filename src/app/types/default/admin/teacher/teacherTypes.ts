// @import types
// @end

import { bool } from "aws-sdk/clients/signer";

// @add your types
export interface ITeacher{
  user?: string // Identificador del usuario en campus
  email: string,          // email de estudiante
  password: string,
  firstname: string,      // Nombre de estudiante
  lastname: string,       // Apellido de estudiante
  documentType?: string,   // Tipo de documento (CC, CE, PAS )
  documentID?: string,     // Documento de identidad
  phoneNumber?: string // Numero de telefono
  rolename?: string,
  sendEmail?: boolean | 'true' | 'false' // Booleano que indica si se debe enviar notificación via email
  regional?: string,
  city?:string,
  country?:string,
  contractType?:{
    type?:string,
    isTeacher?:bool,
    isTutor?:bool
  }

  id?: string             // Identificador del Enrollment
}

export interface IMassiveLoad{
  sendEmail?: boolean | 'true' | 'false' // Booleano que indica si se debe enviar notificación via email
  contentFile     :           // contento of file to be processed.
  {
    name: string,
    data: Buffer,
  }
}
//@end
