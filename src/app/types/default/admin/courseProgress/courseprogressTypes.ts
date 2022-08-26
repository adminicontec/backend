// @import types
// @end

// @add your types


export interface IStudentProgress {
  status: string,
  attended_approved: string,
  average_grade?: number,
  completion?: number,
  assistance?: string,
  quizGrade?: string,
  approved_modules: any[],
  auditor: boolean,
  auditorCertificate: string,
  auditorGrade: number
}


//@end
