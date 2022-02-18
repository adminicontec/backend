// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
const { Schema } = mongoose;
// @end

const QualifiedTeachersSchema = new Schema({
  // @add_schema Add schema here
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  modular: {
    type: Schema.Types.ObjectId,
    ref: "Modulars",
    required: true,
  },
  courseCode: {
    type: Schema.Types.String,
    required: true,
  },
  status: {
    type: Schema.Types.String,
    enum: ['active', 'inactive'],
    default: 'active',
    required: true,
  },
  courseName: {
    type: Schema.Types.String,
    required: true,
  },
  evaluationDate: {
    type: Schema.Types.Date,
  },
  observations: {
    type: Schema.Types.String,
  },
  isEnabled: {
    type: Schema.Types.Boolean,
    required: true,
  },

  // @end
}, {
  collection: 'qualified_teachers', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// INFO: Para usar soft delete se debe invocar exactamente el metodo delete() o sus derivados en lugar de remove()
// Example: UserModel.delete({_id: id})
QualifiedTeachersSchema.plugin(mongoose_delete, {
  deletedAt: true,
  overrideMethods: 'all',
  indexFields: 'all'
});

// INFO: Si desea declarar los campos del esquema que no se tendrán en cuenta para la descripción general del modelo
// QualifiedTeachersSchema.methods.invalid_fields = ["field1", "field2"];

// INFO: Si desea implementar un metodo despues de guardar habilite el siguiente metodo
// QualifiedTeachersSchema.methods.postSave = (parameters) => {
// }


export const QualifiedTeachersModel = mongoose.model<any, any>('QualifiedTeachers', QualifiedTeachersSchema);
