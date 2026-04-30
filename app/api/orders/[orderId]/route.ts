import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import { OrderModel } from "@/app/lib/models/Order";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    await connectDB();

    const { orderId } = await params;

    // First, let's see what orders exist
    const allOrders = await OrderModel.find().lean();

    const order = await OrderModel.findOne({ orderId }).lean();

    if (!order) {
      return NextResponse.json(
        {
          error: "Order not found",
          debug: {
            searchedOrderId: orderId,
            availableOrders: allOrders.map((o) => o.orderId),
          },
        },
        { status: 404 },
      );
    }

    // Transform the order to match DetailedOrder interface
    const detailedOrder = {
      _id: order._id?.toString?.() ?? order._id,
      orderId: order.orderId,
      buyer: order.buyer || {
        name: order.buyerName || "Unknown",
        email: order.buyerEmail || "",
        phone: "",
      },
      cart: order.cart || [],
      attendees: order.attendees || [],
      mailOption: order.mailOption || "both",
      paymentMethod: order.paymentMethod || "card",
      appliedCoupon: order.appliedCoupon,
      total: order.total || 0,
      status: order.status || "success",
      createdAt: order.createdAt || new Date().toISOString(),
    };

    return NextResponse.json(detailedOrder);
  } catch (error) {
    const { orderId } = await params;
    return NextResponse.json(
      { error: "Failed to fetch order details" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    await connectDB();

    const { orderId } = await params;

    const body = await request.json();
    const { status } = body;

    if (
      status &&
      !["success", "failed", "pending", "refunded"].includes(status)
    ) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updatedOrder = await OrderModel.findOneAndUpdate(
      { orderId },
      { $set: { status: status || "success" } },
      { returnDocument: "after", runValidators: true },
    ).lean();

    if (!updatedOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      status: updatedOrder.status,
    });
  } catch (error) {
    const { orderId } = await params;
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 },
    );
  }
}
