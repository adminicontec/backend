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
  title_training: {type: Schema.Types.String},
  alliances: [
    {
      unique: {type: Schema.Types.String, require: true},
      status: {type: Schema.Types.Boolean, default: true},
      typeAgreement: {
        type: Schema.Types.String,
        enum: ['alliance','agreement'],
      },
      logoUrl: {type: Schema.Types.String},
      name: {type: Schema.Types.String},
      country: {type: Schema.Types.String},
      regional: {type: Schema.Types.String},
      creationYear: {type: Schema.Types.Date},
      programs: [
        { type: Schema.Types.String }
      ],
      webSite: {type: Schema.Types.String},
      contact: {type: Schema.Types.String},
      brochures: [
        {
          unique: {type: Schema.Types.String, require: true},
          file: {type: Schema.Types.String},
        }
      ]
    }
  ],
  trainings: [
    {
      unique: {type: Schema.Types.String, require: true},
      status: {type: Schema.Types.Boolean, default: true},
      course: {
        type: Schema.Types.ObjectId,
        ref: "Course",
      },
      title: {type: Schema.Types.String},
      description: {type: Schema.Types.String},
      attachedUrl: {type: Schema.Types.String},
      publication_date: {type: Schema.Types.Date},
      modality: {type: Schema.Types.String},
      city: {type: Schema.Types.String},
      start_date: {type: Schema.Types.Date},
      price: {
        type: Schema.Types.Number,
      },
      url_video: {
        type: Schema.Types.String
      },
      platform_video: {
        type: Schema.Types.String,
        enum: ['youtube', 'vimeo']
      }
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
  }],
  title_references: {type: Schema.Types.String},
  references: [{
    unique: {type: Schema.Types.String, require: true},
    title: {type: Schema.Types.String},
    description: {type: Schema.Types.String},
    url: {type: Schema.Types.String},
    qualification: {type: Schema.Types.String},
    client: {type: Schema.Types.String},
    created_at: {type: Schema.Types.Date},
    active: {type: Schema.Types.Boolean}
  }],
  title_posts: {type: Schema.Types.String},
  forums: {
    title: {type: Schema.Types.String},
    description: {type: Schema.Types.String}
  }
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
