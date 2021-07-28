// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
const { Schema } = mongoose;
// @end

const AcademicResourceSchema = new Schema({
  // @add_schema Add schema here
  title: { type: Schema.Types.String, required: true },
  description: { type: Schema.Types.String },
  academic_resource_category: {
    type: Schema.Types.ObjectId,
    ref: "AcademicResourceCategory",
    required: true,
  },
  config: {
    duration: { type: Schema.Types.Number },
    // survey_resource: {
    //   question_configuration: [{
    //     uuid: { type: Schema.Types.String },
    //     title: { type: Schema.Types.String },
    //     question_bank: {
    //       type: Schema.Types.ObjectId,
    //       ref: "QuestionBank"
    //     },
    //   }],
    // },
    questions: [{
      question: {
        type: Schema.Types.ObjectId,
        ref: "Question",
        required: true,
      },
      position: { type: Schema.Types.Number, default: 0 },
      value: { type: Schema.Types.Number, default: 0 },
    }],
  },
  // metadata: [
  //   {
  //     metadata: {
  //       type: Schema.Types.ObjectId,
  //       ref: "Metadata"
  //     },
  //     value: { type: Schema.Types.String },
  //   }
  // ],
  // tags: [ {
  //   type: Schema.Types.ObjectId,
  //   ref: "AcademicResourceTag"
  // } ],
  // incremental_code: { type: Schema.Types.Number },
  // @end
}, {
  collection: 'academic_resources' ,timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// INFO: Para usar soft delete se debe invocar exactamente el metodo delete() o sus derivados en lugar de remove()
// Example: UserModel.delete({_id: id})
AcademicResourceSchema.plugin(mongoose_delete,{
  deletedAt : true,
  overrideMethods: 'all',
  indexFields: 'all'
});

// INFO: Si desea declarar los campos del esquema que no se tendrán en cuenta para la descripción general del modelo
// AcademicResourceSchema.methods.invalid_fields = ["field1", "field2"];

// INFO: Si desea implementar un metodo despues de guardar habilite el siguiente metodo
// AcademicResourceSchema.methods.postSave = (parameters) => {
// }


export const AcademicResourceModel = mongoose.model<any, any>('AcademicResource', AcademicResourceSchema);
