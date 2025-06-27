// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import {
  IEnrollmentTracking,
  EnrollmentTrackingType,
  EnrollmentTrackingSource,
  IEnrollmentData,
  IErrorLog
} from '@scnode_app/types/default/admin/enrollment/enrollmentTrackingTypes';
// @end

// @import models
import { EnrollmentTracking } from '@scnode_app/models'
// @end

class EnrollmentTrackingService {
  constructor() {}

  public track = async (params: IEnrollmentTracking) => {
    try {
      // Asegurar campos requeridos
      const trackingData = {
        ...params,
      };

      // Si es una actualización
      if (params.id) {
        const register = await EnrollmentTracking.findOne({ _id: params.id });
        if (!register) {
          return responseUtility.buildResponseFailed('json', null, {
            message: 'Registro de tracking no encontrado'
          });
        }

        const response = await EnrollmentTracking.findByIdAndUpdate(
          params.id,
          trackingData,
          { useFindAndModify: false, new: true }
        );

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: { tracking: response }
        });
      }

      // Crear nuevo registro
      const response = await EnrollmentTracking.create(trackingData);

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: { tracking: response }
      });

    } catch (e) {
      console.log('EnrollmentTrackingService::track::catch', e);
      return responseUtility.buildResponseFailed('json', null, {
        message: e?.message || 'Error al registrar tracking'
      });
    }
  }

  private buildBaseTrackingData(
    enrollmentData: IEnrollmentData,
    trackingType: EnrollmentTrackingType,
    source: EnrollmentTrackingSource,
    requestData: Record<string, any>
  ): Pick<IEnrollmentTracking, 'studentEmail' | 'enrollmentDate' | 'trackingType' | 'trackingSource'> & Partial<IEnrollmentTracking> {
    return {
      // Información del estudiante
      studentEmail: enrollmentData.email,
      studentDocument: enrollmentData.documentId,

      // Información del curso/programa
      courseId: enrollmentData?.courseId?.toString(),
      // programName: enrollmentData?.program?.name,

      // Información de tracking
      enrollmentDate: new Date(),
      trackingType,
      trackingSource: source,

      // Metadata
      requestData,
      origin: enrollmentData.origin
    };
  }

  public trackEnrollmentSuccess = async (enrollmentData: IEnrollmentData, source: EnrollmentTrackingSource, requestData: Record<string, any>) => {
    try {
      const trackingData: IEnrollmentTracking = {
        ...this.buildBaseTrackingData(enrollmentData, EnrollmentTrackingType.SUCCESS, source, requestData),

        studentId: enrollmentData.userId,
        courseSchedulingId: enrollmentData.course_scheduling,
        // programId: enrollmentData.program?._id,
        enrollmentId: enrollmentData.enrollmentId,
        enrollmentCode: enrollmentData.enrollmentCode,
        enrollmentStatus: enrollmentData.status,
      };

      return await this.track(trackingData);
    } catch (e) {
      console.log('EnrollmentTrackingService::trackEnrollmentSuccess::catch', e);
      return null;
    }
  }

  public trackEnrollmentError = async (errorData: any, enrollmentData: IEnrollmentData, source: EnrollmentTrackingSource, requestData: Record<string, any>) => {
    try {
      // Formatear el error de forma genérica
      const errorLog: IErrorLog = {
        source: this.determineErrorSource(errorData),
        status: errorData?.status || 'error',
        code: errorData?.code,
        message: errorData?.message || 'Error desconocido',
        details: errorData,
        timestamp: new Date()
      };

      const trackingData: IEnrollmentTracking = {
        ...this.buildBaseTrackingData(enrollmentData, EnrollmentTrackingType.ERROR, source, requestData),
        errorLog,
      };

      return await this.track(trackingData);
    } catch (e) {
      console.log('EnrollmentTrackingService::trackEnrollmentError::catch', e);
      return null;
    }
  }

  public getTrackingSource(origin: string): EnrollmentTrackingSource {
    switch (origin) {
      case 'Tienda Virtual':
        return EnrollmentTrackingSource.EXTERNAL_ENROLLMENT;
      case 'ShoppingCart':
        return EnrollmentTrackingSource.SELF_ENROLLMENT;
      default:
        return EnrollmentTrackingSource.MASSIVE;
    }
}

  private determineErrorSource(errorData: any): string {
    // Determinar la fuente del error basado en su estructura o propiedades
    if (errorData?.moodleError) return 'moodle';
    if (errorData?.campusError) return 'campus';
    if (errorData?.externalService) return 'external_service';
    if (errorData?.validationError) return 'validation';
    if (errorData?.databaseError) return 'database';
    return 'unknown';
  }
}

export const enrollmentTrackingService = new EnrollmentTrackingService();
export { EnrollmentTrackingService as DefaultAdminEnrollmentEnrollmentTrackingService };
