import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@/app/lib/mongodb";
import { OrderModel } from "@/app/lib/models/Order";

export async function POST(request: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured" },
      { status: 500 },
    );
  }

  const stripe = new Stripe(stripeSecretKey);
  const body = await request.text();
  const signature = request.headers.get("stripe-signature") || "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret,
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
  const metadata = paymentIntent.metadata || {};
  const orderId = metadata.orderId || paymentIntent.id;

  await updateOrderStatus(orderId, "success", paymentIntent.id);
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const metadata = paymentIntent.metadata || {};
  const orderId = metadata.orderId || paymentIntent.id;

  await updateOrderStatus(orderId, "failed", paymentIntent.id);
}

async function handleRefund(charge: Stripe.Charge) {
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
