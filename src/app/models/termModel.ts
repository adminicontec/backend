// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
const { Schema } = mongoose;
// @end

const TermSchema = new Schema({
  // @add_schema Add schema here
  type: {
    type: Schema.Types.String,
    required: true,
  },
  name: { type: Schema.Types.String, required: true },
  position: { type: Schema.Types.Number },
  custom: {
    type: Schema.Types.Mixed,
  },
  enabled: {
    type: Schema.Types.Boolean,
    default: true
  }
  // @end
}, {
  collection: 'terms' ,timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// INFO: Para usar soft delete se debe invocar exactamente el metodo delete() o sus derivados en lugar de remove()
// Example: UserModel.delete({_id: id})
TermSchema.plugin(mongoose_delete,{
  deletedAt : true,
  overrideMethods: 'all',
  indexFields: 'all'
});

// INFO: Si desea declarar los campos del esquema que no se tendrán en cuenta para la descripción general del modelo
// TermSchema.methods.invalid_fields = ["field1", "field2"];

// INFO: Si desea implementar un metodo despues de guardar habilite el siguiente metodo
// TermSchema.methods.postSave = (parameters) => {
// }


export const TermModel = mongoose.model<any, any>('Term', TermSchema);
