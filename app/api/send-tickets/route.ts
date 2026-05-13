import { NextRequest, NextResponse } from "next/server";

import { sendAllTickets, AttendeeTicket } from "@/app/lib/tickets/sendTicket";
import { createTicketId } from "@/app/lib/tickets/ticketIdentity";
import { verifyTicketDeliveryToken } from "@/app/lib/tickets/ticketDelivery";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/app/lib/auth/adminSession";

export interface SendTicketsBody {
  orderId: string;

  mailOption: "buyer" | "attendees" | "both";

  buyer: {
    name: string;

    email: string;
  };

  event: {
    name: string;

    date?: string;

    time?: string;

    venue?: string;
  };

  // One entry per ticket (quantity already expanded)

  ticketDeliveryToken?: string;

  attendees: {
    name: string;

    email: string;

    tierName: string; // e.g. "Gold", "Silver", "Platinum"

    ticketId: string; // unique per ticket

    price?: string;
  }[];
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cleanTicketId(
  ticketId: string | undefined,
  orderId: string,
  usedTicketIds: Set<string>,
) {
  const raw = ticketId?.trim();
  const expectedPattern = new RegExp(`^${escapeRegex(orderId)}-\\d{4}$`);

  if (raw && expectedPattern.test(raw) && !usedTicketIds.has(raw)) {
    usedTicketIds.add(raw);
    return raw;
  }

  let nextTicketId = createTicketId(orderId);
  while (usedTicketIds.has(nextTicketId)) {
    nextTicketId = createTicketId(orderId);
  }

  usedTicketIds.add(nextTicketId);
  return nextTicketId;
}

export async function POST(req: NextRequest) {
  try {
    const body: SendTicketsBody = await req.json();

    const { orderId, mailOption, buyer, event, attendees, ticketDeliveryToken } = body;

    const adminSession = await verifyAdminSessionToken(
      req.cookies.get(ADMIN_SESSION_COOKIE)?.value,
    );
    const canSendTickets =
      Boolean(adminSession) || verifyTicketDeliveryToken(orderId, ticketDeliveryToken);

    if (!canSendTickets) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!orderId || !buyer?.email || !attendees?.length) {
      return NextResponse.json(
        { error: "Missing required fields: orderId, buyer.email, attendees" },

        { status: 400 },
      );
    }

    // Build AttendeeTicket array

    const usedTicketIds = new Set<string>();

    const tickets: AttendeeTicket[] = attendees.map((a, i) => ({
      attendeeName: a.name || `Attendee ${i + 1}`,

      attendeeEmail: a.email || buyer.email,

      tierName: a.tierName,

      ticketId: cleanTicketId(a.ticketId, orderId, usedTicketIds),

      orderNumber: orderId,

      eventName: event.name,

      eventDate: event.date,

      eventTime: event.time,

      venue: event.venue,

      price: a.price,
    }));

    await sendAllTickets({
      tickets,

      mailOption,

      buyerEmail: buyer.email,

      buyerName: buyer.name,
    });

    return NextResponse.json({ success: true, sent: tickets.length });
  } catch {
    return NextResponse.json(
      { error: "Failed to send tickets. Please try again." },

      { status: 500 },
    );
  }
}
