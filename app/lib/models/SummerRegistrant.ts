import mongoose, { Document, Schema } from 'mongoose';

export interface ISummerRegistrant extends Document {
  name: string;
  email: string;
  phone: string;
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SummerRegistrantSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  paymentId: {
    type: String,
    required: false,
  },
}, {
  timestamps: true,
});

export const SummerRegistrantModel = 
  mongoose.models.SummerRegistrant || 
  mongoose.model<ISummerRegistrant>('SummerRegistrant', SummerRegistrantSchema);
