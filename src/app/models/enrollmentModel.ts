// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
const { Schema } = mongoose;
// @end

const EnrollmentSchema = new Schema({
  // @add_schema Add schema here
  user: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  course_scheduling: {
    type: Schema.Types.ObjectId,
    ref: 'CourseScheduling'
  },
  email: {
    type: Schema.Types.String,
    required: true,
  },
  firstname: {
    type: Schema.Types.String,
    required: true,
  },
  lastname: {
    type: Schema.Types.String,
    required: true,
  },
  documentType: {
    type: Schema.Types.String,
    required: false,
  },
  documentID: {
    type: Schema.Types.String,
    required: false,
  },
  courseID: {
    type: Schema.Types.String,
    required: true,
  },
  origin: {
    type: Schema.Types.String,
    required: false,
  }
  // @end
}, {
  collection: 'enrollments' ,timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// INFO: Para usar soft delete se debe invocar exactamente el metodo delete() o sus derivados en lugar de remove()
// Example: UserModel.delete({_id: id})
EnrollmentSchema.plugin(mongoose_delete,{
  deletedAt : true,
  overrideMethods: 'all',
  indexFields: 'all'
});

// INFO: Si desea declarar los campos del esquema que no se tendrán en cuenta para la descripción general del modelo
// EnrollmentSchema.methods.invalid_fields = ["field1", "field2"];

// INFO: Si desea implementar un metodo despues de guardar habilite el siguiente metodo
// EnrollmentSchema.methods.postSave = (parameters) => {
// }


export const EnrollmentModel = mongoose.model<any, any>('Enrollment', EnrollmentSchema);
