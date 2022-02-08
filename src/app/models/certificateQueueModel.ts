// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
const { Schema } = mongoose;
// @end

const CertificateQueueSchema = new Schema({
  // @add_schema Add schema here
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: "CourseScheduling",
    required: true
  },
  certificateType: {
    type: Schema.Types.String,
    required: false
  },
  certificateModule: {
    type: Schema.Types.String,
    required: false
  },
  status: {
    type: Schema.Types.String,
    required: true,
    enum: ['New', 'In-process', 'Requested', 'Complete', 'Error', 'Re-issue']
  },
  message: {
    type: Schema.Types.String,
    required: false
  },
  certificate: {
    hash: {
      type: Schema.Types.String,
      required: false
    },
    url: {
      type: Schema.Types.String,
      required: false
    },
    title: {
      type: Schema.Types.String,
      required: false
    },
    date: {
      type: Schema.Types.Date,
      required: false
    },
    imagePath: {
      type: Schema.Types.String,
      required: false
    },
    pdfPath: {
      type: Schema.Types.String,
      required: false
    },
    required: false,
  },
  // @end
}, {
  collection: 'certificate_queues', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// INFO: Para usar soft delete se debe invocar exactamente el metodo delete() o sus derivados en lugar de remove()
// Example: UserModel.delete({_id: id})
CertificateQueueSchema.plugin(mongoose_delete, {
  deletedAt: true,
  overrideMethods: 'all',
  indexFields: 'all'
});

// INFO: Si desea declarar los campos del esquema que no se tendrán en cuenta para la descripción general del modelo
// CertificateQueueSchema.methods.invalid_fields = ["field1", "field2"];

// INFO: Si desea implementar un metodo despues de guardar habilite el siguiente metodo
// CertificateQueueSchema.methods.postSave = (parameters) => {
// }


export const CertificateQueueModel = mongoose.model<any, any>('CertificateQueue', CertificateQueueSchema);
