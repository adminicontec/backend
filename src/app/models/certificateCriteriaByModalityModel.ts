// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
const { Schema } = mongoose;
// @end

const CertificateCriteriaByModalitySchema = new Schema({
  // @add_schema Add schema here
  modality: {
    type: Schema.Types.ObjectId,
    ref: "CourseSchedulingMode",
    required: true
  },
  typeCourse: {
    type: Schema.Types.String,
    required: false
  },
  certificateCriteria: {
    type: Schema.Types.ObjectId,
    ref: 'Attached'
  },
  // @end
}, {
  collection: 'certificate_criteria_by_modalities' ,timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// INFO: Para usar soft delete se debe invocar exactamente el metodo delete() o sus derivados en lugar de remove()
// Example: UserModel.delete({_id: id})
CertificateCriteriaByModalitySchema.plugin(mongoose_delete,{
  deletedAt : true,
  overrideMethods: 'all',
  indexFields: 'all'
});

// INFO: Si desea declarar los campos del esquema que no se tendrán en cuenta para la descripción general del modelo
// CertificateCriteriaByModalitySchema.methods.invalid_fields = ["field1", "field2"];

// INFO: Si desea implementar un metodo despues de guardar habilite el siguiente metodo
// CertificateCriteriaByModalitySchema.methods.postSave = (parameters) => {
// }


export const CertificateCriteriaByModalityModel = mongoose.model<any, any>('CertificateCriteriaByModality', CertificateCriteriaByModalitySchema);
