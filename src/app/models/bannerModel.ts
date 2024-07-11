// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
const { Schema } = mongoose;
// @end

const BannerSchema = new Schema({
  // @add_schema Add schema here
  title: {
    type: Schema.Types.String,
    required: true,
  },
  content: {
    type: Schema.Types.String
  },
  coverUrl: {
    type: Schema.Types.String
  },
  isActive: {
    type: Schema.Types.Boolean,
    default: true,
  },
  // location: {
  //   type: Schema.Types.String,
  //   enum: ['students', null],
  // },
  locations: [
    {
      type: Schema.Types.String,
      enum: ['student_landing','guest']
    }
  ],
  action: {
    type: Schema.Types.String,
  },
  actionText: {
    type: Schema.Types.String,
  },
  registerUrl: {
    type: Schema.Types.String,
  },
  start_date: {
    type: Schema.Types.Date
  },
  end_date: {
    type: Schema.Types.Date
  }
  // @end
}, {
  collection: 'banners' ,timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// INFO: Para usar soft delete se debe invocar exactamente el metodo delete() o sus derivados en lugar de remove()
// Example: UserModel.delete({_id: id})
BannerSchema.plugin(mongoose_delete,{
  deletedAt : true,
  overrideMethods: 'all',
  indexFields: 'all'
});

// INFO: Si desea declarar los campos del esquema que no se tendrán en cuenta para la descripción general del modelo
// BannerSchema.methods.invalid_fields = ["field1", "field2"];

// INFO: Si desea implementar un metodo despues de guardar habilite el siguiente metodo
// BannerSchema.methods.postSave = (parameters) => {
// }


export const BannerModel = mongoose.model<any, any>('Banner', BannerSchema);
