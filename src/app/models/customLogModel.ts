// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
const { Schema } = mongoose;
// @end

const CustomLogSchema = new Schema({
  // @add_schema Add schema here
  label: {
    type: Schema.Types.String,
    required: true,
  },
  content: {
    type: Schema.Types.Mixed
  },
  userId: {
    type: Schema.Types.String
  },
  description: {
    type: Schema.Types.String
  },
  schedulingMoodleId: {
    type: Schema.Types.String
  }
  // @end
}, {
  collection: 'custom_logs' ,timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// INFO: Para usar soft delete se debe invocar exactamente el metodo delete() o sus derivados en lugar de remove()
// Example: UserModel.delete({_id: id})
CustomLogSchema.plugin(mongoose_delete,{
  deletedAt : true,
  overrideMethods: 'all',
  indexFields: 'all'
});

// INFO: Si desea declarar los campos del esquema que no se tendrán en cuenta para la descripción general del modelo
// CustomLogSchema.methods.invalid_fields = ["field1", "field2"];

// INFO: Si desea implementar un metodo despues de guardar habilite el siguiente metodo
// CustomLogSchema.methods.postSave = (parameters) => {
// }


export const CustomLogModel = mongoose.model<any, any>('CustomLog', CustomLogSchema);
