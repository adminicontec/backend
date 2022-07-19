// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
const { Schema } = mongoose;
// @end

const ConsolidatedSurveyInformationQuestionsRangeQuestionsSchema = new Schema({
  questionId: {
    type: Schema.Types.String,
  },
  questionAverage: {
    type: Schema.Types.Number,
    default: 0
  },
  totalAnswers: {
    type: Schema.Types.Number,
    default: 0
  },
  answers: {
    totalPoints: {
      type: Schema.Types.Number,
      default: 0
    },
    list: [
      {
        type: Schema.Types.String
      }
    ]
  }
}, {
  _id: false
})

const ConsolidatedSurveyInformationQuestionsRangeSchema = new Schema({
  sectionId: {
    type: Schema.Types.String,
  },
  averageSection: {
    type: Schema.Types.Number,
    default: 0
  },
  questions: [ConsolidatedSurveyInformationQuestionsRangeQuestionsSchema]
}, {
  _id: false
})


const ConsolidatedSurveyInformationQuestionsWithOptionsAnswersSchema = new Schema({
  unique: {
    type: Schema.Types.String,
  },
  totalAnswers: {
    type: Schema.Types.Number,
    default: 0
  },
  averageQuestion: {
    type: Schema.Types.Number,
    default: 0
  }
}, {
  _id: false
})

const ConsolidatedSurveyInformationQuestionsWithOptionsSchema = new Schema({
  questionId: {
    type: Schema.Types.String,
  },
  answers: [ConsolidatedSurveyInformationQuestionsWithOptionsAnswersSchema],
  totalAnswers: {
    type: Schema.Types.Number,
    default: 0
  }
}, {
  _id: false
})

const ConsolidatedSurveyInformationSchema = new Schema({
  // @add_schema Add schema here
  courseScheduling: {
    type: Schema.Types.ObjectId,
    ref: "CourseScheduling",
    required: true
  },
  courseSchedulingDetail: {
    type: Schema.Types.ObjectId,
    ref: "CourseSchedulingDetails",
  },
  isVirtual: {
    type: Schema.Types.Boolean,
    default: false
  },
  totalSurvey: {
    type: Schema.Types.Number,
    default: 0
  },
  teacher: {
    type: Schema.Types.String,
  },
  questionsRange: [ConsolidatedSurveyInformationQuestionsRangeSchema],
  questionsRangeAverage: {
    type: Schema.Types.Number,
    default: 0
  },
  questionsWithOptions: [ConsolidatedSurveyInformationQuestionsWithOptionsSchema]
  // @end
}, {
  collection: 'consolidated_survey_informations' ,timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// INFO: Para usar soft delete se debe invocar exactamente el metodo delete() o sus derivados en lugar de remove()
// Example: UserModel.delete({_id: id})
ConsolidatedSurveyInformationSchema.plugin(mongoose_delete,{
  deletedAt : true,
  overrideMethods: 'all',
  indexFields: 'all'
});

// INFO: Si desea declarar los campos del esquema que no se tendrán en cuenta para la descripción general del modelo
// ConsolidatedSurveyInformationSchema.methods.invalid_fields = ["field1", "field2"];

// INFO: Si desea implementar un metodo despues de guardar habilite el siguiente metodo
// ConsolidatedSurveyInformationSchema.methods.postSave = (parameters) => {
// }


export const ConsolidatedSurveyInformationModel = mongoose.model<any, any>('ConsolidatedSurveyInformation', ConsolidatedSurveyInformationSchema);
