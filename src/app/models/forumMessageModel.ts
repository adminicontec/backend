// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
const { Schema } = mongoose;
// @end

const ForumMessageSchema = new Schema({
  // @add_schema Add schema here
  forum: {
    type: Schema.Types.ObjectId,
    ref: "Forum",
    required: true,
  },
  message: {
    text: {type: Schema.Types.String},
    attached: {type: Schema.Types.String},
    date: {type: Schema.Types.Date}
  },
  posted_by: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // @end
}, {
  collection: 'forum_messages' ,timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// INFO: Para usar soft delete se debe invocar exactamente el metodo delete() o sus derivados en lugar de remove()
// Example: UserModel.delete({_id: id})
ForumMessageSchema.plugin(mongoose_delete,{
  deletedAt : true,
  overrideMethods: 'all',
  indexFields: 'all'
});

// INFO: Si desea declarar los campos del esquema que no se tendrán en cuenta para la descripción general del modelo
// ForumMessageSchema.methods.invalid_fields = ["field1", "field2"];

// INFO: Si desea implementar un metodo despues de guardar habilite el siguiente metodo
// ForumMessageSchema.methods.postSave = (parameters) => {
// }


export const ForumMessageModel = mongoose.model('ForumMessage', ForumMessageSchema);
