import mongoose, { Document, Schema } from "mongoose";

export interface ISummerRegistrant extends Document {
  name: string;
  email: string;
  phone: string;
  parentPhone: string;
  selectedInstruments: string[];
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SummerRegistrantSchema: Schema = new Schema(
  {
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
    parentPhone: {
      type: String,
      required: true,
      trim: true,
    },
    selectedInstruments: {
      type: [String],
      required: true,
      validate: {
        validator: function (v: string[]) {
          return v.length <= 3;
        },
        message: "Maximum 3 instruments can be selected",
      },
    },
    paymentId: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

export const SummerRegistrantModel =
  mongoose.models.SummerRegistrant ||
  mongoose.model<ISummerRegistrant>("SummerRegistrant", SummerRegistrantSchema);
