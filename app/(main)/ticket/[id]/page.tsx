/* eslint-disable @next/next/no-img-element */
"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Clock,
  CalendarDays,
  ArrowLeft,
  Minus,
  Plus,
  ShoppingCart,
  Tag,
  CheckCircle,
  X,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Event {
  _id: string;
  name: string;
  location: string;
  address: string;
  date: string;
  time: string;
  description: string;
  picture: string;
  ticketTierIds: string[];
  coupons: string[];
  saleEndDate: string;
  saleEndTime: string;
}

interface TicketTier {
  _id: string;
  name: string;
  price: number;
  description: string;
  stock: number | null;
}

interface Coupon {
  _id: string;
  name: string;
  percentage: number;
  active: boolean;
}

interface CartItem {
  eventId: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  tierId: string;
  tierName: string;
  price: number;
  quantity: number;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toLocaleDateString("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(timeStr: string) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const d = new Date();
  d.setHours(Number(h), Number(m));
  return d.toLocaleTimeString("en-CA", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; }

  .ticket-page {
    min-height: 100vh;
    background: #141414;
    color: #f2f2f2;
    font-family: 'DM Sans', sans-serif;
  }

  /* Top bar */
  .ticket-topbar {
    background: #0f0f0f;
    border-bottom: 1px solid #1e1e1e;
    padding: 16px 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .back-link {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 13px; color: #666; text-decoration: none;
    transition: color 0.15s;
  }
  .back-link:hover { color: #ccc; }
  .topbar-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 18px; letter-spacing: 0.05em; color: #f2f2f2;
  }

  /* Layout */
  .ticket-layout {
    display: grid;
    grid-template-columns: 1fr 480px;
    min-height: calc(100vh - 57px);
  }
  @media (max-width: 960px) { .ticket-layout { grid-template-columns: 1fr; } }

  /* Left panel — event info */
  .ticket-left {
    border-right: 1px solid #1e1e1e;
    padding: 48px;
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  @media (max-width: 640px) { .ticket-left { padding: 24px; } }

  .event-image-wrap {
    width: 100%;
    aspect-ratio: 16/9;
    border-radius: 12px;
    overflow: hidden;
    background: #1e1e1e;
    margin-bottom: 32px;
    position: relative;
  }
  .event-image-wrap img {
    width: 100%; height: 100%;
    object-fit: cover;
    object-position: center 10%;
    display: block;
  }
  .event-image-placeholder {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%);
  }
  .event-image-placeholder span {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 72px; color: #333; letter-spacing: 0.05em;
  }

  .event-name-left {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(36px, 5vw, 64px);
    line-height: 0.95;
    letter-spacing: 0.02em;
    color: #f2f2f2;
    margin-bottom: 20px;
  }

  .event-meta-left {
    display: flex; flex-direction: column; gap: 10px;
  }
  .meta-row {
    display: flex; align-items: center; gap: 10px;
    font-size: 14px; color: #777;
  }

  .divider-h { height: 1px; background: #222; margin: 28px 0; }

  .event-desc {
    font-size: 14px; line-height: 1.8;
    color: #666; max-width: 520px;
  }

  /* Right panel — ticket selector */
  .ticket-right {
    background: #111;
    padding: 48px 40px;
    display: flex;
    flex-direction: column;
    gap: 0;
    overflow-y: auto;
  }
  @media (max-width: 640px) { .ticket-right { padding: 24px; } }

  .section-label {
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.2em; text-transform: uppercase;
    color: #e53e3e; margin-bottom: 18px;
  }

  /* Tier rows */
  .tiers-list {
    display: flex; flex-direction: column; gap: 12px;
    margin-bottom: 32px;
  }

  .tier-row {
    background: #1a1a1a;
    border: 1px solid #2a2a2a;
    border-radius: 10px;
    padding: 18px 20px;
    transition: border-color 0.15s;
  }
  .tier-row.has-qty { border-color: #e53e3e; background: #1e1010; }

  .tier-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }
  .tier-name { font-size: 16px; font-weight: 600; color: #f2f2f2; }
  .tier-desc { font-size: 12px; color: #666; margin-top: 3px; max-width: 220px; }
  .tier-price-display {
    text-align: right;
    flex-shrink: 0;
  }
  .tier-price-val {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 28px; color: #f2f2f2; line-height: 1;
  }
  .tier-price-currency { font-size: 11px; color: #555; margin-top: 2px; }

  /* Quantity control */
  .qty-control {
    display: flex; align-items: center; gap: 0;
    background: #111;
    border: 1px solid #333;
    border-radius: 6px;
    width: fit-content;
    overflow: hidden;
  }
  .qty-btn {
    width: 36px; height: 36px;
    display: flex; align-items: center; justify-content: center;
    background: transparent;
    border: none;
    color: #777;
    cursor: pointer;
    transition: background 0.12s, color 0.12s;
    font-family: 'DM Sans', sans-serif;
  }
  .qty-btn:hover:not(:disabled) { background: #1e1e1e; color: #f2f2f2; }
  .qty-btn:disabled { cursor: not-allowed; opacity: 0.3; }
  .qty-btn.decrement:not(:disabled) { color: #e53e3e; }
  .qty-val {
    width: 44px; text-align: center;
    font-size: 15px; font-weight: 600; color: #f2f2f2;
    border-left: 1px solid #2a2a2a; border-right: 1px solid #2a2a2a;
    height: 36px; line-height: 36px;
  }

  .tier-subtotal {
    font-size: 13px; color: #666; margin-top: 10px;
    display: flex; justify-content: space-between;
    align-items: center;
  }
  .tier-subtotal-val { color: #e53e3e; font-weight: 500; }

  /* Coupon */
  .coupon-section { margin-bottom: 28px; }
  .coupon-input-wrap {
    display: flex; gap: 8px;
  }
  .coupon-input {
    flex: 1;
    background: #1a1a1a !important;
    border: 1px solid #2a2a2a !important;
    color: #f2f2f2 !important;
    border-radius: 6px !important;
    padding: 10px 14px !important;
    font-size: 13px !important;
    font-family: 'DM Sans', sans-serif !important;
    outline: none;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    width: 100%;
    transition: border-color 0.15s;
  }
  .coupon-input:focus { border-color: #e53e3e !important; }
  .coupon-input.valid { border-color: #38a169 !important; }
  .coupon-apply-btn {
    padding: 10px 18px;
    background: #222;
    border: 1px solid #333;
    border-radius: 6px;
    color: #aaa;
    font-size: 13px; font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .coupon-apply-btn:hover { background: #2a2a2a; color: #f2f2f2; }
  .coupon-status {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; margin-top: 8px;
  }
  .coupon-valid { color: #38a169; }
  .coupon-invalid { color: #e53e3e; }
  .coupon-clear-btn {
    background: none; border: none; cursor: pointer; color: #555; padding: 0;
    display: flex; align-items: center;
  }
  .coupon-clear-btn:hover { color: #888; }

  /* Order summary */
  .order-summary {
    background: #1a1a1a;
    border: 1px solid #2a2a2a;
    border-radius: 10px;
    padding: 20px;
    margin-bottom: 20px;
  }
  .summary-row {
    display: flex; justify-content: space-between;
    font-size: 14px; color: #777;
    padding: 6px 0;
  }
  .summary-row.discount { color: #38a169; }
  .summary-divider { height: 1px; background: #2a2a2a; margin: 12px 0; }
  .summary-total {
    display: flex; justify-content: space-between;
    font-size: 18px; font-weight: 600; color: #f2f2f2;
  }

  /* Add to cart */
  .add-to-cart-btn {
    display: flex; align-items: center; justify-content: center;
    gap: 10px; width: 100%;
    padding: 18px;
    background: #e53e3e;
    color: #fff;
    border: none; border-radius: 8px;
    font-size: 15px; font-weight: 700;
    font-family: 'DM Sans', sans-serif;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s;
    margin-bottom: 12px;
  }
  .add-to-cart-btn:hover:not(:disabled) { background: #c53030; }
  .add-to-cart-btn:active:not(:disabled) { transform: scale(0.98); }
  .add-to-cart-btn:disabled { background: #2a2a2a; color: #555; cursor: not-allowed; }

  .cart-note {
    font-size: 12px; color: #444;
    text-align: center; line-height: 1.5;
  }

  /* Toast */
  .toast {
    position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
    background: #1a1a1a; border: 1px solid #333;
    border-radius: 10px; padding: 14px 24px;
    display: flex; align-items: center; gap: 10px;
    font-size: 14px; color: #f2f2f2;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    z-index: 100;
    animation: slideUp 0.3s ease;
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateX(-50%) translateY(16px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }

  /* Loading skeleton */
  .skeleton {
    background: linear-gradient(90deg, #1e1e1e 25%, #252525 50%, #1e1e1e 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 6px;
  }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
`;

// ─── Quantity Control ─────────────────────────────────────────────────────────

interface QtyControlProps {
  value: number;
  onChange: (n: number) => void;
  max?: number;
}

function QtyControl({ value, onChange, max = 10 }: QtyControlProps) {
  return (
    <div className="qty-control">
      <button
        className="qty-btn decrement"
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={value === 0}
      >
        <Minus size={14} />
      </button>
      <div className="qty-val">{value}</div>
      <button
        className="qty-btn"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TicketPage() {
  const params = useParams();
  const id = params?.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [tiers, setTiers] = useState<TicketTier[]>([]);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Quantities: tierId → qty
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Coupon
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState(false);

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch("/api/events"),
      fetch("/api/ticket-tiers"),
      fetch("/api/coupons"),
    ])
      .then(async ([evRes, ttRes, cpRes]) => {
        if (!evRes.ok || !ttRes.ok || !cpRes.ok) throw new Error();
        const [allEvents, allTiers, allCoupons]: [
          Event[],
          TicketTier[],
          Coupon[],
        ] = await Promise.all([evRes.json(), ttRes.json(), cpRes.json()]);
        const ev = allEvents.find((e) => e._id === id);
        if (!ev) {
          setError(true);
          return;
        }
        setEvent(ev);
        const eventTiers = allTiers.filter((t) =>
          ev.ticketTierIds.includes(t._id),
        );
        setTiers(eventTiers);
        setAvailableCoupons(
          allCoupons.filter((c) => c.active && ev.coupons.includes(c.name)),
        );

        // Load stored coupon from localStorage
        const storedCoupon = localStorage.getItem("sax-applied-coupon");
        if (storedCoupon) {
          const coupon = JSON.parse(storedCoupon);
          // Only apply if it's valid for this event
          if (ev.coupons.includes(coupon.name)) {
            setAppliedCoupon(coupon);
          }
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const setQty = useCallback((tierId: string, qty: number) => {
    setQuantities((prev) => ({ ...prev, [tierId]: qty }));
  }, []);

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    const found = availableCoupons.find((c) => c.name === code);
    if (found) {
      setAppliedCoupon(found);
      localStorage.setItem("sax-applied-coupon", JSON.stringify(found));
      setCouponError(false);
    } else {
      setAppliedCoupon(null);
      localStorage.removeItem("sax-applied-coupon");
      setCouponError(true);
    }
  };

  const clearCoupon = () => {
    setAppliedCoupon(null);
    localStorage.removeItem("sax-applied-coupon");
    setCouponInput("");
    setCouponError(false);
  };

  // Totals
  const TAX_RATE = 0.13; // 13% HST (Ontario)
  const subtotal = tiers.reduce(
    (acc, t) => acc + t.price * (quantities[t._id] ?? 0),
    0,
  );
  const discount = appliedCoupon
    ? subtotal * (appliedCoupon.percentage / 100)
    : 0;
  const taxable = subtotal - discount;
  const tax = taxable * TAX_RATE;
  const total = taxable + tax;
  const totalItems = Object.values(quantities).reduce((a, b) => a + b, 0);
  const hasItems = totalItems > 0;

  // Sale deadline check
  const isSaleOpen = (() => {
    if (!event) return false;
    // If no deadline set, fall back to the event start datetime
    const endDate = event.saleEndDate || event.date;
    const endTime = event.saleEndTime || event.time || "00:00";
    if (!endDate) return true;
    // Parse as local time to avoid UTC offset issues
    const [year, month, day] = endDate.split("-").map(Number);
    const [hour, minute] = endTime.split(":").map(Number);
    const deadline = new Date(year, month - 1, day, hour, minute);
    return new Date() <= deadline;
  })();

  const handleAddToCart = () => {
    if (!event || !hasItems) return;

    // Build cart items
    const newItems: CartItem[] = tiers
      .filter((t) => (quantities[t._id] ?? 0) > 0)
      .map((t) => ({
        eventId: event._id,
        eventName: event.name,
        eventDate: event.date,
        eventTime: event.time,
        venue: event.location,
        tierId: t._id,
        tierName: t.name,
        price: t.price,
        quantity: quantities[t._id],
      }));

    // Persist to localStorage (replace with Zustand/Context cart store later)
    const existing: CartItem[] = JSON.parse(
      localStorage.getItem("sax-cart") ?? "[]",
    );
    const merged = [...existing];
    for (const item of newItems) {
      const idx = merged.findIndex(
        (i) => i.eventId === item.eventId && i.tierId === item.tierId,
      );
      if (idx >= 0) merged[idx].quantity += item.quantity;
      else merged.push(item);
    }
    localStorage.setItem("sax-cart", JSON.stringify(merged));
    window.dispatchEvent(new Event("cartUpdated"));

    // Show toast
    setToast(
      `${totalItems} ticket${totalItems !== 1 ? "s" : ""} added to cart`,
    );
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) {
    return (
      <div className="ticket-page">
        <style>{CSS}</style>
        <div className="ticket-topbar">
          <div className="skeleton" style={{ height: 16, width: 100 }} />
          <div className="skeleton" style={{ height: 16, width: 160 }} />
        </div>
        <div className="ticket-layout">
          <div className="ticket-left">
            <div
              className="skeleton"
              style={{
                width: "100%",
                aspectRatio: "16/9",
                borderRadius: 12,
                marginBottom: 32,
              }}
            />
            <div
              className="skeleton"
              style={{ height: 52, width: "65%", marginBottom: 20 }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="skeleton" style={{ height: 14, width: "45%" }} />
              <div className="skeleton" style={{ height: 14, width: "55%" }} />
            </div>
          </div>
          <div className="ticket-right" style={{ background: "#111" }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="skeleton"
                style={{ height: 90, borderRadius: 10, marginBottom: 12 }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div
        className="ticket-page"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <style>{CSS}</style>
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 48,
              color: "#333",
            }}
          >
            Event Not Found
          </p>
          <Link href="/event" style={{ color: "#e53e3e", fontSize: 14 }}>
            ← Back to Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="ticket-page">
      <style>{CSS}</style>

      {/* Top bar */}
      <div className="ticket-topbar">
        <Link href={`/live-event/${event._id}`} className="back-link">
          <ArrowLeft size={14} /> Back to Event
        </Link>
        <span className="topbar-title">Select Tickets</span>
        <span style={{ width: 120 }} />
      </div>

      <div className="ticket-layout">
        {/* ── Left: Event Info ── */}
        <div className="ticket-left">
          <div className="event-image-wrap">
            {event.picture ? (
              <img src={event.picture} alt={event.name} />
            ) : (
              <div className="event-image-placeholder">
                <span>{event.name.slice(0, 2).toUpperCase()}</span>
              </div>
            )}
          </div>

          <h1 className="event-name-left">{event.name}</h1>

          <div className="event-meta-left">
            <div className="meta-row">
              <CalendarDays size={15} color="#e53e3e" />
              <span>{formatDate(event.date)}</span>
            </div>
            {event.time && (
              <div className="meta-row">
                <Clock size={15} color="#555" />
                <span>{formatTime(event.time)}</span>
              </div>
            )}
            <div className="meta-row">
              <MapPin size={15} color="#555" />
              <span>
                {event.location}
                {event.address ? ` · ${event.address}` : ""}
              </span>
            </div>
          </div>

          {event.description && (
            <>
              <div className="divider-h" />
              <p className="event-desc">{event.description}</p>
            </>
          )}
        </div>

        {/* ── Right: Ticket Selector ── */}
        <div className="ticket-right">
          {!isSaleOpen ? (
            /* ── Sales Closed ── */
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 320,
                textAlign: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: "rgba(229,62,62,0.1)",
                  border: "1px solid rgba(229,62,62,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 28,
                }}
              >
                🔒
              </div>
              <div>
                <p
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 28,
                    color: "#f2f2f2",
                    letterSpacing: "0.03em",
                    marginBottom: 8,
                  }}
                >
                  Ticket Sales Closed
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: "#555",
                    lineHeight: 1.6,
                    maxWidth: 280,
                  }}
                >
                  Online ticket sales for this event have ended.
                  {event.saleEndDate && event.saleEndTime && (
                    <>
                      {" "}
                      Sales closed on{" "}
                      <strong style={{ color: "#777" }}>
                        {new Date(
                          `${event.saleEndDate}T${event.saleEndTime}`,
                        ).toLocaleString("en-CA", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </strong>
                      .
                    </>
                  )}
                </p>
              </div>
              <Link
                href="/event"
                style={{
                  color: "#e53e3e",
                  fontSize: 13,
                  textDecoration: "none",
                }}
              >
                ← View all events
              </Link>
            </div>
          ) : (
            <>
              <p className="section-label">Choose Tickets</p>

              {tiers.length === 0 ? (
                <p style={{ fontSize: 13, color: "#555", marginBottom: 32 }}>
                  No ticket tiers available for this event yet.
                </p>
              ) : (
                <div className="tiers-list">
                  {tiers.map((tier) => {
                    const qty = quantities[tier._id] ?? 0;
                    const isOutOfStock = tier.stock === 0;
                    const maxQty = tier.stock === null ? 10 : tier.stock;
                    return (
                      <div
                        key={tier._id}
                        className={`tier-row${qty > 0 ? " has-qty" : ""}`}
                        style={{
                          opacity: isOutOfStock ? 0.5 : 1,
                        }}
                      >
                        <div className="tier-top">
                          <div>
                            <p className="tier-name">{tier.name}</p>
                            {tier.description && (
                              <p className="tier-desc">{tier.description}</p>
                            )}
                            {isOutOfStock && (
                              <p
                                style={{
                                  fontSize: 12,
                                  color: "#e53e3e",
                                  fontWeight: 600,
                                  marginTop: 4,
                                }}
                              >
                                Out of Stock
                              </p>
                            )}
                            {tier.stock !== null && tier.stock > 0 && (
                              <p
                                style={{
                                  fontSize: 11,
                                  color: "#666",
                                  marginTop: 2,
                                }}
                              >
                                {tier.stock} remaining
                              </p>
                            )}
                          </div>
                          <div className="tier-price-display">
                            <p className="tier-price-val">
                              ${tier.price.toFixed(2)}
                            </p>
                            <p className="tier-price-currency">CAD / ticket</p>
                          </div>
                        </div>
                        {!isOutOfStock && (
                          <>
                            <QtyControl
                              value={qty}
                              onChange={(n) => setQty(tier._id, n)}
                              max={maxQty}
                            />
                            {qty > 0 && (
                              <div className="tier-subtotal">
                                <span>
                                  {qty} × ${tier.price.toFixed(2)}
                                </span>
                                <span className="tier-subtotal-val">
                                  ${(qty * tier.price).toFixed(2)}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Coupon */}
              {availableCoupons.length > 0 && hasItems && (
                <div className="coupon-section">
                  <p className="section-label">Promo Code</p>
                  {appliedCoupon ? (
                    <div className="coupon-status coupon-valid">
                      <CheckCircle size={14} />
                      <span>
                        <strong>{appliedCoupon.name}</strong> —{" "}
                        {appliedCoupon.percentage}% off applied
                      </span>
                      <button
                        className="coupon-clear-btn"
                        onClick={clearCoupon}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="coupon-input-wrap">
                        <input
                          className={`coupon-input${couponError ? " invalid" : ""}`}
                          value={couponInput}
                          onChange={(e) => {
                            setCouponInput(e.target.value.toUpperCase());
                            setCouponError(false);
                          }}
                          placeholder="ENTER CODE"
                          onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                        />
                        <button
                          className="coupon-apply-btn"
                          onClick={applyCoupon}
                        >
                          <Tag
                            size={13}
                            style={{ display: "inline", marginRight: 4 }}
                          />
                          Apply
                        </button>
                      </div>
                      {couponError && (
                        <div className="coupon-status coupon-invalid">
                          <X size={12} /> Invalid or expired code
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Order Summary */}
              {hasItems && (
                <div className="order-summary">
                  {tiers
                    .filter((t) => (quantities[t._id] ?? 0) > 0)
                    .map((t) => (
                      <div key={t._id} className="summary-row">
                        <span>
                          {t.name} × {quantities[t._id]}
                        </span>
                        <span>${(t.price * quantities[t._id]).toFixed(2)}</span>
                      </div>
                    ))}
                  {appliedCoupon && (
                    <div className="summary-row discount">
                      <span>Promo ({appliedCoupon.name})</span>
                      <span>−${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div
                    className="summary-row"
                    style={{
                      borderTop: "1px solid #2a2a2a",
                      paddingTop: 10,
                      marginTop: 4,
                    }}
                  >
                    <span>Subtotal</span>
                    <span>${taxable.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>HST (13%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="summary-divider" />
                  <div className="summary-total">
                    <span>Total</span>
                    <span>${total.toFixed(2)} CAD</span>
                  </div>
                </div>
              )}

              {/* Add to cart */}
              <button
                className="add-to-cart-btn"
                onClick={handleAddToCart}
                disabled={!hasItems}
              >
                <ShoppingCart size={17} />
                {hasItems
                  ? `Add ${totalItems} Ticket${totalItems !== 1 ? "s" : ""} to Cart`
                  : "Select Tickets Above"}
              </button>
              <p className="cart-note">
                Tickets held for 15 minutes after adding to cart.
                <br />
                Secure checkout · Instant e-ticket delivery.
              </p>
            </>
          )}{" "}
          {/* end isSaleOpen */}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="toast">
          <CheckCircle size={16} color="#38a169" />
          {toast}
          <Link
            href="/cart"
            style={{
              color: "#e53e3e",
              fontSize: 13,
              marginLeft: 4,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            View Cart →
          </Link>
        </div>
      )}
    </div>
  );
}
