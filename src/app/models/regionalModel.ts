// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
const { Schema } = mongoose;
// @end

const RegionalSchema = new Schema({
  // @add_schema Add schema here
  name: {
    type: Schema.Types.String,
    required: true,
  },
  moodle_id: { type: Schema.Types.String },
  short_key: { type: Schema.Types.String },
  // @end
}, {
  collection: 'regionals' ,timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// INFO: Para usar soft delete se debe invocar exactamente el metodo delete() o sus derivados en lugar de remove()
// Example: UserModel.delete({_id: id})
RegionalSchema.plugin(mongoose_delete,{
  deletedAt : true,
  overrideMethods: 'all',
  indexFields: 'all'
});

// INFO: Si desea declarar los campos del esquema que no se tendrán en cuenta para la descripción general del modelo
// RegionalSchema.methods.invalid_fields = ["field1", "field2"];

// INFO: Si desea implementar un metodo despues de guardar habilite el siguiente metodo
// RegionalSchema.methods.postSave = (parameters) => {
// }


export const RegionalModel = mongoose.model<any, any>('Regional', RegionalSchema);
