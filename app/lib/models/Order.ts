import { Schema, model, models } from "mongoose";

const OrderSchema = new Schema(
  {
    orderId: { type: String, required: true, unique: true },
    buyerName: { type: String, default: "" },
    buyerEmail: { type: String, default: "" },
    buyer: { type: Schema.Types.Mixed, default: null }, // For backwards compatibility
    status: {
      type: String,
      enum: ["success", "failed", "pending", "refunded"],
      default: "pending",
    },
    total: { type: Number, default: 0 },
    ticketCount: { type: Number, default: 0 },
    eventName: { type: String, default: "" },
    cart: { type: Schema.Types.Mixed, default: [] },
    attendees: { type: Schema.Types.Mixed, default: [] },
    checkIns: { type: Schema.Types.Mixed, default: [] },
    mailOption: { type: String, default: "both" },
    paymentMethod: { type: String, default: "card" },
    appliedCoupon: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

export const OrderModel = models.Order ?? model("Order", OrderSchema, "orders");
