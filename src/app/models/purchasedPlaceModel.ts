// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
const { Schema } = mongoose;
// @end

export enum PurchasedPlaceStatus {
  AVAILABLE = 'available',
  ASSIGNED = 'assigned',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

const PurchasedPlaceSchema = new Schema({
  // @add_schema Add schema here
  transaction: {
    type: Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true,
  },
  buyer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  courseScheduling: {
    type: Schema.Types.ObjectId,
    ref: 'CourseScheduling',
    required: true,
  },
  programCode: {
    type: Schema.Types.String,
    required: true,
  },
  programName: {
    type: Schema.Types.String,
    required: true,
  },
  status: {
    type: Schema.Types.String,
    enum: Object.values(PurchasedPlaceStatus),
    default: PurchasedPlaceStatus.AVAILABLE,
  },
  enrollment: {
    type: Schema.Types.ObjectId,
    ref: 'Enrollment',
    required: false,
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  assignedAt: {
    type: Schema.Types.Date,
    required: false,
  },
  expiresAt: {
    type: Schema.Types.Date,
    required: false,
  },
  metadata: {
    type: Schema.Types.Mixed,
    required: false,
  },
  // @end
}, {
  collection: 'purchased_places', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// INFO: Para usar soft delete se debe invocar exactamente el metodo delete() o sus derivados en lugar de remove()
PurchasedPlaceSchema.plugin(mongoose_delete, {
  deletedAt: true,
  overrideMethods: 'all',
  indexFields: 'all'
});

export const PurchasedPlaceModel = mongoose.model<any, any>('PurchasedPlace', PurchasedPlaceSchema);