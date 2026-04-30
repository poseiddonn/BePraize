import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

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
  } catch (error) {
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
  } catch (error) {
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

    // Note: Ticket sending is currently handled by the frontend checkout page
    // The frontend calls /api/send-tickets after confirming payment
    // This webhook serves as a backup and for monitoring purposes
  } catch (error) {}
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const metadata = paymentIntent.metadata || {};
    const orderId = metadata.orderId || paymentIntent.id;

    // TODO: Update order status to failed in database
    // TODO: Send failure notification email to buyer
  } catch (error) {}
}

async function handleRefund(charge: Stripe.Charge) {
  try {
    const metadata = charge.metadata || {};
    const orderId = metadata.orderId || charge.id;

    // TODO: Update order status to refunded in database
    // TODO: Send refund notification email to buyer
  } catch (error) {}
}
