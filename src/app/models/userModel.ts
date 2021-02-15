// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
const { Schema } = mongoose;
// @end

const UserSchema = new Schema({
  // @add_schema Add schema here
  userName: {
    type: Schema.Types.String,
    required: true,
  },
  normalizedUserName: {
    type: Schema.Types.String,
    // required: true,
  },
  email: {
    type: Schema.Types.String,
    required: true,
  },
  normalizedEmail: {
    type: Schema.Types.String,
    // required: true,
  },
  emailConfirmed: {
    type: Schema.Types.Boolean,
    default: false
  },
  passwordHash: {
    type: Schema.Types.String,
    required: true,
  },
  securityStamp: {
    type: Schema.Types.String
  },
  concurrencyStamp: {
    type: Schema.Types.String
  },
  phoneNumber: {
    type: Schema.Types.String
  },
  phoneNumberConfirmed: {
    type: Schema.Types.Boolean,
    default: false
  },
  twoFactorEnabled: {
    type: Schema.Types.Boolean,
    default: false
  },
  lockoutEnd: {
    type: Schema.Types.Date
  },
  lockoutEnabled: {
    type: Schema.Types.Boolean,
    default: false
  },
  accessFailedCount: {
    type: Schema.Types.Number,
    default: 0
  },
  profile: {
    name: {
      type: Schema.Types.String
    },
    lastName: {
      type: Schema.Types.String
    },
    avatarImageUrl: {
      type: Schema.Types.String
    },
    city: {
      type: Schema.Types.String
    },
    country: {
      type: Schema.Types.ObjectId,
      ref: "Country"
    },
    timezone: { type: Schema.Types.String, default: 'GMT-5' },
    culture: { type: Schema.Types.String, default: 'es_CO' },
    screen_mode: { type: Schema.Types.String, default: 'light-mode' },
  },
  roles: [{
    type: Schema.Types.ObjectId,
    ref: "Role"
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  lastModifiedBy: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  curriculum_vitae: {
    biography: { type: Schema.Types.String },
    laboral_experience: [
      {
        company_position: { type: Schema.Types.String },
        description: { type: Schema.Types.String },
        company: { type: Schema.Types.String },
        start_date: { type: Schema.Types.Date },
        end_date: { type: Schema.Types.Date },
        currently: { type: Schema.Types.Boolean },
      }
    ],
    academic_info: [
      {
        institution: { type: Schema.Types.String },
        degree: { type: Schema.Types.String },
        start_date: { type: Schema.Types.Date },
        end_date: { type: Schema.Types.Date },
        currently: { type: Schema.Types.Boolean },
      }
    ],
    skill: [
      {
        name: { type: Schema.Types.String},
        score: { type: Schema.Types.Number},
        skill_type: {
          type: Schema.Types.ObjectId,
          ref: "SkillType"
        },
      }
    ]
  }
  // @end
}, {
  collection: 'users', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// INFO: Para usar soft delete se debe invocar exactamente el metodo delete() o sus derivados en lugar de remove()
// Example: UserModel.delete({_id: id})
UserSchema.plugin(mongoose_delete, {
  deletedAt: true,
  overrideMethods: 'all',
  indexFields: 'all'
});

// INFO: Si desea declarar los campos del esquema que no se tendrán en cuenta para la descripción general del modelo
// UserSchema.methods.invalid_fields = ["field1", "field2"];

// INFO: Si desea implementar un metodo despues de guardar habilite el siguiente metodo
// UserSchema.methods.postSave = (parameters) => {
// }


export const UserModel = mongoose.model('User', UserSchema);
