import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@/app/lib/mongodb";
import { OrderModel } from "@/app/lib/models/Order";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature") || "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || "",
    );
  } catch {
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case "charge.refunded":
        await handleRefund(event.data.object as Stripe.Charge);
        break;

      default:
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Extract order data from payment intent metadata
    const metadata = paymentIntent.metadata || {};
    const orderId = metadata.orderId || paymentIntent.id;

    await updateOrderStatus(orderId, "success", paymentIntent.id);
  } catch {}
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const metadata = paymentIntent.metadata || {};
    const orderId = metadata.orderId || paymentIntent.id;

    await updateOrderStatus(orderId, "failed", paymentIntent.id);
  } catch {}
}

async function handleRefund(charge: Stripe.Charge) {
  try {
    const metadata = charge.metadata || {};
    let orderId = metadata.orderId || "";

    if (!orderId && typeof charge.payment_intent === "string") {
      await connectDB();
      const order = await OrderModel.findOne({
        paymentIntentId: charge.payment_intent,
      }).lean();
      orderId = order?.orderId || "";
    }

    if (orderId) {
      await updateOrderStatus(
        orderId,
        "refunded",
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : undefined,
      );
    }
  } catch {}
}

async function updateOrderStatus(
  orderId: string,
  status: "success" | "failed" | "refunded",
  paymentIntentId?: string,
) {
  await connectDB();

  await OrderModel.findOneAndUpdate(
    { orderId },
    {
      $set: {
        status,
        ...(paymentIntentId ? { paymentIntentId } : {}),
      },
    },
    { upsert: false },
  );
}
