import { createHmac, randomInt, timingSafeEqual } from "crypto";

const ORDER_PREFIX = "BP-202606";
const RANDOM_MIN = 1000;
const RANDOM_MAX = 10000;

function fourDigits() {
  return randomInt(RANDOM_MIN, RANDOM_MAX).toString();
}

export function createOrderNumber() {
  return `${ORDER_PREFIX}${fourDigits()}`;
}

export function createTicketId(orderNumber: string) {
  return `${orderNumber}-${fourDigits()}`;
}

export function isSignedTicketFormat(ticketId: string, orderNumber: string) {
  return (
    /^BP-202606\d{4}$/.test(orderNumber) &&
    new RegExp(`^${orderNumber}-\\d{4}$`).test(ticketId)
  );
}

function getTicketSignatureSecret() {
  return (
    process.env.TICKET_SIGNATURE_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.STRIPE_SECRET_KEY ||
    ""
  );
}

export function getTicketSignaturePayload({
  ticketId,
  orderNumber,
  tier,
}: {
  ticketId: string;
  orderNumber: string;
  tier: string;
}) {
  return `${ticketId}|${orderNumber}|${tier}`;
}

export function signTicket(data: {
  ticketId: string;
  orderNumber: string;
  tier: string;
}) {
  const secret = getTicketSignatureSecret();

  if (!secret) {
    throw new Error("Ticket signature secret is not configured");
  }

  return createHmac("sha256", secret)
    .update(getTicketSignaturePayload(data))
    .digest("hex")
    .slice(0, 24);
}

export function verifyTicketSignature({
  ticketId,
  orderNumber,
  tier,
  signature,
}: {
  ticketId: string;
  orderNumber: string;
  tier: string;
  signature?: string;
}) {
  if (!signature) return false;
  const expected = signTicket({ ticketId, orderNumber, tier });
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  return (
    expectedBuffer.length === signatureBuffer.length &&
    timingSafeEqual(expectedBuffer, signatureBuffer)
  );
}
