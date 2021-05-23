// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
const { Schema } = mongoose;
// @end

const CompanySchema = new Schema({
  // @add_schema Add schema here
  slug: {
    type: Schema.Types.String,
    unique: true,
    index: true,
  },
  name: {
    type: Schema.Types.String,
    required: true,
  },
  description: {
    type: Schema.Types.String
  },
  logo: { type: Schema.Types.String },
  background: { type: Schema.Types.String },
  // @end
}, {
  collection: 'companies' ,timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// INFO: Para usar soft delete se debe invocar exactamente el metodo delete() o sus derivados en lugar de remove()
// Example: UserModel.delete({_id: id})
CompanySchema.plugin(mongoose_delete,{
  deletedAt : true,
  overrideMethods: 'all',
  indexFields: 'all'
});

// INFO: Si desea declarar los campos del esquema que no se tendrán en cuenta para la descripción general del modelo
// CompanySchema.methods.invalid_fields = ["field1", "field2"];

// INFO: Si desea implementar un metodo despues de guardar habilite el siguiente metodo
// CompanySchema.methods.postSave = (parameters) => {
// }


export const CompanyModel = mongoose.model<any, any>('Company', CompanySchema);
