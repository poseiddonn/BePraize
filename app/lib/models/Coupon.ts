import { Schema, model, models } from "mongoose";

const CouponSchema = new Schema(
  {
    name:       { type: String, required: true, trim: true, uppercase: true },
    percentage: { type: Number, required: true, min: 1, max: 100 },
    active:     { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const CouponModel =
  models.Coupon ?? model("Coupon", CouponSchema, "coupons");