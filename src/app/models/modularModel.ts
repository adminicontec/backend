// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
const { Schema } = mongoose;
// @end

const ModularSchema = new Schema({
  // @add_schema Add schema here
  name: {
    type: Schema.Types.String,
    required: true
  },
  description: {
    type: Schema.Types.String,
  },
  coverUrl: {
    type: Schema.Types.String
  },
  filterCategories: [{
    type: Schema.Types.ObjectId,
    ref: "Term"
  }]
  // @end
}, {
  collection: 'modulars' ,timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// INFO: Para usar soft delete se debe invocar exactamente el metodo delete() o sus derivados en lugar de remove()
// Example: UserModel.delete({_id: id})
ModularSchema.plugin(mongoose_delete,{
  deletedAt : true,
  overrideMethods: 'all',
  indexFields: 'all'
});

// INFO: Si desea declarar los campos del esquema que no se tendrán en cuenta para la descripción general del modelo
// ModularSchema.methods.invalid_fields = ["field1", "field2"];

// INFO: Si desea implementar un metodo despues de guardar habilite el siguiente metodo
// ModularSchema.methods.postSave = (parameters) => {
// }


export const ModularModel = mongoose.model<any, any>('Modular', ModularSchema);
