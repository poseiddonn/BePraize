import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import { OrderModel } from "@/app/lib/models/Order";
import {
  isSignedTicketFormat,
  verifyTicketSignature,
} from "@/app/lib/tickets/ticketIdentity";

// Define CheckIn interface
interface CheckIn {
  ticketId: string;
  orderId: string;
  attendeeName: string;
  attendeeEmail: string;
  eventName: string;
  tierName: string;
  checkInTime: Date;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { ticketId, orderId, signature, tier, eventId } = body;

    console.log(
      `[API Check-in] Received: ticketId=${ticketId}, orderId=${orderId}, eventId=${eventId}`,
    );

    if (!ticketId || !orderId) {
      return NextResponse.json(
        { error: "Ticket ID and Order ID are required" },
        { status: 400 },
      );
    }

    // Find the order that contains this ticket
    console.log(`[API Check-in] Looking for order with orderId: ${orderId}`);
    const order = await OrderModel.findOne({ orderId });
    console.log(`[API Check-in] Order found:`, !!order);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Validate event if eventId is provided
    if (eventId) {
      const cart = order.cart || [];
      const eventInCart = cart.some(
        (item: { eventId?: string }) => item.eventId === eventId,
      );
      if (!eventInCart) {
        return NextResponse.json(
          { error: "This ticket is not for the selected event" },
          { status: 400 },
        );
      }
    }

    // Find the attendee for this ticket
    const attendees = order.attendees || [];
    const cart = order.cart || [];
    let ticketIndex = attendees.findIndex(
      (attendee: { ticketId?: string }) => attendee.ticketId === ticketId,
    );

    if (ticketIndex === -1 && !isSignedTicketFormat(ticketId, orderId)) {
      ticketIndex = parseInt(ticketId.split("-").pop() || "1") - 1;
    }

    if (ticketIndex < 0 || ticketIndex >= attendees.length) {
      return NextResponse.json(
        { error: "Ticket not found on this order" },
        { status: 400 },
      );
    }

    const attendee = attendees[ticketIndex];
    const cartItem =
      cart.find(
        (item: { tierId?: string }) =>
          attendee.tierId && item.tierId === attendee.tierId,
      ) || cart[ticketIndex % cart.length];
    const tierName =
      tier || attendee.tierName || cartItem?.tierName || "Standard";

    if (
      isSignedTicketFormat(ticketId, orderId) &&
      !verifyTicketSignature({
        ticketId,
        orderNumber: orderId,
        tier: tierName,
        signature,
      })
    ) {
      return NextResponse.json(
        { error: "Ticket signature is invalid" },
        { status: 401 },
      );
    }

    const existingCheckIns: CheckIn[] = Array.isArray(order.checkIns)
      ? order.checkIns
      : [];

    if (existingCheckIns.some((checkIn) => checkIn.ticketId === ticketId)) {
      return NextResponse.json(
        { error: "Ticket has already been checked in" },
        { status: 409 },
      );
    }

    const checkInData: CheckIn = {
      ticketId,
      orderId,
      attendeeName: attendee.name || "Unknown",
      attendeeEmail: attendee.email || "",
      eventName: cartItem?.eventName || "Unknown Event",
      tierName,
      checkInTime: new Date(),
    };

    order.checkIns = [...existingCheckIns, checkInData];
    await order.save();

    return NextResponse.json({
      success: true,
      message: "Check-in successful",
      checkIn: checkInData,
    });
  } catch (error) {
    console.error("[POST /api/checkin]", error);
    return NextResponse.json(
      { error: "Failed to process check-in" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    // Get today's check-ins
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const orders = await OrderModel.find({
      "checkIns.0": { $exists: true },
    }).lean();

    // Filter orders by eventId if provided
    const filteredOrders = eventId
      ? orders.filter((order) => {
          const cart = order.cart || [];
          return cart.some(
            (item: { eventId?: string }) => item.eventId === eventId,
          );
        })
      : orders;

    const todayCheckIns: CheckIn[] = filteredOrders
      .flatMap((order) => (Array.isArray(order.checkIns) ? order.checkIns : []))
      .filter((checkIn) => {
        const checkInTime = new Date(checkIn.checkInTime);
        return checkInTime >= today && checkInTime < tomorrow;
      })
      .sort(
        (a, b) =>
          new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime(),
      );

    return NextResponse.json({
      checkIns: todayCheckIns,
      total: todayCheckIns.length,
      date: today.toISOString(),
    });
  } catch (error) {
    console.error("[GET /api/checkin]", error);
    return NextResponse.json(
      { error: "Failed to fetch check-ins" },
      { status: 500 },
    );
  }
}
