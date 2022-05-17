// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
const { Schema } = mongoose;
// @end

const CourseSchedulingSchema = new Schema({
  // @add_schema Add schema here
  logReprograming: {
    count: {
      type: Schema.Types.Number,
      require: false,
      default: 0
    },
    log: [
      {
        reason: {
          type: Schema.Types.String,
        },
        source: {
          identifier: {
            type: Schema.Types.String,
          },
          sourceType: {
            type: Schema.Types.String,
          }
        },
        date: {
          type: Schema.Types.Date,
        }
      }
    ]
  },
  metadata: {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    service_id: {
      type: Schema.Types.String,
      require: true
    },
    date: {
      type: Schema.Types.String,
      require: true
    },
    year: {
      type: Schema.Types.String,
      require: true
    }
  },
  schedulingMode: {
    type: Schema.Types.ObjectId,
    ref: "CourseSchedulingMode",
    required: true
  },
  schedulingModeDetails: {
    type: Schema.Types.String,
    enum: ['in_situ', 'online']
  },
  modular: {
    type: Schema.Types.ObjectId,
    ref: "Modular",
  },
  program: {
    type: Schema.Types.ObjectId,
    ref: "Program",
    required: true
  },
  schedulingType: {
    type: Schema.Types.ObjectId,
    ref: "CourseSchedulingType",
    required: true
  },
  schedulingStatus: {
    type: Schema.Types.ObjectId,
    ref: "CourseSchedulingStatus",
    required: true
  },
  confirmed_date: {
    type: Schema.Types.Date
  },
  startDate: {
    type: Schema.Types.Date,
    required: true,
  },
  endDate: {
    type: Schema.Types.Date,
    required: false,
  },
  regional: {
    type: Schema.Types.ObjectId,
    ref: "Regional",
    required: false
  },
  regional_transversal: {
    type: Schema.Types.String,
    required: false
  },
  city: {
    type: Schema.Types.ObjectId,
    ref: "City",
    required: false
  },
  country: {
    type: Schema.Types.ObjectId,
    ref: "Country"
  },
  address: {
    type: Schema.Types.String,
  },
  classroom: {
    type: Schema.Types.String,
  },
  amountParticipants: {
    type: Schema.Types.Number,
    default: 0
  },
  observations: {
    type: Schema.Types.String,
  },
  client: {
    type: Schema.Types.ObjectId,
    ref: "Company",
  },
  contact: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  duration: { type: Schema.Types.Number },
  in_design: {
    type: Schema.Types.Boolean,
    default: false
  },
  moodle_id: { type: Schema.Types.String },
  // schedulingCode: {
  //   type: Schema.Types.String,
  // },
  hasCost: {
    type: Schema.Types.Boolean,
    default: false
  },
  priceCOP: {
    type: Schema.Types.Number,
  },
  priceUSD: {
    type: Schema.Types.Number,
  },
  discount: {
    type: Schema.Types.Number,
  },
  endDiscountDate: {
    type: Schema.Types.Date,
    required: false,
  },
  startPublicationDate: {
    type: Schema.Types.Date,
  },
  endPublicationDate: {
    type: Schema.Types.Date,
  },
  enrollmentDeadline: {
    type: Schema.Types.Date,
  },
  account_executive: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: false
  },
  certificate_clients: {
    type: Schema.Types.Boolean,
    default: false
  },
  certificate_students: {
    type: Schema.Types.Boolean,
    default: false
  },
  certificate: {
    type: Schema.Types.String
  },
  english_certificate: {
    type: Schema.Types.String
  },
  scope: {
    type: Schema.Types.String
  },
  english_scope: {
    type: Schema.Types.String
  },
  certificate_icon_1: {
    type: Schema.Types.String
  },
  certificate_icon_2: {
    type: Schema.Types.String
  },
  signature_1: {
    type: Schema.Types.String
  },
  signature_2: {
    type: Schema.Types.String
  },
  signature_3: {
    type: Schema.Types.String
  },
  auditor_certificate: {
    type: Schema.Types.String
  },
  auditor_modules: [
    {
      type: Schema.Types.ObjectId,
      ref: "CourseSchedulingDetails",
      required: false
    }],
  logistics_supply: {
    type: Schema.Types.String,
    enum: ['business', 'icontec']
  },
  certificate_address: {type: Schema.Types.String},
  // Material delivery
  material_delivery: {
    type: Schema.Types.String,
    enum: ['digital', 'physic', 'none']
  },
  material_address: {
    type: Schema.Types.String
  },
  material_contact_name: {
    type: Schema.Types.String
  },
  material_contact_phone: {
    type: Schema.Types.String
  },
  material_contact_email: {
    type: Schema.Types.String
  },
  material_assistant: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  // Adjuntos
  attachments: {
    type: Schema.Types.ObjectId,
    ref: 'Attached'
  },
  attachments_student: {
    type: Schema.Types.ObjectId,
    ref: 'Attached'
  },
  business_report: {
    type: Schema.Types.ObjectId,
    ref: 'Attached'
  },
  schedulingAssociation: {
    generatingAssociation: {
      type: Schema.Types.Boolean,
    },
    associationType: {
      type: Schema.Types.String,
      enum: ['parent', 'child'],
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'CourseScheduling'
    },
    date: {
      type: Schema.Types.Date,
    },
    personWhoGeneratedAssociation: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    slug: {
      type: Schema.Types.String
    }
  }
  // @end
}, {
  collection: 'course_schedulings', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// INFO: Para usar soft delete se debe invocar exactamente el metodo delete() o sus derivados en lugar de remove()
// Example: UserModel.delete({_id: id})
CourseSchedulingSchema.plugin(mongoose_delete, {
  deletedAt: true,
  overrideMethods: 'all',
  indexFields: 'all'
});

// INFO: Si desea declarar los campos del esquema que no se tendrán en cuenta para la descripción general del modelo
// CourseSchedulingSchema.methods.invalid_fields = ["field1", "field2"];

// INFO: Si desea implementar un metodo despues de guardar habilite el siguiente metodo
// CourseSchedulingSchema.methods.postSave = (parameters) => {
// }


export const CourseSchedulingModel = mongoose.model<any, any>('CourseScheduling', CourseSchedulingSchema);
