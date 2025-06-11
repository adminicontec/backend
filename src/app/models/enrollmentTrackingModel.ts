// @import_dependencies_node Import libraries
import mongoose_delete from "mongoose-delete";
import mongoose from 'mongoose';
import { EnrollmentTrackingSource, EnrollmentTrackingType } from "@scnode_app/types/default/admin/enrollment/enrollmentTrackingTypes";
import { EnrollmentStatus } from "@scnode_app/types/default/admin/enrollment/enrollmentTypes";
const { Schema } = mongoose;
// @end

const EnrollmentTrackingSchema = new Schema({
  // Campos requeridos
    studentEmail: {
      type: Schema.Types.String
    },
    enrollmentDate: {
      type: Schema.Types.Date
    },      // Fecha de la acción
    trackingType: {
      type: Schema.Types.String,
      enum: EnrollmentTrackingType
    },  // Tipo de tracking
    trackingSource: {
      type: Schema.Types.String,
      enum: EnrollmentTrackingSource
    }, // Origen de la acción

    // Campos opcionales
    id: {
      type: Schema.Types.String,
      require: false
    },

    // Información del estudiante
    studentId: {
      type: Schema.Types.String,
      require: false
    },
    studentDocument: {
      type: Schema.Types.String,
      require: false
    },

    // Información del curso/programa
    courseId: {
      type: Schema.Types.String,
      require: false
    },
    courseSchedulingId: {
      type: Schema.Types.String,
      require: false
    },

    // Información de la matrícula
    enrollmentId: {
      type: Schema.Types.String,
      require: false
    },
    enrollmentCode: {
      type: Schema.Types.Number,
      require: false
    },
    // Código de matrícula
    enrollmentStatus: {
      type: Schema.Types.String,
      required: false,
      enum: EnrollmentStatus
    }, // Estado de la matrícula

    // Información del tracking
    requestData: {
      type: Schema.Types.Mixed,
      require: false
    },
    errorLog: {
      type: Schema.Types.Mixed,
      require: false
    },

    // Metadata
    origin: {
      type: Schema.Types.String,
      require: false
    },
    createdBy: {
      type: Schema.Types.String,
      require: false
    },

    // Campos para desmatriculación
    unenrollmentDate: {
      type: Schema.Types.Date,
      required: false
    },  // Fecha de desmatriculación
    unenrollmentReason: {
      type: Schema.Types.String,
      require: false
    },

    // Campos para extensibilidad futura
    metadata: {
      type: Schema.Types.Mixed,
      require: false
    },
  // @end
}, {
  collection: 'enrollment_trackings' ,timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// INFO: Para usar soft delete se debe invocar exactamente el metodo delete() o sus derivados en lugar de remove()
// Example: UserModel.delete({_id: id})
EnrollmentTrackingSchema.plugin(mongoose_delete,{
  deletedAt : true,
  overrideMethods: 'all',
  indexFields: 'all'
});

// INFO: Si desea declarar los campos del esquema que no se tendrán en cuenta para la descripción general del modelo
// EnrollmentTrackingSchema.methods.invalid_fields = ["field1", "field2"];

// INFO: Si desea implementar un metodo despues de guardar habilite el siguiente metodo
// EnrollmentTrackingSchema.methods.postSave = (parameters) => {
// }


export const EnrollmentTrackingModel = mongoose.model<any, any>('EnrollmentTracking', EnrollmentTrackingSchema);
