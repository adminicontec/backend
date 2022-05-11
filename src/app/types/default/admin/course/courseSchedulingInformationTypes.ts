// @import types
import { IQueryFind } from '@scnode_app/types/default/global/queryTypes';
// @end

// @add your types
export interface ICourseSchedulingInformation{
  user: string;                                 // Id del estudiante
  courseScheduling: string;                     // Id del servicio
  totalAttendanceHours?: number;                // Total de asistencia al programa en horas
  totalAttendanceScore?: number;                // Total de asistencia al programa en porcentaje
  totalScore?: number;                          // Nota final
  taskScore?: number;                           // Nota de tareas
  examsScore?: number;                          // Nota de evaluaciones
  completion?: number;                          // Porcentaje de completitud
  auditExamScore?: number;                      // Calificación del examen de auditor
  isAuditExamApprove?: boolean;                 // Verificar si aprueba o no el examen de auditor
  isAttendanceCertification?: boolean;          // Verificar si aplica para certificado de asistencia
  isPartialCertification?: boolean;             // Verificar si aplica para certificado parcial
  auditCertificateType?: string;                // Tipo de certificado de auditor
  certificationDate?: Date;                     // Fecha de certificación
  assistanceCertificate?: string;               // Auxiliar logístico que libera el certificado
  courses?: {                                   // Listado de cursos del servicio
    schedulingDetails: string;                  // Id del curso
    attendanceScore?: number;                   // Calificación de asistencia
  }[]
}

export interface IParamsCourseSchedulingInformationList extends IQueryFind{
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la coleccion a buscar
}
//@end
