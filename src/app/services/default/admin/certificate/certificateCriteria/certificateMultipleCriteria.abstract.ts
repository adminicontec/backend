import { IStudentStats } from "@scnode_app/types/default/admin/certificate/certificateMultipleTypes";
import { CertificateSettingsModules } from "@scnode_app/types/default/admin/course/certificateSettingsTypes";

export interface IEvaluateCriteria {
  approved: boolean;
  percentage: number;
  complement?: any;
}

export abstract class ICertificateMultipleCriteria {
  abstract evaluateCriteria(stats: Record<string, Record<string, IStudentStats>>, module: CertificateSettingsModules): IEvaluateCriteria
}
