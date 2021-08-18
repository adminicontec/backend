// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
const { Schema } = mongoose;
// @end

const PostSchema = new Schema({
  // @add_schema Add schema here
  title: {
    type: Schema.Types.String,
    required: true,
  },
  subtitle: {
    type: Schema.Types.String
  },
  content: {
    type: Schema.Types.Mixed,
  },
  coverUrl: {
    type: Schema.Types.String
  },
  postDate: {
    type: Schema.Types.Date,
  },
  eventDate: {
    type: Schema.Types.Date
  },
  lifeSpan: {
    type: Schema.Types.Number
  },
  highlighted: {
    type: Schema.Types.Boolean
  },
  isActive: {
    type: Schema.Types.Boolean,
    default: true,
  },
  startDate: {
    type: Schema.Types.Date
  },
  endDate: {
    type: Schema.Types.Date
  },
  externUrl: {
    type: Schema.Types.String
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  postType: {
    type: Schema.Types.ObjectId,
    ref: "PostType"
  },
  tags: [
    {
      type: Schema.Types.ObjectId,
      ref: "PostCategory"
    }
  ],
  authors: [
    {
      type: Schema.Types.String,
    }
  ],
  locations: [
    {
      postLocation: {
        type: Schema.Types.ObjectId,
        ref: "PostLocation"
      },
      viewCounter: {
        type: Schema.Types.Number,
        default: 0
      }
    }
  ],
  video: {
    url: {
      type: Schema.Types.String
    },
    platform: {
      type: Schema.Types.String,
      enum: ['youtube', 'vimeo']
    }
  }
  // @end
}, {
  collection: 'posts' ,timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// INFO: Para usar soft delete se debe invocar exactamente el metodo delete() o sus derivados en lugar de remove()
// Example: UserModel.delete({_id: id})
PostSchema.plugin(mongoose_delete,{
  deletedAt : true,
  overrideMethods: 'all',
  indexFields: 'all'
});

// INFO: Si desea declarar los campos del esquema que no se tendrán en cuenta para la descripción general del modelo
// PostSchema.methods.invalid_fields = ["field1", "field2"];

// INFO: Si desea implementar un metodo despues de guardar habilite el siguiente metodo
// PostSchema.methods.postSave = (parameters) => {
// }


export const PostModel = mongoose.model('Post', PostSchema);
