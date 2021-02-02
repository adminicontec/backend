// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
const { Schema } = mongoose;
// @end

const ForumSchema = new Schema({
  // @add_schema Add schema here
  title: {type: Schema.Types.String},
  description: {type: Schema.Types.String},
  coverUrl: {
    type: Schema.Types.String
  },
  postDate: {
    type: Schema.Types.Date,
  },
  isActive: {
    type: Schema.Types.Boolean,
    default: true,
  },
  tags: [
    {
      type: Schema.Types.ObjectId,
      ref: "ForumCategory"
    }
  ],
  locations: [
    {
      forumLocation: {
        type: Schema.Types.ObjectId,
        ref: "ForumLocation"
      },
      viewCounter: {
        type: Schema.Types.Number,
        default: 0
      }
    }
  ]
  // @end
}, {
  collection: 'forums' ,timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// INFO: Para usar soft delete se debe invocar exactamente el metodo delete() o sus derivados en lugar de remove()
// Example: UserModel.delete({_id: id})
ForumSchema.plugin(mongoose_delete,{
  deletedAt : true,
  overrideMethods: 'all',
  indexFields: 'all'
});

// INFO: Si desea declarar los campos del esquema que no se tendrán en cuenta para la descripción general del modelo
// ForumSchema.methods.invalid_fields = ["field1", "field2"];

// INFO: Si desea implementar un metodo despues de guardar habilite el siguiente metodo
// ForumSchema.methods.postSave = (parameters) => {
// }


export const ForumModel = mongoose.model('Forum', ForumSchema);
