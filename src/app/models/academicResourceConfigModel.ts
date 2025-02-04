// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
const { Schema } = mongoose;
// @end

const AcademicResourceConfigSchema = new Schema({
  // @add_schema Add schema here
  academic_resource: {
    type: Schema.Types.ObjectId,
    ref: "AcademicResource",
    required: true,
  },
  source: {
    config_category: {
      type: Schema.Types.ObjectId,
      ref: "AcademicResourceConfigCategory",
      required: true,
    },
  },
  config: {
    order_of_questions: {
      type: Schema.Types.String,
      default: 'ordered',
      enum: ['ordered', 'random']
    },
    course_modes: {
      type: Schema.Types.Mixed,
      ref: "CourseSchedulingMode",
    },
    is_characterization_survey: {
      type: Schema.Types.Boolean,
      default: false
    },
    course_type: {
      type: Schema.Types.String
    },
    course_modes_mixed: {
      type: Schema.Types.String,
    }
  },
  // @end
}, {
  collection: 'academic_resource_configs' ,timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, strictPopulate: false
});

// INFO: Para usar soft delete se debe invocar exactamente el metodo delete() o sus derivados en lugar de remove()
// Example: UserModel.delete({_id: id})
AcademicResourceConfigSchema.plugin(mongoose_delete,{
  deletedAt : true,
  overrideMethods: 'all',
  indexFields: 'all'
});

// INFO: Si desea declarar los campos del esquema que no se tendrán en cuenta para la descripción general del modelo
// AcademicResourceConfigSchema.methods.invalid_fields = ["field1", "field2"];

// INFO: Si desea implementar un metodo despues de guardar habilite el siguiente metodo
// AcademicResourceConfigSchema.methods.postSave = (parameters) => {
// }


export const AcademicResourceConfigModel = mongoose.model<any, any>('AcademicResourceConfig', AcademicResourceConfigSchema);
