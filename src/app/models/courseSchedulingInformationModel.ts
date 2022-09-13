// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
const { Schema } = mongoose;
// @end

const CourseSchedulingInformationSchema = new Schema({
  // @add_schema Add schema here
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseScheduling: {
    type: Schema.Types.ObjectId,
    ref: 'CourseScheduling',
    required: true
  },
  totalAttendanceHours: {
    type: Schema.Types.Number
  },
  totalAttendanceScore: {
    type: Schema.Types.Number
  },
  totalScore: {
    type: Schema.Types.Number
  },
  taskScore: {
    type: Schema.Types.Number
  },
  examsScore: {
    type: Schema.Types.Number
  },
  forumsScore: {
    type: Schema.Types.Number
  },
  completion: {
    type: Schema.Types.Number
  },
  auditExamScore: {
    type: Schema.Types.Number
  },
  isAuditExamApprove: {
    type: Schema.Types.Boolean
  },
  isAttendanceCertification: {
    type: Schema.Types.Boolean
  },
  isPartialCertification: {
    type: Schema.Types.Boolean
  },
  // TODO: Preguntar si se deja en undefined o con el default
  auditCertificateType: {
    type: Schema.Types.String,
    default: 'NO SE CERTIFICA'
  },
  certificationDate: {
    type: Schema.Types.Date
  },
  certificationDownloadDate: {
    type: Schema.Types.Date
  },
  assistanceCertificate: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  auditCertificationDate: {
    type: Schema.Types.Date
  },
  auditCertificationDownloadDate: {
    type: Schema.Types.Date
  },
  auditAssistanceCertificate: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  certificateStats: {
    isAttendanceComplete: {
      type: Schema.Types.Boolean,
      default: false
    },
    isProgressComplete: {
      type: Schema.Types.Boolean,
      default: false
    },
    isCertificate: {
      type: Schema.Types.Boolean,
      default: false
    },
    isDownloadCertificate: {
      type: Schema.Types.Boolean,
      default: false
    }
  },
  auditCertificateStats: {
    isAttendanceComplete: {
      type: Schema.Types.Boolean,
      default: false
    },
    isExamApprove: {
      type: Schema.Types.Boolean,
      default: false
    },
    isCertificate: {
      type: Schema.Types.Boolean,
      default: false
    },
    isDownloadCertificate: {
      type: Schema.Types.Boolean,
      default: false
    }
  },
  courses: [{
    schedulingDetails: {
      type: Schema.Types.ObjectId,
      ref: 'CourseSchedulingDetails',
      required: true
    },
    attendanceScore: {
      type: Schema.Types.Number
    },
    progressPercentage: {
      type: Schema.Types.Number
    }
  }],
  certificationData: {
    isAuditorCerficateEnabled: {
      type: Schema.Types.Boolean
    },
    firstCertificateIsAuditor:  {
      type: Schema.Types.Boolean
    },
    certificationLabel:  {
      type: Schema.Types.String
    },
    virtualProgress:  {
      type: Schema.Types.Number
    },
    virtualActivities:  {
      type: Schema.Types.Number
    },
    assistance:  {
      type: Schema.Types.Number
    },
    auditorCertificate: {
      certificationLabel:  {
        type: Schema.Types.String
      },
      auditorExamScore:  {
        type: Schema.Types.Number
      },
    },
    firstCertificateIsAuditorContent: {
      auditorExamScore:  {
        type: Schema.Types.Number
      },
    },
  }
  // @end
}, {
  collection: 'course_scheduling_informations' ,timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// INFO: Para usar soft delete se debe invocar exactamente el metodo delete() o sus derivados en lugar de remove()
// Example: UserModel.delete({_id: id})
CourseSchedulingInformationSchema.plugin(mongoose_delete,{
  deletedAt : true,
  overrideMethods: 'all',
  indexFields: 'all'
});

// INFO: Si desea declarar los campos del esquema que no se tendrán en cuenta para la descripción general del modelo
// CourseSchedulingInformationSchema.methods.invalid_fields = ["field1", "field2"];

// INFO: Si desea implementar un metodo despues de guardar habilite el siguiente metodo
// CourseSchedulingInformationSchema.methods.postSave = (parameters) => {
// }


export const CourseSchedulingInformationModel = mongoose.model<any, any>('CourseSchedulingInformation', CourseSchedulingInformationSchema);
