import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@/app/lib/mongodb";
import { OrderModel } from "@/app/lib/models/Order";
import { TicketTierModel } from "@/app/lib/models/TicketTier";
import { createTicketDeliveryToken } from "@/app/lib/tickets/ticketDelivery";

// Define TransactionStatus type to match admin interface
type TransactionStatus = "success" | "failed" | "pending" | "refunded";
type PaymentMethod = "card" | "wallet" | "apple_pay" | "google_pay";

const SUPPORTED_PAYMENT_METHODS = new Set<PaymentMethod>([
  "card",
  "wallet",
  "apple_pay",
  "google_pay",
]);

function statusFromPaymentIntent(
  paymentIntent: Stripe.PaymentIntent,
): TransactionStatus {
  if (paymentIntent.status === "succeeded") return "success";
  if (
    paymentIntent.status === "canceled" ||
    paymentIntent.status === "requires_payment_method"
  ) {
    return "failed";
  }

  return "pending";
}

// GET: Fetch all orders
export async function GET() {
  try {
    await connectDB();
    const orders = await OrderModel.find().sort({ createdAt: -1 }).lean();

    // Transform orders to match Transaction interface for admin dashboard
    const transactions = orders.map(
      (order: {
        _id: { toString(): string } | string;
        orderId: string;
        buyer?: { name?: string; email?: string };
        buyerName?: string;
        buyerEmail?: string;
        attendees?: Array<{ name?: string; email?: string; phone?: string }>;
        cart?: Array<{ eventName?: string; quantity?: number }>;
        status?: TransactionStatus;
        total?: number;
        createdAt?: string | Date;
      }) => {
        const buyerName = order.buyer?.name || order.buyerName || "Unknown";
        const buyerEmail = order.buyer?.email || order.buyerEmail || "";

        return {
          _id: order._id?.toString?.() ?? order._id,
          orderId: order.orderId,
          buyerName,
          buyerEmail,
          status: order.status || ("success" as TransactionStatus),
          total: order.total || 0,
          ticketCount:
            order.attendees?.length ||
            order.cart?.reduce(
              (sum: number, item: { quantity?: number }) =>
                sum + (item.quantity || 0),
              0,
            ) ||
            0,
          eventName: order.cart?.[0]?.eventName || "Unknown Event",
          createdAt: order.createdAt || new Date().toISOString(),
        };
      },
    );

    return NextResponse.json(transactions);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}

// POST: Handle both payment intents and order creation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      amount,
      currency = "cad",
      orderId,
      customer_email,
      metadata,
    } = body;

    // If amount is provided, treat as payment intent creation
    if (amount !== undefined) {
      if (!amount || amount <= 0) {
        return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
      }

      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        return NextResponse.json(
          { error: "Stripe configuration error" },
          { status: 500 },
        );
      }

      const stripe = new Stripe(stripeSecretKey);

      // Create a payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata: {
          orderId,
          ...metadata,
        },
        receipt_email: customer_email,
      });

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    }

    // If no amount, treat as order creation/update
    await connectDB();

    const paymentMethod = body.paymentMethod as PaymentMethod | undefined;
    if (paymentMethod && !SUPPORTED_PAYMENT_METHODS.has(paymentMethod)) {
      return NextResponse.json(
        { error: "Unsupported payment method" },
        { status: 400 },
      );
    }

    const orderTotal = Number(body.total || 0);
    const requiresPayment = orderTotal > 0;
    let verifiedPaymentStatus: TransactionStatus | null = null;

    if (body.paymentIntentId) {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        return NextResponse.json(
          { error: "Stripe configuration error" },
          { status: 500 },
        );
      }

      const stripe = new Stripe(stripeSecretKey);
      const paymentIntent = await stripe.paymentIntents.retrieve(
        body.paymentIntentId,
      );
      verifiedPaymentStatus = statusFromPaymentIntent(paymentIntent);

      if (
        verifiedPaymentStatus !== "success" ||
        paymentIntent.metadata?.orderId !== body.orderId
      ) {
        return NextResponse.json(
          { error: "Payment has not been confirmed" },
          { status: 402 },
        );
      }
    } else if (requiresPayment) {
      return NextResponse.json(
        { error: "Missing payment confirmation" },
        { status: 400 },
      );
    }

    const existingOrder = body.orderId
      ? await OrderModel.exists({ orderId: body.orderId })
      : null;
    const shouldAdjustStock = !existingOrder;

    // Check stock availability before processing new orders.
    if (shouldAdjustStock && body.cart && Array.isArray(body.cart)) {
      for (const item of body.cart) {
        if (item.tierId && item.quantity) {
          const tier = await TicketTierModel.findById(item.tierId);
          if (tier && tier.stock !== null && tier.stock < item.quantity) {
            return NextResponse.json(
              {
                error: `Insufficient stock for ${item.tierName || "ticket tier"}. Only ${tier.stock} remaining.`,
              },
              { status: 400 },
            );
          }
        }
      }
    }

    // Flatten buyer object to match schema
    const orderData = {
      ...body,
      buyerName: body.buyer?.name || body.buyerName || "",
      buyerEmail: body.buyer?.email || body.buyerEmail || "",
      paymentMethod: paymentMethod || "card",
      status: verifiedPaymentStatus || body.status || "success",
    };

    // Remove the nested buyer object since we've flattened it
    delete orderData.buyer;

    // Upsert by orderId so duplicate submissions don't create duplicate records
    const order = await OrderModel.findOneAndUpdate(
      { orderId: body.orderId },
      { $set: orderData },
      { upsert: true, returnDocument: "after", runValidators: true },
    ).lean();

    // Decrement stock for each ticket tier only once per order.
    if (shouldAdjustStock && body.cart && Array.isArray(body.cart)) {
      for (const item of body.cart) {
        if (item.tierId && item.quantity) {
          const tier = await TicketTierModel.findById(item.tierId);
          if (tier && tier.stock !== null) {
            await TicketTierModel.findByIdAndUpdate(
              item.tierId,
              { $inc: { stock: -item.quantity } },
              { new: true },
            );
          }
        }
      }
    }

    const deliveryOrderIds = new Set<string>([body.orderId]);
    if (Array.isArray(body.attendees)) {
      body.attendees.forEach((attendee: { ticketId?: string }) => {
        const orderPrefix = attendee.ticketId
          ?.split("-")
          .slice(0, -1)
          .join("-");
        if (orderPrefix) deliveryOrderIds.add(orderPrefix);
      });
    }

    const ticketDeliveryTokens = Object.fromEntries(
      Array.from(deliveryOrderIds).map((deliveryOrderId) => [
        deliveryOrderId,
        createTicketDeliveryToken(deliveryOrderId),
      ]),
    );

    return NextResponse.json(
      {
        ...order,
        ticketDeliveryToken: ticketDeliveryTokens[body.orderId],
        ticketDeliveryTokens,
      },
      { status: 201 },
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to process request";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
