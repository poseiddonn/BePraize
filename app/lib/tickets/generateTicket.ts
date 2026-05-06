import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from "pdf-lib";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import { signTicket } from "./ticketIdentity";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TicketData {
  eventName: string;
  tier: string;
  tierName?: string;
  attendeeName: string;
  ticketId: string;
  orderNumber: string;
  eventDate?: string;
  eventTime?: string;
  venue?: string;
}

// ─── Canvas ───────────────────────────────────────────────────────────────────

const W = 420;
const H = 720;
const TICKET_X = 10;
const TICKET_Y = 10;
const TICKET_W = 400;
const TICKET_H = 700;
const PAD = 34;

// ─── Theme ────────────────────────────────────────────────────────────────────

type Color = [number, number, number];

const COLORS = {
  pageBg: [0.039, 0.039, 0.039] as Color,
  ticketBg: [0.051, 0.051, 0.051] as Color,
  headerBg: [0.051, 0.051, 0.051] as Color,
  bodyBg: [0.067, 0.067, 0.067] as Color,
  footerBg: [0.035, 0.035, 0.035] as Color,
  fieldBg: [0.102, 0.102, 0.102] as Color,
  border: [0.165, 0.165, 0.165] as Color,
  borderSoft: [0.118, 0.118, 0.118] as Color,
  gold: [0.788, 0.659, 0.298] as Color,
  cream: [0.941, 0.91, 0.8] as Color,
  text: [0.878, 0.835, 0.753] as Color,
  muted: [0.18, 0.18, 0.18] as Color,
  qrDark: "#1A1208",
  qrLight: "#F0E8CC",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const c = (v: Color) => rgb(v[0], v[1], v[2]);

function centered(
  text: string,
  size: number,
  font: PDFFont,
  x: number,
  w: number,
) {
  const tw = font.widthOfTextAtSize(text, size);
  return x + (w - tw) / 2;
}

function fitSize(text: string, size: number, font: PDFFont, maxWidth: number) {
  let nextSize = size;
  while (nextSize > 7 && font.widthOfTextAtSize(text, nextSize) > maxWidth) {
    nextSize -= 0.5;
  }
  return nextSize;
}

function drawLabel(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  size = 7.5,
  opacity = 0.6,
) {
  page.drawText(text.toUpperCase(), {
    x,
    y,
    size,
    font,
    color: c(COLORS.gold),
    opacity,
  });
}

function drawFieldCard(
  page: PDFPage,
  label: string,
  value: string,
  x: number,
  y: number,
  w: number,
  h: number,
  fonts: { bold: PDFFont; reg: PDFFont },
) {
  page.drawRectangle({
    x,
    y,
    width: w,
    height: h,
    color: c(COLORS.fieldBg),
  });
  page.drawLine({
    start: { x, y: y + 6 },
    end: { x, y: y + h - 6 },
    thickness: 1.4,
    color: c(COLORS.gold),
    opacity: 0.55,
  });
  drawLabel(page, label, x + 13, y + h - 18, fonts.bold, 6.7, 0.62);
  const valueSize = fitSize(value, 12.5, fonts.bold, w - 26);
  page.drawText(value, {
    x: x + 13,
    y: y + 14,
    size: valueSize,
    font: fonts.bold,
    color: c(COLORS.cream),
    maxWidth: w - 26,
  });
}

function splitTitle(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = (text || "BePraize Sax Live").toUpperCase().split(/\s+/);
  const lines: string[] = [];

  for (const word of words) {
    const last = lines[lines.length - 1];
    const candidate = last ? `${last} ${word}` : word;
    if (lines.length === 0) {
      lines.push(word);
    } else if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      lines[lines.length - 1] = candidate;
    } else {
      lines.push(word);
    }
  }

  if (lines.length > 2) {
    return [lines[0], lines.slice(1).join(" ")];
  }

  return lines;
}

// ─── Main generator ───────────────────────────────────────────────────────────

export async function generateTicket(data: TicketData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([W, H]);

  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const mono = await doc.embedFont(StandardFonts.Courier);
  const monoBold = await doc.embedFont(StandardFonts.CourierBold);
  const fonts = { bold, reg };

  const signature = signTicket({
    ticketId: data.ticketId,
    orderNumber: data.orderNumber,
    tier: data.tier,
  });
  const qrPayload = `BPSAX|TKT:${data.ticketId}|ORD:${data.orderNumber}|TIER:${data.tier}|SIG:${signature}`;
  const qrBuf: Buffer = await QRCode.toBuffer(qrPayload, {
    width: 260,
    margin: 1,
    color: { dark: COLORS.qrDark, light: COLORS.qrLight },
  });
  const qrImg = await doc.embedPng(qrBuf);

  let logoImg = null;
  try {
    const logoBuffer = fs.readFileSync(path.join(process.cwd(), "public", "logo.png"));
    logoImg = await doc.embedPng(logoBuffer);
  } catch {
    /* Use a small text fallback when the logo asset is unavailable. */
  }

  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: c(COLORS.pageBg) });
  page.drawRectangle({
    x: TICKET_X,
    y: TICKET_Y,
    width: TICKET_W,
    height: TICKET_H,
    color: c(COLORS.ticketBg),
    borderColor: c(COLORS.border),
    borderWidth: 1,
  });

  const footerH = 45;
  const headerH = 235;
  const footerY = TICKET_Y;
  const bodyY = footerY + footerH;
  const bodyH = TICKET_H - footerH - headerH;
  const headerY = bodyY + bodyH;

  // Header
  page.drawRectangle({
    x: TICKET_X,
    y: headerY,
    width: TICKET_W,
    height: headerH,
    color: c(COLORS.headerBg),
  });
  page.drawCircle({
    x: TICKET_X + TICKET_W - 72,
    y: headerY + headerH - 78,
    size: 96,
    color: c(COLORS.gold),
    opacity: 0.12,
  });
  for (let x = TICKET_X - 120; x < TICKET_X + TICKET_W + 80; x += 24) {
    page.drawLine({
      start: { x, y: headerY },
      end: { x: x + headerH, y: headerY + headerH },
      thickness: 0.35,
      color: c(COLORS.gold),
      opacity: 0.035,
    });
  }

  drawLabel(page, "Live Concert", TICKET_X + PAD, headerY + headerH - 45, bold, 7.5, 0.58);

  const logoCx = TICKET_X + TICKET_W - PAD - 17;
  const logoCy = headerY + headerH - 53;
  page.drawCircle({ x: logoCx, y: logoCy, size: 27, color: c(COLORS.pageBg) });
  page.drawCircle({
    x: logoCx,
    y: logoCy,
    size: 24,
    color: c(COLORS.ticketBg),
    borderColor: c(COLORS.gold),
    borderWidth: 1,
    opacity: 0.96,
  });
  if (logoImg) {
    const logo = logoImg.scaleToFit(38, 38);
    page.drawImage(logoImg, {
      x: logoCx - logo.width / 2,
      y: logoCy - logo.height / 2,
      width: logo.width,
      height: logo.height,
    });
  } else {
    page.drawText("BP", {
      x: centered("BP", 13, bold, logoCx - 13, 26),
      y: logoCy - 5,
      size: 13,
      font: bold,
      color: c(COLORS.cream),
    });
  }

  const titleLines = splitTitle(data.eventName, bold, 42, 285);
  titleLines.forEach((line, i) => {
    const size = fitSize(line, 42, bold, 300);
    page.drawText(line, {
      x: TICKET_X + PAD,
      y: headerY + 105 - i * 44,
      size,
      font: bold,
      color: c(COLORS.cream),
    });
  });

  // Perforation
  const perfY = headerY;
  for (let x = TICKET_X + 16; x < TICKET_X + TICKET_W - 16; x += 10) {
    page.drawLine({
      start: { x, y: perfY },
      end: { x: x + 4, y: perfY },
      thickness: 0.45,
      color: c(COLORS.border),
      opacity: 0.9,
    });
  }
  page.drawCircle({ x: TICKET_X, y: perfY, size: 10, color: c(COLORS.pageBg) });
  page.drawCircle({ x: TICKET_X + TICKET_W, y: perfY, size: 10, color: c(COLORS.pageBg) });

  // Body
  page.drawRectangle({
    x: TICKET_X,
    y: bodyY,
    width: TICKET_W,
    height: bodyH,
    color: c(COLORS.bodyBg),
  });

  const contentX = TICKET_X + PAD;
  const contentW = TICKET_W - PAD * 2;
  const attendeeY = bodyY + bodyH - 65;
  drawLabel(page, "Attendee", contentX, attendeeY + 29, bold, 7, 0.62);
  const attendeeSize = fitSize(data.attendeeName || "Guest", 22, bold, contentW);
  page.drawText(data.attendeeName || "Guest", {
    x: contentX,
    y: attendeeY + 2,
    size: attendeeSize,
    font: bold,
    color: c(COLORS.cream),
  });
  page.drawLine({
    start: { x: contentX, y: attendeeY - 20 },
    end: { x: contentX + contentW, y: attendeeY - 20 },
    thickness: 0.6,
    color: c(COLORS.borderSoft),
  });

  const cardGap = 11;
  const halfW = (contentW - cardGap) / 2;
  const dateY = attendeeY - 90;
  drawFieldCard(page, "Date", data.eventDate || "TBD", contentX, dateY, halfW, 51, fonts);
  drawFieldCard(page, "Time", data.eventTime || "TBD", contentX + halfW + cardGap, dateY, halfW, 51, fonts);
  drawFieldCard(page, "Venue", data.venue || "Venue TBA", contentX, dateY - 64, contentW, 51, fonts);

  // QR + tier row
  const qrSize = 158;
  const qrX = contentX;
  const qrY = bodyY + 28;
  page.drawRectangle({
    x: qrX,
    y: qrY,
    width: qrSize,
    height: qrSize,
    color: c(COLORS.cream),
    borderColor: c(COLORS.gold),
    borderWidth: 0.6,
  });
  page.drawImage(qrImg, {
    x: qrX + 7,
    y: qrY + 7,
    width: qrSize - 14,
    height: qrSize - 14,
  });

  const rightX = qrX + qrSize + 18;
  const tierName = (data.tierName || data.tier || "VIP Access").toUpperCase();
  const pillText = tierName;
  const pillTextSize = fitSize(pillText, 10.5, bold, contentX + contentW - rightX - 34);
  const pillW = Math.min(contentX + contentW - rightX, bold.widthOfTextAtSize(pillText, pillTextSize) + 43);
  const pillY = qrY + qrSize - 33;
  page.drawRectangle({
    x: rightX,
    y: pillY,
    width: pillW,
    height: 27,
    color: c(COLORS.bodyBg),
    borderColor: c(COLORS.gold),
    borderWidth: 0.7,
    opacity: 0.95,
  });
  page.drawCircle({ x: rightX + 18, y: pillY + 13.5, size: 3.3, color: c(COLORS.gold), opacity: 0.9 });
  page.drawText(pillText, {
    x: rightX + 30,
    y: pillY + 9,
    size: pillTextSize,
    font: bold,
    color: c(COLORS.gold),
  });

  page.drawText(`#${data.ticketId}`, {
    x: rightX,
    y: pillY - 28,
    size: 8.5,
    font: mono,
    color: c(COLORS.muted),
    maxWidth: contentX + contentW - rightX,
  });
  page.drawText(`ORDER: ${data.orderNumber}`, {
    x: rightX,
    y: pillY - 43,
    size: 8.5,
    font: mono,
    color: c(COLORS.muted),
    maxWidth: contentX + contentW - rightX,
  });
  page.drawText("SCAN AT ENTRANCE", {
    x: rightX,
    y: pillY - 72,
    size: 7.4,
    font: bold,
    color: c(COLORS.muted),
  });

  // Footer
  page.drawRectangle({
    x: TICKET_X,
    y: footerY,
    width: TICKET_W,
    height: footerH,
    color: c(COLORS.footerBg),
  });
  page.drawLine({
    start: { x: TICKET_X, y: footerY + footerH },
    end: { x: TICKET_X + TICKET_W, y: footerY + footerH },
    thickness: 0.6,
    color: c(COLORS.borderSoft),
  });
  page.drawText("WWW.BEPRAIZESAX.CA", {
    x: contentX,
    y: footerY + 17,
    size: 7.3,
    font: monoBold,
    color: c(COLORS.muted),
  });
  page.drawLine({
    start: { x: TICKET_X + TICKET_W / 2, y: footerY + 15 },
    end: { x: TICKET_X + TICKET_W / 2, y: footerY + 26 },
    thickness: 0.6,
    color: c(COLORS.borderSoft),
  });
  page.drawCircle({ x: TICKET_X + TICKET_W - 142, y: footerY + 20, size: 2.4, color: c(COLORS.gold), opacity: 0.35 });
  page.drawText("PRESENT QR AT DOOR", {
    x: TICKET_X + TICKET_W - 132,
    y: footerY + 17,
    size: 7.3,
    font: monoBold,
    color: c(COLORS.muted),
  });

  return doc.save();
}