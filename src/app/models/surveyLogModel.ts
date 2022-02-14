// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
const { Schema } = mongoose;
// @end

const SurveyLogSchema = new Schema({
  // @add_schema Add schema here
  course_scheduling: {
    type: Schema.Types.ObjectId,
    ref: 'CourseScheduling',
    required: true
  },
  course_scheduling_details: {
    type: Schema.Types.ObjectId,
    ref: 'CourseSchedulingDetails'
  }
  // @end
}, {
  collection: 'survey_logs' ,timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// INFO: Para usar soft delete se debe invocar exactamente el metodo delete() o sus derivados en lugar de remove()
// Example: UserModel.delete({_id: id})
SurveyLogSchema.plugin(mongoose_delete,{
  deletedAt : true,
  overrideMethods: 'all',
  indexFields: 'all'
});

// INFO: Si desea declarar los campos del esquema que no se tendrán en cuenta para la descripción general del modelo
// SurveyLogSchema.methods.invalid_fields = ["field1", "field2"];

// INFO: Si desea implementar un metodo despues de guardar habilite el siguiente metodo
// SurveyLogSchema.methods.postSave = (parameters) => {
// }


export const SurveyLogModel = mongoose.model<any, any>('SurveyLog', SurveyLogSchema);
