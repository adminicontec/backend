// @import types
import {CertificateSettingType} from '@scnode_app/types/default/admin/course/certificateSettingsTypes'
// @end

// @add your types
export interface ICertificateMultipleData {
  course_scheduling: string;
  without_certification?: boolean
  studentId?: string,
}

export interface ICertificateMultipleDataCertificationCertificate {
  isGenerated: boolean;
  certificateUrl?: string;
  certificateDate?: string;
  certificateHash?: string;
}

export interface ICertificateMultipleDataCertificationModuleCriteriaResume {
  type: ICertificateMultipleDataCertificationModule;
  percentageRequired: number;
  percentageObtainer: number;
  approved: boolean
}

export interface ICertificateMultipleDataCertificationModule {
  courseSchedulingDetailId: string;
  courseSchedulingDetailName: string;
  moduleCriteriaResume: ICertificateMultipleDataCertificationModuleCriteriaResume[]
  approved: boolean;
}

export interface ICertificateMultipleDataCertification {
  certificateSettingId: string;
  certificateName: string;
  certificateType: CertificateSettingType;
  approved: boolean,
  certificate?: ICertificateMultipleDataCertificationCertificate
  modules: ICertificateMultipleDataCertificationModule[]
}

export interface ICertificateMultipleDataStudent {
  studentCode: string;
  userId: string;
  studentName: string
  certifications: ICertificateMultipleDataCertification[]
}

export interface ICertificateMultipleDataResponse {
  courseSchedulingId: string
  student?: ICertificateMultipleDataStudent
  students?: ICertificateMultipleDataStudent[]
}

export interface ICertificateMultipleGenerateStudent {
  userId: string;
  certificateSettings: string[]
}

export interface ICertificateMultipleGenerate {
  courseSchedulingId: string;
  students: ICertificateMultipleGenerateStudent[];
  user: string;
}

export interface ICertificateQueueMultiple {
  userId: string;
  courseId: string;
  certificateSetting: string;
  auxiliar: string;
  certificateType: string;
  certificateConsecutive: string;
  status: string;
}
//@end
