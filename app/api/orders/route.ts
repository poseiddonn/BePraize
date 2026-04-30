import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@/app/lib/mongodb";
import { OrderModel } from "@/app/lib/models/Order";
import { TicketTierModel } from "@/app/lib/models/TicketTier";

// Define TransactionStatus type to match admin interface
type TransactionStatus = "success" | "failed" | "pending" | "refunded";

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
          status: "success" as TransactionStatus, // All orders in DB are successful payments
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

    // Check stock availability before processing order
    if (body.cart && Array.isArray(body.cart)) {
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
    };

    // Remove the nested buyer object since we've flattened it
    delete orderData.buyer;

    // Upsert by orderId so duplicate submissions don't create duplicate records
    const order = await OrderModel.findOneAndUpdate(
      { orderId: body.orderId },
      { $set: orderData },
      { upsert: true, returnDocument: "after", runValidators: true },
    ).lean();

    // Decrement stock for each ticket tier in the cart
    if (body.cart && Array.isArray(body.cart)) {
      for (const item of body.cart) {
        if (item.tierId && item.quantity) {
          await TicketTierModel.findByIdAndUpdate(
            item.tierId,
            { $inc: { stock: -item.quantity } },
            { new: true },
          );
        }
      }
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("[POST /api/orders]", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to process request";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
