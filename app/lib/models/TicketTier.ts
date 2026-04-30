import { Schema, model, models } from "mongoose";

const TicketTierSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, default: "" },
    stock: { type: Number, default: null }, // null = unlimited, number = limited stock
  },
  { timestamps: true },
);

export const TicketTierModel =
  models.TicketTier ?? model("TicketTier", TicketTierSchema, "ticket_tiers");
