// @import types
// @end

// @add your types
export interface ICourseSchedulingInformation{
  user: string;
  courseScheduling: string;
  totalAttendanceHours?: number;
  totalAttendanceScore?: number;
  auditExamScore?: number;
  isAuditExamApprove?: boolean;
  isAttendanceCertification?: boolean;
  isPartialCertification?: boolean;
  auditCertificateType?: string;
  certificationDate?: Date;
  assistanceCertificate?: string;
  courses?: {
    schedulingDetails: string;
    attendanceScore?: number;
  }[]
}
//@end
