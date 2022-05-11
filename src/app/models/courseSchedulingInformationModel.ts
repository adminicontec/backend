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
  assistanceCertificate: {
    type: Schema.Types.ObjectId,
    ref: 'User'
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

  }]
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
