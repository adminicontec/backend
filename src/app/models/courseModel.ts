// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
const { Schema } = mongoose;
// @end

const CourseSchema = new Schema({
  // @add_schema Add schema here
  name: {
    type: Schema.Types.String,
    required: true,
  },
  fullname: {
    type: Schema.Types.String,
    required: true,
  },
  displayname: {
    type: Schema.Types.String,
    required: false,
  },
  description: {
    type: Schema.Types.String,
    required: true,
  },
  courseType: {
    type: Schema.Types.String,
    required: false,
  },
  mode: {
    type: Schema.Types.String,
    required: false,
  },
  startDate: {
    type: Schema.Types.Date,
    required: true,
  },
  endDate: {
    type: Schema.Types.Date,
    required: true,
  },
  maxEnrollmentDate: {
    type: Schema.Types.Date,
    required: true,
  },
  priceCOP: {
    type: Schema.Types.Number,
    required: true,
  },
  priceUSD: {
    type: Schema.Types.Number,
    required: false,
  },
  discount: {
    type: Schema.Types.Number,
    required: false,
  },
  quota: {
    type: Schema.Types.Number,
    required: false,
  },
  lang: {
    type: Schema.Types.String,
    required: false,
  },
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
