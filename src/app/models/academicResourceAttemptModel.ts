// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
const { Schema } = mongoose;
// @end

const AcademicResourceAttemptSchema = new Schema({
  // @add_schema Add schema here
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  academic_resource_config: {
    type: Schema.Types.ObjectId,
    ref: "AcademicResourceConfig",
    required: true,
  },
  enable: {
    type: Schema.Types.Boolean,
    default: true
  },
  results: {
    status: {
      type: Schema.Types.String,
        enum: ['started', 'ended', 'loop'],
        default: 'started'
    },
    qualification: {
      status: {
        type: Schema.Types.String,
        enum: ['qualified', 'pending'],
        default: 'pending'
      },
      date: { type: Schema.Types.Date },
      score: { type: Schema.Types.String },
    },
    questionsToEvaluate: [
      {
        type: Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
    questionsByConfiguration: { type: Schema.Types.Mixed },
    score: { type: Schema.Types.String },
    score_date: { type: Schema.Types.Date },
    time_taken: { type: Schema.Types.Number, default: 0 },
    statistics: [{
      question: {
        type: Schema.Types.ObjectId,
        ref: "Question",
      },
      answer: Schema.Types.Mixed,
      status: {
        type: Schema.Types.String,
        enum: ['correct', 'incorrect', 'not_answered']
      },
      evaluation_date: { type: Schema.Types.Date },
      answer_label: { type: Schema.Types.String }
    }],
    deliverable: {
      type: Schema.Types.Mixed,
    },
    deliverable_date: { type: Schema.Types.Date },
    files: [{
      filename: {type: Schema.Types.String},
      name: {type: Schema.Types.String}
    }]
  }
  // @end
}, {
  collection: 'academic_resource_attempts' ,timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// INFO: Para usar soft delete se debe invocar exactamente el metodo delete() o sus derivados en lugar de remove()
// Example: UserModel.delete({_id: id})
AcademicResourceAttemptSchema.plugin(mongoose_delete,{
  deletedAt : true,
  overrideMethods: 'all',
  indexFields: 'all'
});

// INFO: Si desea declarar los campos del esquema que no se tendrán en cuenta para la descripción general del modelo
// AcademicResourceAttemptSchema.methods.invalid_fields = ["field1", "field2"];

// INFO: Si desea implementar un metodo despues de guardar habilite el siguiente metodo
// AcademicResourceAttemptSchema.methods.postSave = (parameters) => {
// }


export const AcademicResourceAttemptModel = mongoose.model<any, any>('AcademicResourceAttempt', AcademicResourceAttemptSchema);
