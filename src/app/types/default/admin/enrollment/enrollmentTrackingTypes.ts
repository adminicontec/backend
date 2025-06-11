// @import types
import { EnrollmentStatus } from './enrollmentTypes'
// @end

export enum EnrollmentTrackingType {
  ERROR = 'error',           // Cuando falla la matrícula
  SUCCESS = 'success',       // Matrícula exitosa
  UNENROLLMENT = 'unenrollment'  // Desmatriculación
}

export enum EnrollmentTrackingSource {
  EXTERNAL_ENROLLMENT = 'external_enrollment',
  SELF_ENROLLMENT = 'self_enrollment',
  ADMIN = 'admin',
  SYSTEM = 'system',
  MASSIVE = 'massive'
}

export interface IErrorLog {
  source: string;        // Origen del error (moodle, campus, external_service, etc)
  status: string;        // Estado del error
  code?: string;         // Código de error si existe
  message: string;       // Mensaje de error
  details?: any;         // Detalles adicionales del error
  timestamp: Date;       // Momento en que ocurrió el error
}

// @add your types
export interface IEnrollmentTracking {
  // Campos requeridos
  studentEmail: string,      // Email del estudiante
  enrollmentDate: Date,      // Fecha de la acción
  trackingType: EnrollmentTrackingType,  // Tipo de tracking
  trackingSource: EnrollmentTrackingSource, // Origen de la acción

  // Campos opcionales
  id?: string,

  // Información del estudiante
  studentId?: string,        // Id del estudiante en el sistema
  studentDocument?: string,  // Documento de identidad

  // Información del curso/programa
  courseId?: string,         // Id del curso en Moodle
  courseSchedulingId?: string, // Id de la programación

  // Información de la matrícula
  enrollmentId?: string,     // Id de la matrícula (si se creó)
  enrollmentCode?: number,   // Código de matrícula
  enrollmentStatus?: EnrollmentStatus, // Estado de la matrícula

  // Información del tracking
  requestData?: Record<string, any>,  // Datos de la solicitud original
  errorLog?: Record<string, any>,     // Log de error si aplica

  // Metadata
  origin?: string,           // Origen específico
  updatedAt?: Date,         // Fecha de última actualización

  // Campos para desmatriculación
  unenrollmentDate?: Date,  // Fecha de desmatriculación
  unenrollmentReason?: string, // Razón de la desmatriculación

  // Campos para extensibilidad futura
  metadata?: Record<string, any>, // Campos adicionales que puedan necesitarse
  tags?: string[],          // Etiquetas para categorización
  version?: number          // Versión del tracking para cambios futuros
}



// Interfaces para datos de matrícula
export interface IEnrollmentData {
  userId?: string;
  email: string;
  documentId: string;
  courseId: string | number;
  course_scheduling?: string;
  program?: {
    _id: string;
    name: string;
  };
  enrollmentId?: string;
  enrollmentCode?: number;
  status?: EnrollmentStatus;
  origin?: string;
  createdBy?: string;
}

// Interface para errores de Moodle
export interface IMoodleError {
  status: 'error';
  message: string;
  code?: string;
}

// Interface para respuesta de Moodle
export interface IMoodleResponse {
  status: 'success' | 'error';
  message?: string;
  user?: {
    id: number;
    username: string;
  };
  course?: {
    id: number;
    name: string;
  };
}

// Interface para respuesta del servicio
export interface IServiceResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  additional_parameters?: {
    tracking?: T;
    [key: string]: any;
  };
}

// Interface para registro de tracking
export interface ITrackingRecord {
  _id: string;
  enrollmentCode?: number;
  user?: string;
  courseId?: string | number;
  course_scheduling?: string;
  [key: string]: any;
}

// Interface para programa
export interface IProgram {
  _id: string;
  name: string;
  code?: string;
}

// Interface para programación de curso
export interface ICourseScheduling {
  _id: string;
  program: IProgram;
  schedulingStatus: {
    name: string;
  };
  metadata?: {
    service_id?: string;
  };
  startDate: Date;
  endDate: Date;
  moodle_id?: number;
  serviceValidity?: number;
}

// Interface para certificado
export interface ICertificate {
  _id: string;
  userId: string;
  courseId: string;
  certificate?: {
    date?: Date;
    title?: string;
    hash?: string;
    pdfPath?: string;
    imagePath?: string;
  };
  status: string;
  certificateType?: 'academic' | 'audit';
  certificateSetting?: string;
}
//@end