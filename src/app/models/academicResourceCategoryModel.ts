// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
const { Schema } = mongoose;
// @end

const AcademicResourceCategorySchema = new Schema({
  // @add_schema Add schema here
  name: {
    type: Schema.Types.String,
    required: true,
  },
  description: {
    type: Schema.Types.String,
    required: true,
  },
  config: {
    has_questions: { type: Schema.Types.Boolean },
    // has_max_attemps: {type: Schema.Types.Boolean},
    // has_availability_range: {type: Schema.Types.Boolean},
    // has_show_results: {type: Schema.Types.Boolean},
    // has_continue_exercise: {type: Schema.Types.Boolean},
    has_order_of_questions: {type: Schema.Types.Boolean},
    has_course_modes: {type: Schema.Types.Boolean},
    has_is_characterization_survey: {type: Schema.Types.Boolean},
    // has_time_limit: {type: Schema.Types.Boolean},

    //@INFO: Utilizado para definir tipos de preguntas admitidas
    allowed_question_categories: [{
      type: Schema.Types.ObjectId,
      ref: 'QuestionCategory',
    }],

  }
  // @end
}, {
  collection: 'academic_resource_categories' ,timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// INFO: Para usar soft delete se debe invocar exactamente el metodo delete() o sus derivados en lugar de remove()
// Example: UserModel.delete({_id: id})
AcademicResourceCategorySchema.plugin(mongoose_delete,{
  deletedAt : true,
  overrideMethods: 'all',
  indexFields: 'all'
});

// INFO: Si desea declarar los campos del esquema que no se tendrán en cuenta para la descripción general del modelo
// AcademicResourceCategorySchema.methods.invalid_fields = ["field1", "field2"];

// INFO: Si desea implementar un metodo despues de guardar habilite el siguiente metodo
// AcademicResourceCategorySchema.methods.postSave = (parameters) => {
// }


export const AcademicResourceCategoryModel = mongoose.model<any, any>('AcademicResourceCategory', AcademicResourceCategorySchema);
