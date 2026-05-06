import { createHmac, timingSafeEqual } from "crypto";

const DELIVERY_TOKEN_MAX_AGE_SECONDS = 15 * 60;

function getDeliverySecret() {
  return (
    process.env.TICKET_DELIVERY_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    process.env.TICKET_SIGNATURE_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.STRIPE_SECRET_KEY ||
    ""
  );
}

function sign(value: string) {
  const secret = getDeliverySecret();

  if (!secret) {
    throw new Error("Ticket delivery secret is not configured");
  }

  return createHmac("sha256", secret).update(value).digest("hex");
}

export function createTicketDeliveryToken(orderId: string) {
  const exp = Math.floor(Date.now() / 1000) + DELIVERY_TOKEN_MAX_AGE_SECONDS;
  const payload = `${orderId}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyTicketDeliveryToken(orderId: string, token?: string) {
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [tokenOrderId, expRaw, signature] = parts;
  if (tokenOrderId !== orderId) return false;

  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) {
    return false;
  }

  const expected = sign(`${tokenOrderId}.${expRaw}`);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}