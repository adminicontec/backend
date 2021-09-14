// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
const { Schema } = mongoose;
// @end

const TeacherProfileSchema = new Schema({
  // @add_schema Add schema here
  username: {
    type: Schema.Types.ObjectId,
      ref: "User"
  },
  regional: {
    type: Schema.Types.String,
    required: true,
  },
  location: {
    type: Schema.Types.String,
    required: true,
  },
  contractType: {
    type: {
      type: Schema.Types.String
    },
    isTeacher: {
      type: Schema.Types.Boolean
    },
    isTutor: {
      type: Schema.Types.Boolean
    },
  }

  // @end
}, {
  collection: 'teacher_profiles' ,timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// INFO: Para usar soft delete se debe invocar exactamente el metodo delete() o sus derivados en lugar de remove()
// Example: UserModel.delete({_id: id})
TeacherProfileSchema.plugin(mongoose_delete,{
  deletedAt : true,
  overrideMethods: 'all',
  indexFields: 'all'
});

// INFO: Si desea declarar los campos del esquema que no se tendrán en cuenta para la descripción general del modelo
// TeacherProfileSchema.methods.invalid_fields = ["field1", "field2"];

// INFO: Si desea implementar un metodo despues de guardar habilite el siguiente metodo
// TeacherProfileSchema.methods.postSave = (parameters) => {
// }


export const TeacherProfileModel = mongoose.model<any, any>('TeacherProfile', TeacherProfileSchema);
