// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
const { Schema } = mongoose;
// @end

const CertificateSettingsModuleItem = new Schema({
  status: {
    type: Schema.Types.Boolean,
  },
  percentage: {
    type: Schema.Types.Number,
  }
}, {
  _id: false
})

const CertificateSettingsModules = new Schema({
  courseSchedulingDetail: {
    type: Schema.Types.ObjectId,
    ref: 'CourseSchedulingDetails',
    required: true
  },
  exam: {
    type: CertificateSettingsModuleItem,
    required: false,
  },
  attendance: {
    type: CertificateSettingsModuleItem,
    required: false,
  },
  progress: {
    type: CertificateSettingsModuleItem,
    required: false,
  },
}, {
  _id: false
})

const CertificateSettingsMetadata = new Schema({
  createdBy: {
    username: {
      type: Schema.Types.String,
      require: true
    },
    name: {
      type: Schema.Types.String,
      require: true
    },
  },
  lastUpdatedBy: {
    username: {
      type: Schema.Types.String,
      require: true
    },
    name: {
      type: Schema.Types.String,
      require: true
    },
  },
}, {
  _id: false
})

const CertificateSettingsSchema = new Schema({
  // @add_schema Add schema here
  certificateName: {
    type: Schema.Types.String,
    required: true
  },
  courseScheduling: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'CourseScheduling'
  },
  modules: [{
    type: CertificateSettingsModules
  }],
  metadata: {
    type: CertificateSettingsMetadata,
    required: false
  }
  // @end
}, {
  collection: 'certificate_settings' ,timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// INFO: Para usar soft delete se debe invocar exactamente el metodo delete() o sus derivados en lugar de remove()
// Example: UserModel.delete({_id: id})
CertificateSettingsSchema.plugin(mongoose_delete,{
  deletedAt : true,
  overrideMethods: 'all',
  indexFields: 'all'
});

// INFO: Si desea declarar los campos del esquema que no se tendrán en cuenta para la descripción general del modelo
// CertificateSettingsSchema.methods.invalid_fields = ["field1", "field2"];

// INFO: Si desea implementar un metodo despues de guardar habilite el siguiente metodo
// CertificateSettingsSchema.methods.postSave = (parameters) => {
// }


export const CertificateSettingsModel = mongoose.model<any, any>('CertificateSettings', CertificateSettingsSchema);
