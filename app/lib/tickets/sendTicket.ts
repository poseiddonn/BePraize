import nodemailer from "nodemailer";
import {
  generateTicket,
  resolveTier,
  TierType,
  TicketData,
} from "./generateTicket";

// Create Nodemailer transporter with Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AttendeeTicket {
  attendeeName: string;
  attendeeEmail: string;
  tierName: string; // raw tier name from DB (e.g. "Gold", "Platinum")
  ticketId: string;
  orderNumber: string;
  eventName: string;
  eventDate?: string;
  eventTime?: string;
  venue?: string;
  price?: string;
}

// ─── HTML email template ──────────────────────────────────────────────────────

function buildEmailHtml(ticket: AttendeeTicket, tier: TierType): string {
  const tierColors: Record<
    TierType,
    { bg: string; accent: string; text: string; badge: string }
  > = {
    Diamond: {
      bg: "#0a0804",
      accent: "#C9A84C",
      text: "#f0e8cc",
      badge: "#1a1408",
    },
    Gold: {
      bg: "#1a1001",
      accent: "#DAA520",
      text: "#f5e8a0",
      badge: "#2a1a02",
    },
    Silver: {
      bg: "#101012",
      accent: "#A0A0AA",
      text: "#d8d8dd",
      badge: "#1e1e22",
    },
    Custom: {
      bg: "#101012",
      accent: "#A0A0AA",
      text: "#d8d8dd",
      badge: "#1e1e22",
    },
  };
  const c = tierColors[tier];

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Ticket — ${ticket.eventName}</title>
</head>
<body style="margin:0;padding:0;background:${c.bg};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${c.bg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid ${c.accent}33;border-radius:12px;overflow:hidden;max-width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:${c.badge};padding:28px 32px;text-align:center;border-bottom:1px solid ${c.accent}44;">
              <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${c.accent};font-weight:700;">BePraize Sax</p>
              <h1 style="margin:0;font-size:28px;font-weight:800;color:${c.text};letter-spacing:0.02em;">Your Ticket is Ready</h1>
              <p style="margin:10px 0 0;font-size:14px;color:${c.accent};opacity:0.8;">${ticket.eventName}</p>
            </td>
          </tr>

          <!-- Tier badge -->
          <tr>
            <td style="background:${c.accent};padding:12px 32px;text-align:center;">
              <p style="margin:0;font-size:18px;font-weight:800;color:${c.bg};letter-spacing:0.06em;">
                ${ticket.tierName.toUpperCase()} TICKET
              </p>
            </td>
          </tr>

          <!-- Attendee info -->
          <tr>
            <td style="padding:28px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${[
                  ["Attendee", ticket.attendeeName],
                  ["Ticket ID", `#${ticket.ticketId}`],
                  ["Order Number", ticket.orderNumber],
                  ...(ticket.eventDate ? [["Date", ticket.eventDate]] : []),
                  ...(ticket.eventTime ? [["Time", ticket.eventTime]] : []),
                  ...(ticket.venue ? [["Venue", ticket.venue]] : []),
                  ...(ticket.price ? [["Price", ticket.price]] : []),
                ]
                  .map(
                    ([label, value]) => `
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid ${c.accent}1a;">
                    <span style="font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${c.accent};opacity:0.7;">${label}</span><br/>
                    <span style="font-size:15px;font-weight:700;color:${c.text};margin-top:3px;display:inline-block;">${value}</span>
                  </td>
                </tr>`,
                  )
                  .join("")}
              </table>
            </td>
          </tr>

          <!-- PDF note -->
          <tr>
            <td style="padding:0 32px 24px;">
              <div style="background:${c.badge};border:1px solid ${c.accent}33;border-radius:8px;padding:16px 20px;text-align:center;">
                <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:${c.accent};">🎟️ Your ticket PDF is attached</p>
                <p style="margin:0;font-size:12px;color:${c.text};opacity:0.6;line-height:1.5;">
                  Please present the QR code at the door — either printed or on your phone.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:${c.badge};padding:18px 32px;text-align:center;border-top:1px solid ${c.accent}22;">
              <p style="margin:0;font-size:11px;color:${c.accent};opacity:0.5;letter-spacing:0.1em;">
                WWW.BEPRAIZESAX.CA
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Send a single ticket ─────────────────────────────────────────────────────

export async function sendTicketEmail(ticket: AttendeeTicket): Promise<void> {
  const tier = resolveTier(ticket.tierName);

  const ticketData: TicketData = {
    eventName: ticket.eventName,
    tier,
    tierName: ticket.tierName, // Pass actual tier name for custom tiers
    attendeeName: ticket.attendeeName,
    ticketId: ticket.ticketId,
    orderNumber: ticket.orderNumber,
    eventDate: ticket.eventDate,
    eventTime: ticket.eventTime,
    venue: ticket.venue,
  };

  const pdfBytes = await generateTicket(ticketData);
  const pdfBuffer = Buffer.from(pdfBytes);

  const filename = `BePraizeSax_${ticket.tierName.replace(/\s+/g, "_")}_${ticket.ticketId}.pdf`;
  const subject = `Your ${ticket.tierName} Ticket — ${ticket.eventName}`;

  await transporter.sendMail({
    from: `"BePraize Sax" <${process.env.GMAIL_USER}>`,
    to: ticket.attendeeEmail,
    subject,
    html: buildEmailHtml(ticket, tier),
    attachments: [
      {
        filename,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
}

// ─── Send tickets to multiple recipients ─────────────────────────────────────

export interface SendTicketsOptions {
  tickets: AttendeeTicket[];
  /** Which emails to actually send to */
  mailOption: "buyer" | "attendees" | "both";
  buyerEmail: string;
  buyerName: string;
}

export async function sendAllTickets(
  options: SendTicketsOptions,
): Promise<void> {
  const { tickets, mailOption, buyerEmail } = options;

  const promises: Promise<void>[] = [];

  // Send tickets to attendees if requested
  if (mailOption === "attendees") {
    // Send to ALL attendees (including buyer if they are an attendee)
    for (const ticket of tickets) {
      if (ticket.attendeeEmail) {
        promises.push(sendTicketEmail(ticket).catch(() => {}));
      }
    }
  } else if (mailOption === "both") {
    // Send to buyer AND other attendees (avoid duplicate to buyer)
    for (const ticket of tickets) {
      // Send to attendee if email is different from buyer
      if (ticket.attendeeEmail && ticket.attendeeEmail !== buyerEmail) {
        promises.push(sendTicketEmail(ticket).catch(() => {}));
      }
    }
    // Send to buyer separately
    for (const ticket of tickets) {
      promises.push(
        sendTicketEmail({
          ...ticket,
          attendeeEmail: buyerEmail,
          // Preserve the original attendee name, don't override with buyer name
        }).catch(() => {}),
      );
    }
  }

  // Send tickets to buyer if requested
  // Send buyer ONE email with all their tickets (one email per ticket, not consolidated)
  if (mailOption === "buyer") {
    for (const ticket of tickets) {
      promises.push(
        sendTicketEmail({
          ...ticket,
          attendeeEmail: buyerEmail,
          // Preserve the original attendee name, don't override with buyer name
        }).catch(() => {}),
      );
    }
  }

  // Wait for all email sends to complete
  const results = await Promise.allSettled(promises);

  // Log results
  const successful = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  // If all failed, throw an error
  if (failed > 0 && successful === 0) {
    throw new Error(
      `Failed to send all tickets. All ${failed} email(s) failed.`,
    );
  }
}