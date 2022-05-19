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
  forumsScore?: number;                         // Nota de foros
  completion?: number;                          // Porcentaje de completitud (Porcentaje de Avance del programa)
  auditExamScore?: number;                      // Calificación del examen de auditor
  isAuditExamApprove?: boolean;                 // Verificar si aprueba o no el examen de auditor
  isAttendanceCertification?: boolean;          // Verificar si aplica para certificado de asistencia
  isPartialCertification?: boolean;             // Verificar si aplica para certificado parcial
  auditCertificateType?: string;                // Tipo de certificado de auditor
  certificationDate?: Date;                     // Fecha de certificación
  certificationDownloadDate?: Date;             // Fecha de descarga del certificado
  assistanceCertificate?: string;               // Auxiliar logístico que libera el certificado
  auditCertificationDate?: Date;                // Fecha de certificación de auditoría
  auditCertificationDownloadDate?: Date;        // Fecha de descarga del certificado de auditoria
  auditAssistanceCertificate?: string;          // Auxiliar logístico que libera el certificado de auditor
  certificateStats?: {                          // Estadísticas de certificado
    isAttendanceComplete?: boolean;             // Cumple con la asistencia
    isProgressComplete?: boolean;               // Cumple con el avance del programa
    isCertificate?: boolean;                    // Se ha liberado el certificado
    isDownloadCertificate?: boolean;            // Se ha descargado el certificado
  };
  auditCertificateStats?: {                     // Estadísticas de certificado de auditor
    isAttendanceComplete?: boolean;              // Cumple con la asistencia de auditor
    isExamApprove?: boolean;                     // Aprueba el examen de auditor
    isCertificate?: boolean;                     // Se ha liberado el certificado de auditor
    isDownloadCertificate?: boolean;             // Se ha liberado el certificado de auditor
  };
  courses?: {                                   // Listado de cursos del servicio
    schedulingDetails: string;                  // Id del curso
    attendanceScore?: number;                   // Calificación de asistencia
  }[]
}

export interface IParamsCourseSchedulingInformationList extends IQueryFind{
  pageNumber?:string, // Numero de pagina
  nPerPage?:string, // Cantidad de elementos por pagina
  select?: string, // Campos de la colección a buscar
}
//@end
