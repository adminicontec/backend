// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
const { Schema } = mongoose;
// @end

const CertificateLogsSchema = new Schema({
  // @add_schema Add schema here
  serviceResponse: {
    type: Schema.Types.String,
    required: true,
  },
  idCertificateQueue: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  message: {
    type: Schema.Types.String
  },
  requestData: {
    type: Schema.Types.Mixed
  },

  // @end
}, {
  collection: 'certificate_logs' ,timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// INFO: Para usar soft delete se debe invocar exactamente el metodo delete() o sus derivados en lugar de remove()
// Example: UserModel.delete({_id: id})
CertificateLogsSchema.plugin(mongoose_delete,{
  deletedAt : true,
  overrideMethods: 'all',
  indexFields: 'all'
});

// INFO: Si desea declarar los campos del esquema que no se tendrán en cuenta para la descripción general del modelo
// CertificateLogsSchema.methods.invalid_fields = ["field1", "field2"];

// INFO: Si desea implementar un metodo despues de guardar habilite el siguiente metodo
// CertificateLogsSchema.methods.postSave = (parameters) => {
// }


export const CertificateLogsModel = mongoose.model<any, any>('CertificateLogs', CertificateLogsSchema);
