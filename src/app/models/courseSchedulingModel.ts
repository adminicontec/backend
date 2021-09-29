// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
const { Schema } = mongoose;
// @end

const CourseSchedulingSchema = new Schema({
  // @add_schema Add schema here
  metadata: {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    service_id: {
      type: Schema.Types.String,
      require: true
    },
    date: {
      type: Schema.Types.String,
      require: true
    },
    year: {
      type: Schema.Types.String,
      require: true
    }
  },
  schedulingMode: {
    type: Schema.Types.ObjectId,
    ref: "CourseSchedulingMode",
    required: true
  },
  modular: {
    type: Schema.Types.ObjectId,
    ref: "Modular",
  },
  program: {
    type: Schema.Types.ObjectId,
    ref: "Program",
    required: true
  },
  schedulingType: {
    type: Schema.Types.ObjectId,
    ref: "CourseSchedulingType",
    required: true
  },
  schedulingStatus: {
    type: Schema.Types.ObjectId,
    ref: "CourseSchedulingStatus",
    required: true
  },
  startDate: {
    type: Schema.Types.Date,
    required: true,
  },
  endDate: {
    type: Schema.Types.Date,
    required: true,
  },
  regional: {
    type: Schema.Types.ObjectId,
    ref: "Regional",
    required: false
  },
  regional_transversal: {
    type: Schema.Types.String,
    required: false
  },
  city: {
    type: Schema.Types.ObjectId,
    ref: "City",
    required: false
  },
  country: {
    type: Schema.Types.ObjectId,
    ref: "Country"
  },
  amountParticipants: {
    type: Schema.Types.Number,
    default: 0
  },
  observations: {
    type: Schema.Types.String,
  },
  client: {
    type: Schema.Types.String,
  },
  duration: {type: Schema.Types.Number},
  in_design: {
    type: Schema.Types.Boolean,
    default: false
  },
  moodle_id: { type: Schema.Types.String },
  // schedulingCode: {
  //   type: Schema.Types.String,
  // },
  hasCost: {
    type: Schema.Types.Boolean,
    default: false
  },
  priceCOP: {
    type: Schema.Types.Number,
  },
  priceUSD: {
    type: Schema.Types.Number,
  },
  discount: {
    type: Schema.Types.Number,
  },
  endDiscountDate: {
    type: Schema.Types.Date,
    required: false,
  },
  startPublicationDate: {
    type: Schema.Types.Date,
  },
  endPublicationDate: {
    type: Schema.Types.Date,
  },
  enrollmentDeadline: {
    type: Schema.Types.Date,
  },
  // @end
}, {
  collection: 'course_schedulings' ,timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// INFO: Para usar soft delete se debe invocar exactamente el metodo delete() o sus derivados en lugar de remove()
// Example: UserModel.delete({_id: id})
CourseSchedulingSchema.plugin(mongoose_delete,{
  deletedAt : true,
  overrideMethods: 'all',
  indexFields: 'all'
});

// INFO: Si desea declarar los campos del esquema que no se tendrán en cuenta para la descripción general del modelo
// CourseSchedulingSchema.methods.invalid_fields = ["field1", "field2"];

// INFO: Si desea implementar un metodo despues de guardar habilite el siguiente metodo
// CourseSchedulingSchema.methods.postSave = (parameters) => {
// }


export const CourseSchedulingModel = mongoose.model<any, any>('CourseScheduling', CourseSchedulingSchema);
