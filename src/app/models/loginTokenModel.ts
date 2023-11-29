// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
const { Schema } = mongoose;
// @end

const LoginTokenSchema = new Schema({
  // @add_schema Add schema here
  user_id:{
    type: Schema.Types.ObjectId,
    ref:"Users"
  },
  expedition_date:{
    type: Schema.Types.Date,
    required:true
  },
  token:{
    type:Schema.Types.String,
    required:true
  },
  token_type: { type: Schema.Types.String, default: 'external' },
  unique: {
    type:Schema.Types.String,
  },
  extraData: {
    type: Schema.Types.Mixed,
    required: false,
  },
  config: {}
  // @end
}, {
  collection: 'login_tokens' ,timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// INFO: Para usar soft delete se debe invocar exactamente el metodo delete() o sus derivados en lugar de remove()
// Example: UserModel.delete({_id: id})
// LoginTokenSchema.plugin(mongoose_delete,{
//   deletedAt : true,
//   overrideMethods: 'all',
//   indexFields: 'all'
// });

// INFO: Si desea declarar los campos del esquema que no se tendrán en cuenta para la descripción general del modelo
// LoginTokenSchema.methods.invalid_fields = ["field1", "field2"];

// INFO: Si desea implementar un metodo despues de guardar habilite el siguiente metodo
// LoginTokenSchema.methods.postSave = (parameters) => {
// }


export const LoginTokenModel = mongoose.model<any, any>('LoginToken', LoginTokenSchema);
