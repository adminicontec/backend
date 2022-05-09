// @import types
// @end

// @add your types
export enum FactoryReportType {
  MODALITY = 'modality',
  OVERVIEW_PROGRAMS = 'overview_programs',
  GENERAL_STUDENT_CERTIFICATES = 'general_student_certificates'
}
export interface IFactoryGenerateReport {
  report: FactoryReportType,
  title?: string;
  output_format?: 'xlsx' | 'json';
  reportStartDate?: string | undefined,
  reportEndDate?: string | undefined
  modality?: string;
}
//@end
