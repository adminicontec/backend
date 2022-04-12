// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
const { Schema } = mongoose;
// @end

const DocumentQueueSchema = new Schema({
  // @add_schema Add schema here

  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  docPath: {
    type: Schema.Types.String,
    required: true
  },
  status: {
    type: Schema.Types.String,
    required: true,
    enum: ['New', 'In-process', 'Complete', 'Error']
  },
  type: {
    type: Schema.Types.String,
    required: true,
    enum: ['Qualified Teacher']
  },
  sendEmail:{
    type: Schema.Types.Boolean,
    required: true,
  },
  processLog: {
    type: Schema.Types.Mixed
  },
  errorLog: {
    type: Schema.Types.Mixed
  },
  processLogTutor: {
    type: Schema.Types.Mixed
  },
  errorLogTutor: {
    type: Schema.Types.Mixed
  },

  // @end
}, {
  collection: 'document_queues', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// INFO: Para usar soft delete se debe invocar exactamente el metodo delete() o sus derivados en lugar de remove()
// Example: UserModel.delete({_id: id})
DocumentQueueSchema.plugin(mongoose_delete, {
  deletedAt: true,
  overrideMethods: 'all',
  indexFields: 'all'
});

// INFO: Si desea declarar los campos del esquema que no se tendrán en cuenta para la descripción general del modelo
// DocumentQueueSchema.methods.invalid_fields = ["field1", "field2"];

// INFO: Si desea implementar un metodo despues de guardar habilite el siguiente metodo
// DocumentQueueSchema.methods.postSave = (parameters) => {
// }


export const DocumentQueueModel = mongoose.model<any, any>('DocumentQueue', DocumentQueueSchema);
