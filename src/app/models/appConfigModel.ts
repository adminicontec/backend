import mongoose from 'mongoose';
const { Schema } = mongoose;

const AppConfigSchema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true },
}, {
  collection: 'app_configs',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export const AppConfigModel = mongoose.model<any, any>('AppConfig', AppConfigSchema);
