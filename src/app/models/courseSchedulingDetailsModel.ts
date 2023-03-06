// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
const { Schema } = mongoose;
// @end

const CourseSchedulingDetailsSchema = new Schema({
  // @add_schema Add schema here
  course_scheduling: {
    type: Schema.Types.ObjectId,
    ref: "CourseScheduling",
    required: true
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: "CourseSchedulingSection",
    required: true
  },
  schedulingMode: {
    type: Schema.Types.ObjectId,
    ref: "CourseSchedulingMode",
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
  number_of_sessions: {
    type: Schema.Types.Number,
  },
  duration: {type: Schema.Types.Number},
  sessions: [{
    reinforcement_class: {
      type: Schema.Types.Boolean,
      default: false
    },
    startDate: {
      type: Schema.Types.Date,
      required: true,
    },
    duration: {
      type: Schema.Types.Number,
      required: true,
    },
    moodle_id: { type: Schema.Types.String }
  }],
  observations: {
    type: Schema.Types.String
  }
  // @end
}, {
  collection: 'course_scheduling_details' ,timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// INFO: Para usar soft delete se debe invocar exactamente el metodo delete() o sus derivados en lugar de remove()
// Example: UserModel.delete({_id: id})
CourseSchedulingDetailsSchema.plugin(mongoose_delete,{
  deletedAt : true,
  overrideMethods: 'all',
  indexFields: 'all'
});

// INFO: Si desea declarar los campos del esquema que no se tendrán en cuenta para la descripción general del modelo
// CourseSchedulingDetailsSchema.methods.invalid_fields = ["field1", "field2"];

// INFO: Si desea implementar un metodo despues de guardar habilite el siguiente metodo
// CourseSchedulingDetailsSchema.methods.postSave = (parameters) => {
// }


export const CourseSchedulingDetailsModel = mongoose.model<any, any>('CourseSchedulingDetails', CourseSchedulingDetailsSchema);
