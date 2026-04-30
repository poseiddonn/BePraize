import { Schema, model, models } from "mongoose";

const EventSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    address: { type: String, default: "", trim: true },
    city: { type: String, default: "", trim: true },
    date: { type: String, required: true }, // "YYYY-MM-DD"
    time: { type: String, default: "" }, // "HH:MM"
    description: { type: String, default: "" },
    picture: { type: String, default: "" }, // base64 data URL
    ticketTierIds: [{ type: Schema.Types.ObjectId, ref: "TicketTier" }],
    coupons: [{ type: String }], // coupon code strings
    // Ticket sale window — if not set, sales are open until the event starts
    saleEndDate: { type: String, default: "" }, // "YYYY-MM-DD"
    saleEndTime: { type: String, default: "" }, // "HH:MM"
  },
  { timestamps: true },
);

// Third argument pins this model to the existing "event_info" collection
export const EventModel =
  models.Event ?? model("Event", EventSchema, "event_info");
