// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
const { Schema } = mongoose;
// @end

const CourseSchema = new Schema({
  // @add_schema Add schema here
  schedulingMode: {
    type: Schema.Types.ObjectId,
    ref: "CourseSchedulingMode",
    required: true
  },
  program: {
    type: Schema.Types.ObjectId,
    ref: "Program",
    required: true
  },

  highlighted: {
    type: Schema.Types.Boolean
  },
  // moodleID: {
  //   type: Schema.Types.String,
  // },
  // name: {
  //   type: Schema.Types.String,
  //   required: true,
  // },
  // fullname: {
  //   type: Schema.Types.String,
  //   required: true,
  // },
  // displayname: {
  //   type: Schema.Types.String,
  //   required: false,
  // },
  description: {
    type: Schema.Types.String,
    required: true,
  },
  // courseType: {
  //   type: Schema.Types.String,
  //   required: false,
  // },
  // mode: {
  //   type: Schema.Types.ObjectId,
  //   ref: "CourseModeCategory",
  //   required: true
  // },
  // startDate: {
  //   type: Schema.Types.Date,
  //   required: true,
  // },
  // endDate: {
  //   type: Schema.Types.Date,
  //   required: true,
  // },
  // maxEnrollmentDate: {
  //   type: Schema.Types.Date,
  //   required: true,
  // },
  // hasCost: {
  //   type: Schema.Types.Boolean,
  //   default: false
  // },
  // priceCOP: {
  //   type: Schema.Types.Number,
  //   required: true,
  // },
  // priceUSD: {
  //   type: Schema.Types.Number,
  //   required: false,
  // },
  // discount: {
  //   type: Schema.Types.Number,
  //   required: false,
  // },
  // quota: {
  //   type: Schema.Types.Number,
  //   required: false,
  // },
  // lang: {
  //   type: Schema.Types.String,
  //   required: false,
  // },
  // duration: {
  //   type: Schema.Types.Number,
  //   required: false,
  // },
  coverUrl: {
    type: Schema.Types.String
  },
  competencies: {
    type: Schema.Types.Mixed,
    required: false,
  },
  objectives: {
    type: Schema.Types.Mixed,
    required: false,
  },
  content: [{
    uuid: {type: Schema.Types.String},
    category: {type: Schema.Types.String, default: 'Tema'},
    data: {type: Schema.Types.String},
    name: {type: Schema.Types.String}
  },],
  focus: {
    type: Schema.Types.Mixed,
    required: false,
  },
  materials: {
    type: Schema.Types.Mixed,
    required: false,
  },
  important_info: {
    type: Schema.Types.Mixed,
    required: false,
  },
  methodology: {
    type: Schema.Types.Mixed,
    required: false,
  },
  generalities: {
    type: Schema.Types.Mixed,
    required: false,
  }
  // benefits: {
  //   type: Schema.Types.Mixed,
  //   required: false,
  // },
  // @end
}, {
  collection: 'courses' ,timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// INFO: Para usar soft delete se debe invocar exactamente el metodo delete() o sus derivados en lugar de remove()
// Example: UserModel.delete({_id: id})
CourseSchema.plugin(mongoose_delete,{
  deletedAt : true,
  overrideMethods: 'all',
  indexFields: 'all'
});

// INFO: Si desea declarar los campos del esquema que no se tendrán en cuenta para la descripción general del modelo
// CourseSchema.methods.invalid_fields = ["field1", "field2"];

// INFO: Si desea implementar un metodo despues de guardar habilite el siguiente metodo
// CourseSchema.methods.postSave = (parameters) => {
// }


export const CourseModel = mongoose.model('Course', CourseSchema);
