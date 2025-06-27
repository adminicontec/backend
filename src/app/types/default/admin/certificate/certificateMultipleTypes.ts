// @import types
import {CertificateSettingCriteria, CertificateSettingType} from '@scnode_app/types/default/admin/course/certificateSettingsTypes'
// @end

// @add your types
export interface ICertificateMultipleData {
  course_scheduling: string;
  without_certification?: boolean
  studentId?: string,
  certificateSettingId?: string
  only_certificates?: boolean
}

export interface ICertificateMultipleDataCertificationCertificate {
  isGenerated: boolean;
  certificateUrl?: string;
  certificateDate?: string;
  certificateHash?: string;
  certificateStatus?: string
  errorMessage?: string;
  certificateId?: string
}

export interface ICertificateMultipleDataCertificationModuleCriteriaResume {
  type: CertificateSettingCriteria;
  percentageRequired: number;
  percentageObtainer: number;
  approved: boolean
  complement?: any
  isPartial: boolean
}

export interface ICertificateMultipleDataCertificationModule {
  courseSchedulingDetailId: string;
  courseSchedulingDetailName: string;
  moduleCriteriaResume: ICertificateMultipleDataCertificationModuleCriteriaResume[]
  approved: boolean;
  isPartial: boolean
}

export interface ICertificateMultipleDataCertification {
  certificateSettingId: string;
  certificateName: string;
  certificateType: CertificateSettingType;
  approved: boolean,
  certificate?: ICertificateMultipleDataCertificationCertificate
  modules: ICertificateMultipleDataCertificationModule[],
  isPartial: boolean
}

export interface ICertificateMultipleDataStudent {
  studentCode: string;
  userId: string;
  studentName: string
  studentDocnumber: string;
  studentUsername: string;
  certifications: ICertificateMultipleDataCertification[]
}

export interface ICertificateMultipleDataResponse {
  courseSchedulingId: string
  student?: ICertificateMultipleDataStudent
  students?: ICertificateMultipleDataStudent[],
  warnings?: Record<string, string>[]
}

export interface ICertificateMultipleGenerateStudent {
  userId: string;
  certificateSettings: {certificateSettingId: string, isPartial: boolean}[]
}

export interface ICertificateMultipleGenerate {
  courseSchedulingId: string;
  students: ICertificateMultipleGenerateStudent[];
  user: string;
  needPayment?: boolean;
  retryConfig?: {
    maxRetries: number,
    currentAttempt?: number
  },
  synchronousProcedure?: boolean
}

export interface ICertificateQueueMultiple {
  _id?: string;
  userId: string;
  courseId: string;
  certificateSetting: string;
  auxiliar: string;
  certificateType: string;
  certificateConsecutive: string;
  status: string;
  isPartial: boolean
  needPayment?: boolean
  userNotified?: boolean
  retryConfig?: {
    currentAttempt?: number
    maxRetries: number
  }
}

export interface ICertificateMultipleCreate extends ICertificateMultipleBuildData {}

export interface ICertificateMultipleBuildData {
  certificateQueueId: string,
  userId: string;
  courseId: string;
  auxiliarId: string, // ID de Auxiliar qué liberó el certificado
  certificateConsecutive: string,
  certificateHash?: string
  certificateSettingId: string;
}


export interface IBuildStudentsMoodleData {
  moodleId: string;
  studentMoodleId?: string,
  students: string[]
}

interface IStudentStatsBase {
  graderaw: number;
}

export enum StudentStats {
  ATTENDANCE = 'attendance',
  EXAM = 'exam',
  COURSE = 'course',
  PROGRESS = 'progress',
  ASSIGN = 'assign',
  FORUM = 'forum',
}

export interface IStudentStatsAttendance extends IStudentStatsBase {}
export interface IStudentStatsAssign extends IStudentStatsBase {}
export interface IStudentStatsCourse extends IStudentStatsBase {}
export interface IStudentStatsForum extends IStudentStatsBase {}
export interface IStudentStatsExam extends IStudentStatsBase {
  isAuditor: boolean
}
export interface IStudentStatsProgress {
  state: number;
}

export interface IStudentStats {
  attendance: IStudentStatsAttendance[],
  exam: IStudentStatsExam[],
  course: IStudentStatsCourse[]
  progress: IStudentStatsProgress[]
  assign: IStudentStatsAssign[]
  forum: IStudentStatsForum[]
}
//@end
