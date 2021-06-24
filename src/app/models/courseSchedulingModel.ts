// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
const { Schema } = mongoose;
// @end

const CourseSchedulingSchema = new Schema({
  // @add_schema Add schema here
  schedulingStatus: {
    type: Schema.Types.ObjectId,
    ref: "CourseSchedulingStatus",
    required: true
  },
  modular: {
    type: Schema.Types.ObjectId,
    ref: "Modular",
  },
  schedulingCode: {
    type: Schema.Types.String,
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
  schedulingMode: {
    type: Schema.Types.ObjectId,
    ref: "CourseSchedulingMode",
    required: true
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: "Course",
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
  teacher: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  regional: {
    type: Schema.Types.ObjectId,
    ref: "Regional",
    required: true
  },
  city: {
    type: Schema.Types.ObjectId,
    ref: "City",
    required: true
  },
  amountParticipants: {
    type: Schema.Types.Number,
    default: 0
  },
  observations: {
    type: Schema.Types.String,
  },
  duration: {type: Schema.Types.Number},
  sessions: [{
    startDate: {
      type: Schema.Types.Date,
      required: true,
    },
    duration: {
      type: Schema.Types.Number,
      required: true,
    }
  }]
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
