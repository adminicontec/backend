// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
const { Schema } = mongoose;
// @end

const LandingSchema = new Schema({
  // @add_schema Add schema here
  slug: {type: Schema.Types.String, required: true},
  title_page: {type: Schema.Types.String},
  article: {
    coverUrl: {type: Schema.Types.String},
    coverCaption: {type: Schema.Types.String},
    title: {type: Schema.Types.String},
    content: {type: Schema.Types.Mixed},
  },
  trainings: [
    {
      unique: {type: Schema.Types.String, require: true},
      status: {type: Schema.Types.Boolean, default: true},
      title: {type: Schema.Types.String},
      description: {type: Schema.Types.String},
      attachedUrl: {type: Schema.Types.String},
      publication_date: {type: Schema.Types.Date},
    }
  ],
  scheduling: [
    {
      unique: {type: Schema.Types.String, require: true},
      title: {type: Schema.Types.String},
      attachedUrl: {type: Schema.Types.String},
    }
  ],
  descriptive_training: {
    image: {type: Schema.Types.String},
    title: {type: Schema.Types.String},
    content: {type: Schema.Types.Mixed}
  },
  our_clients: [{
    unique: {type: Schema.Types.String, require: true},
    title: {type: Schema.Types.String},
    url: {type: Schema.Types.String}
  }]
  // @end
}, {
  collection: 'landings' ,timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// INFO: Para usar soft delete se debe invocar exactamente el metodo delete() o sus derivados en lugar de remove()
// Example: UserModel.delete({_id: id})
LandingSchema.plugin(mongoose_delete,{
  deletedAt : true,
  overrideMethods: 'all',
  indexFields: 'all'
});

// INFO: Si desea declarar los campos del esquema que no se tendrán en cuenta para la descripción general del modelo
// LandingSchema.methods.invalid_fields = ["field1", "field2"];

// INFO: Si desea implementar un metodo despues de guardar habilite el siguiente metodo
// LandingSchema.methods.postSave = (parameters) => {
// }


export const LandingModel = mongoose.model<any, any>('Landing', LandingSchema);
