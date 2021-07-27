// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
const { Schema } = mongoose;
// @end

const QuestionSchema = new Schema({
  // @add_schema Add schema here
  content: { type: Schema.Types.String, required: true },
  question_category: {
    type: Schema.Types.ObjectId,
    ref: "QuestionCategory",
    required: true,
  },
  // level: { type: Schema.Types.Number },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  config: {
    order_of_answers: {
      type: Schema.Types.String,
      default: 'ordered',
      enum: [ 'ordered', 'random' ]
    },
    min_length: {
      type: Schema.Types.Number
    },
    max_length: {
      type: Schema.Types.Number
    },
    equal_value: {
      type: Schema.Types.Boolean
    },
    min_checked: {
      type: Schema.Types.Number
    },
    max_checked: {
      type: Schema.Types.Number
    },
    type_input: {
      type: Schema.Types.String,
      default: 'text',
      enum: [ 'text', 'input', 'date', 'number', 'tiny' ]
    }
  },
  answers: [ {
    unique: { type: Schema.Types.String, required: true },
    content: { type: Schema.Types.String },
    feedback: { type: Schema.Types.String },
    value: { type: Schema.Types.Number },
    is_correct: { type: Schema.Types.Boolean, default: false },
    config: {
      is_required: {type: Schema.Types.Boolean}
    }
  } ],
  parent: {
    type: Schema.Types.ObjectId,
    ref: "Question"
  },
  // tags: [ {
  //   type: Schema.Types.ObjectId,
  //   ref: "QuestionTag"
  // } ],
  // metadata: [
  //   {
  //     metadata: {
  //       type: Schema.Types.ObjectId,
  //       ref: "Metadata"
  //     },
  //     value: { type: Schema.Types.String },
  //   }
  // ],
  incremental_code: { type: Schema.Types.Number },
  // @end
}, {
  collection: 'questions' ,timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// INFO: Para usar soft delete se debe invocar exactamente el metodo delete() o sus derivados en lugar de remove()
// Example: UserModel.delete({_id: id})
QuestionSchema.plugin(mongoose_delete,{
  deletedAt : true,
  overrideMethods: 'all',
  indexFields: 'all'
});

// INFO: Si desea declarar los campos del esquema que no se tendrán en cuenta para la descripción general del modelo
// QuestionSchema.methods.invalid_fields = ["field1", "field2"];

// INFO: Si desea implementar un metodo despues de guardar habilite el siguiente metodo
// QuestionSchema.methods.postSave = (parameters) => {
// }


export const QuestionModel = mongoose.model<any, any>('Question', QuestionSchema);
