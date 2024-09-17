// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
import { TRANSACTION_STATUSES, TransactionStatus } from "@scnode_app/types/default/admin/transaction/transactionTypes";
const { Schema } = mongoose;
// @end

const TransactionSchema = new Schema({
  // @add_schema Add schema here
  status: {
    type: Schema.Types.String,
    enum: TRANSACTION_STATUSES,
    default: TransactionStatus.IN_PROCESS,
  },
  certificateQueue: {
    type: Schema.Types.ObjectId,
    ref: 'CertificateQueue'
  },
  paymentId: {
    type: Schema.Types.String,
  },
  redirectUrl: {
    type: Schema.Types.String,
  }
  // @end
}, {
  collection: 'transactions' ,timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// INFO: Para usar soft delete se debe invocar exactamente el metodo delete() o sus derivados en lugar de remove()
// Example: UserModel.delete({_id: id})
TransactionSchema.plugin(mongoose_delete,{
  deletedAt : true,
  overrideMethods: 'all',
  indexFields: 'all'
});

// INFO: Si desea declarar los campos del esquema que no se tendrán en cuenta para la descripción general del modelo
// TransactionSchema.methods.invalid_fields = ["field1", "field2"];

// INFO: Si desea implementar un metodo despues de guardar habilite el siguiente metodo
// TransactionSchema.methods.postSave = (parameters) => {
// }


export const TransactionModel = mongoose.model<any, any>('Transaction', TransactionSchema);
