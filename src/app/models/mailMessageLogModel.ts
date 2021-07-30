// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
const { Schema } = mongoose;
// @end

const MailMessageLogSchema = new Schema({
  // @add_schema Add schema here
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  email: {type: Schema.Types.String},
  subject: {type: Schema.Types.String},
  notification_source: {type: Schema.Types.String},
  // @end
}, {
  collection: 'mail_message_logs' ,timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// INFO: Para usar soft delete se debe invocar exactamente el metodo delete() o sus derivados en lugar de remove()
// Example: UserModel.delete({_id: id})
MailMessageLogSchema.plugin(mongoose_delete,{
  deletedAt : true,
  overrideMethods: 'all',
  indexFields: 'all'
});

// INFO: Si desea declarar los campos del esquema que no se tendrán en cuenta para la descripción general del modelo
// MailMessageLogSchema.methods.invalid_fields = ["field1", "field2"];

// INFO: Si desea implementar un metodo despues de guardar habilite el siguiente metodo
// MailMessageLogSchema.methods.postSave = (parameters) => {
// }


export const MailMessageLogModel = mongoose.model<any, any>('MailMessageLog', MailMessageLogSchema);
