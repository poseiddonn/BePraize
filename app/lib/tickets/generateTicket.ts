import {
  PDFDocument,
  rgb,
  StandardFonts,
  PDFFont,
  PDFPage,
  degrees,
} from "pdf-lib";
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

const W = 420; // width  (points)
const H = 680; // height (points)
const PAD = 28; // horizontal padding

// ─── Themes ───────────────────────────────────────────────────────────────────

interface Theme {
  // Backgrounds
  pageBg: [number, number, number];
  headerBg: [number, number, number];
  sectionBg: [number, number, number];
  qrBg: [number, number, number];
  footerBg: [number, number, number];
  // Text
  accentColor: [number, number, number]; // gold / silver tone
  headingColor: [number, number, number];
  labelColor: [number, number, number];
  valueColor: [number, number, number];
  mutedColor: [number, number, number];
  // Tier strip
  stripBg: [number, number, number];
  stripText: [number, number, number];
  // Lines / borders
  borderColor: [number, number, number];
  dividerColor: [number, number, number];
  // QR colors
  qrDark: string;
  qrLight: string;
  // Labels
  tierLabel: string;
  // subLabel:    string;
  accessLabel: string;
}

const THEME: Theme = {
  // Backgrounds - dark theme matching the provided image
  pageBg: [0.05, 0.04, 0.03],
  headerBg: [0.08, 0.06, 0.02],
  sectionBg: [0.07, 0.055, 0.015],
  qrBg: [0.065, 0.05, 0.01],
  footerBg: [0.04, 0.03, 0.01],
  // Text - gold accents
  accentColor: [0.85, 0.7, 0.3],
  headingColor: [0.98, 0.88, 0.5],
  labelColor: [0.6, 0.48, 0.18],
  valueColor: [0.95, 0.85, 0.45],
  mutedColor: [0.5, 0.4, 0.15],
  // Tier strip - gold
  stripBg: [0.85, 0.7, 0.3],
  stripText: [0.05, 0.04, 0.01],
  // Lines / borders - gold
  borderColor: [0.85, 0.7, 0.3],
  dividerColor: [0.4, 0.3, 0.08],
  // QR colors - gold on dark
  qrDark: "#D4AF37",
  qrLight: "#0D0A05",
  // Labels
  tierLabel: "VIP ACCESS",
  accessLabel: "ALL AREAS",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const c = (v: [number, number, number]) => rgb(v[0], v[1], v[2]);

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

function drawHRule(
  page: PDFPage,
  x: number,
  y: number,
  w: number,
  color: [number, number, number],
  opacity = 1,
  thick = 0.6,
) {
  page.drawLine({
    start: { x, y },
    end: { x: x + w, y },
    thickness: thick,
    color: c(color),
    opacity,
  });
}

function drawRoundRect(
  page: PDFPage,
  x: number,
  y: number,
  w: number,
  h: number,
  bg: [number, number, number],
  border?: [number, number, number],
  bw = 0.8,
) {
  // pdf-lib doesn't support borderRadius natively; simulate with a plain rect
  page.drawRectangle({
    x,
    y,
    width: w,
    height: h,
    color: c(bg),
    borderColor: border ? c(border) : undefined,
    borderWidth: border ? bw : undefined,
  });
}

function drawDiamondOrnament(
  page: PDFPage,
  cx: number,
  cy: number,
  color: [number, number, number],
) {
  const s = 3;
  page.drawRectangle({
    x: cx - s,
    y: cy - s,
    width: s * 2,
    height: s * 2,
    color: c(color),
    rotate: degrees(45),
  });
}

// ─── Main generator ───────────────────────────────────────────────────────────

export async function generateTicket(data: TicketData): Promise<Uint8Array> {
  const t = THEME;
  const doc = await PDFDocument.create();
  const page = doc.addPage([W, H]);

  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const reg = await doc.embedFont(StandardFonts.Helvetica);

  // ── QR code ──────────────────────────────────────────────────────────────
  const signature = signTicket({
    ticketId: data.ticketId,
    orderNumber: data.orderNumber,
    tier: data.tier,
  });
  const qrPayload = `BPSAX|TKT:${data.ticketId}|ORD:${data.orderNumber}|TIER:${data.tier}|SIG:${signature}`;
  const qrBuf: Buffer = await QRCode.toBuffer(qrPayload, {
    width: 220,
    margin: 2,
    color: { dark: t.qrDark, light: t.qrLight },
  });
  const qrImg = await doc.embedPng(qrBuf);

  // ── Logo (optional) ───────────────────────────────────────────────────────
  let logoImg = null;
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), "public", "logo.png"));
    logoImg = await doc.embedPng(buf);
  } catch {
    /* no logo = fine */
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 0: Page background
  // ═══════════════════════════════════════════════════════════════════════════
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: c(t.pageBg) });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION HEIGHTS (from top, Y measured from bottom)
  // ═══════════════════════════════════════════════════════════════════════════
  const FOOTER_H = 42;
  const STRIP_H = 52;
  const QR_SECT_H = 190;
  const INFO_H = 180;
  const HEADER_H = H - FOOTER_H - STRIP_H - QR_SECT_H - INFO_H; // ~216

  const yFooter = 0;
  const yStrip = FOOTER_H;
  const yQr = FOOTER_H + STRIP_H;
  const yInfo = yQr + QR_SECT_H;
  const yHeader = yInfo + INFO_H; // bottom of header band

  // ═══════════════════════════════════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════════════════════════════════
  drawRoundRect(page, 0, yFooter, W, FOOTER_H, t.footerBg);
  drawHRule(page, 0, FOOTER_H, W, t.borderColor, 0.35);

  const website = "WWW.BEPRAIZESAX.CA";
  page.drawText(website, {
    x: centered(website, 8.5, bold, 0, W),
    y: yFooter + 17,
    size: 8.5,
    font: bold,
    color: c(t.accentColor),
    opacity: 0.75,
  });
  // Decorative dashes
  page.drawText("— — —", {
    x: PAD - 4,
    y: yFooter + 17,
    size: 7,
    font: reg,
    color: c(t.mutedColor),
    opacity: 0.5,
  });
  page.drawText("— — —", {
    x: W - PAD - 28,
    y: yFooter + 17,
    size: 7,
    font: reg,
    color: c(t.mutedColor),
    opacity: 0.5,
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TIER STRIP
  // ═══════════════════════════════════════════════════════════════════════════
  drawRoundRect(page, 0, yStrip, W, STRIP_H, t.stripBg);
  drawHRule(page, 0, yStrip + STRIP_H, W, t.borderColor, 0.55);
  drawHRule(page, 0, yStrip, W, t.borderColor, 0.55);

  // Diamond ornaments
  drawDiamondOrnament(page, PAD + 8, yStrip + STRIP_H / 2, t.stripText);
  drawDiamondOrnament(page, W - PAD - 8, yStrip + STRIP_H / 2, t.stripText);

  // Always use the actual tier name passed from the DB.
  // Fall back to the theme default only if no name was provided.
  const tierLabel = (data.tierName || data.tier || t.tierLabel).toUpperCase();
  page.drawText(tierLabel, {
    x: centered(tierLabel, 24, bold, 0, W),
    y: yStrip + 16,
    size: 24,
    font: bold,
    color: c(t.stripText),
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PERFORATION LINE (between footer/strip and QR section)
  // ═══════════════════════════════════════════════════════════════════════════
  const perfY = yQr;
  const holeR = 5.5;
  const holeCount = 11;
  const holeSpacing = W / (holeCount + 1);
  for (let i = 1; i <= holeCount; i++) {
    page.drawCircle({
      x: i * holeSpacing,
      y: perfY,
      size: holeR,
      color: c(t.pageBg),
    });
  }
  page.drawCircle({ x: 0, y: perfY, size: holeR + 1, color: c(t.pageBg) });
  page.drawCircle({ x: W, y: perfY, size: holeR + 1, color: c(t.pageBg) });
  drawHRule(page, 0, perfY, W, t.dividerColor, 0.3, 0.4);

  // ═══════════════════════════════════════════════════════════════════════════
  // QR CODE SECTION
  // ═══════════════════════════════════════════════════════════════════════════
  drawRoundRect(page, 0, yQr, W, QR_SECT_H, t.qrBg);
  drawHRule(page, 0, yQr + QR_SECT_H, W, t.dividerColor, 0.5);

  const qrSize = 130;
  const qrX = (W - qrSize) / 2;
  const qrY = yQr + (QR_SECT_H - qrSize - 28) / 2 + 14;

  // QR frame
  const framePad = 8;
  drawRoundRect(
    page,
    qrX - framePad,
    qrY - framePad,
    qrSize + framePad * 2,
    qrSize + framePad * 2,
    t.sectionBg,
    t.borderColor,
    1,
  );

  // QR image
  page.drawImage(qrImg, { x: qrX, y: qrY, width: qrSize, height: qrSize });

  // "SCAN FOR ENTRY" label below QR
  const scanLabel = "SCAN FOR ENTRY";
  const scanY = yQr + 10;
  drawRoundRect(
    page,
    centered(scanLabel, 9, bold, 0, W) - 12,
    scanY - 2,
    bold.widthOfTextAtSize(scanLabel, 9) + 24,
    18,
    t.stripBg,
  );
  page.drawText(scanLabel, {
    x: centered(scanLabel, 9, bold, 0, W),
    y: scanY + 2,
    size: 9,
    font: bold,
    color: c(t.stripText),
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // INFO SECTION
  // ═══════════════════════════════════════════════════════════════════════════
  drawRoundRect(page, 0, yInfo, W, INFO_H, t.sectionBg);
  drawHRule(page, 0, yInfo + INFO_H, W, t.dividerColor, 0.5);

  const infoFields: { label: string; value: string }[] = [
    { label: "ATTENDEE", value: data.attendeeName.toUpperCase() },
    { label: "TICKET ID", value: `#${data.ticketId}` },
    { label: "ORDER #", value: data.orderNumber },
    ...(data.eventDate ? [{ label: "DATE", value: data.eventDate }] : []),
    ...(data.eventTime ? [{ label: "TIME", value: data.eventTime }] : []),
    ...(data.venue ? [{ label: "VENUE", value: data.venue }] : []),
  ];

  // Two-column layout for info fields
  const colW = (W - PAD * 2 - 20) / 2;
  const rowH = 38;
  const infoTop = yInfo + INFO_H - 18;

  infoFields.forEach((f, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const fx = PAD + col * (colW + 20);
    const fy = infoTop - row * rowH;

    page.drawText(f.label, {
      x: fx,
      y: fy,
      size: 8,
      font: bold,
      color: c(t.labelColor),
    });
    page.drawText(f.value, {
      x: fx,
      y: fy - 14,
      size: 12.5,
      font: bold,
      color: c(t.valueColor),
      maxWidth: colW,
    });
  });

  // Vertical divider between columns
  drawHRule(page, W / 2 + 2, yInfo + 10, 0, t.dividerColor, 0); // placeholder
  page.drawLine({
    start: { x: W / 2, y: yInfo + 10 },
    end: { x: W / 2, y: yInfo + INFO_H - 10 },
    thickness: 0.5,
    color: c(t.dividerColor),
    opacity: 0.45,
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // HEADER SECTION (top of ticket)
  // ═══════════════════════════════════════════════════════════════════════════
  drawRoundRect(page, 0, yHeader, W, HEADER_H, t.headerBg);
  drawHRule(page, 0, yHeader, W, t.dividerColor, 0.5);

  // ── Logo ─────────────────────────────────────────────────────────────────
  let logoH = 0;
  if (logoImg) {
    const ld = logoImg.scaleToFit(60, 60);
    const lx = (W - ld.width) / 2;
    const ly = yHeader + HEADER_H - ld.height - 16;
    page.drawImage(logoImg, {
      x: lx,
      y: ly,
      width: ld.width,
      height: ld.height,
      opacity: 0.95,
    });
    logoH = ld.height + 8;
  }

  // ── Divider line between logo and event name ───────────────────────────────
  const lineW = 80;
  const dividerY = yHeader + HEADER_H - logoH - 20;
  drawHRule(page, (W - lineW) / 2, dividerY, lineW, t.accentColor, 0.4);

  // ── Event name (centered vertically in header, nudged down) ──────────────────
  const eventName = (data.eventName || "EVENT").toUpperCase();
  const headerCenterY = yHeader + HEADER_H / 2;
  const eventNameY = headerCenterY - 10; // Nudge down from center
  page.drawText(eventName, {
    x: centered(eventName, 28, bold, 0, W),
    y: eventNameY,
    size: 28,
    font: bold,
    color: c(t.headingColor),
  });

  // Decorative corner ornaments in header
  const cornOff = 12;
  [
    [PAD - 6, yHeader + HEADER_H - cornOff],
    [W - PAD - 6, yHeader + HEADER_H - cornOff],
    [PAD - 6, yHeader + cornOff / 2],
    [W - PAD - 6, yHeader + cornOff / 2],
  ].forEach(([cx, cy]) =>
    drawDiamondOrnament(page, cx as number, cy as number, t.accentColor),
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // OUTER BORDER (entire ticket)
  // ═══════════════════════════════════════════════════════════════════════════
  page.drawRectangle({
    x: 1.5,
    y: 1.5,
    width: W - 3,
    height: H - 3,
    color: undefined,
    borderColor: c(t.borderColor),
    borderWidth: 1.5,
    opacity: 1,
  });
  // Inner border inset
  page.drawRectangle({
    x: 5,
    y: 5,
    width: W - 10,
    height: H - 10,
    color: undefined,
    borderColor: c(t.borderColor),
    borderWidth: 0.4,
    opacity: 0.3,
  });

  return doc.save();
}
