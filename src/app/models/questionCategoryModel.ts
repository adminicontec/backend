// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
const { Schema } = mongoose;
// @end

const QuestionCategorySchema = new Schema({
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
    has_order_of_answers: {type: Schema.Types.Boolean},
    has_min_length: {type: Schema.Types.Boolean},
    has_max_length: {type: Schema.Types.Boolean},

    has_equal_value: {type: Schema.Types.Boolean},  // Todas las respuestas tienen el mismo valor en la pregunta
    has_min_checked: {type: Schema.Types.Boolean},  // Numero mínimo de casillas que se deben marcar para pasar de pregunta
    has_max_checked: {type: Schema.Types.Boolean},  // Numero máximo de casillas que se deben marcar para pasar de pregunta
    has_type_input: {type: Schema.Types.Boolean},   // Tipo del input (text, date, ...)
  },
  // @end
}, {
  collection: 'question_categories' ,timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// INFO: Para usar soft delete se debe invocar exactamente el metodo delete() o sus derivados en lugar de remove()
// Example: UserModel.delete({_id: id})
QuestionCategorySchema.plugin(mongoose_delete,{
  deletedAt : true,
  overrideMethods: 'all',
  indexFields: 'all'
});

// INFO: Si desea declarar los campos del esquema que no se tendrán en cuenta para la descripción general del modelo
// QuestionCategorySchema.methods.invalid_fields = ["field1", "field2"];

// INFO: Si desea implementar un metodo despues de guardar habilite el siguiente metodo
// QuestionCategorySchema.methods.postSave = (parameters) => {
// }


export const QuestionCategoryModel = mongoose.model<any, any>('QuestionCategory', QuestionCategorySchema);
