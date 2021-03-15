// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
const { Schema } = mongoose;
// @end

const EnviromentSchema = new Schema({
  // @add_schema Add schema here
  name: {
    type: Schema.Types.String,
    required: true
  },
  description: { type: Schema.Types.String },
  app_module: [{
    type: Schema.Types.ObjectId,
    ref: "AppModule"
  }],
  // @end
}, {
  collection: 'enviroments' ,timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// INFO: Para usar soft delete se debe invocar exactamente el metodo delete() o sus derivados en lugar de remove()
// Example: UserModel.delete({_id: id})
EnviromentSchema.plugin(mongoose_delete,{
  deletedAt : true,
  overrideMethods: 'all',
  indexFields: 'all'
});

// INFO: Si desea declarar los campos del esquema que no se tendrán en cuenta para la descripción general del modelo
// EnviromentSchema.methods.invalid_fields = ["field1", "field2"];

// INFO: Si desea implementar un metodo despues de guardar habilite el siguiente metodo
// EnviromentSchema.methods.postSave = (parameters) => {
// }


export const EnviromentModel = mongoose.model<any, any>('Enviroment', EnviromentSchema);
