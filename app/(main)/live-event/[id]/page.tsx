/* eslint-disable @next/next/no-img-element */
"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MapPin, Clock, CalendarDays, ArrowLeft, Ticket } from "lucide-react";

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
}

interface TicketTier {
  _id: string;
  name: string;
  price: number;
  description: string;
  stock: number | null;
}

type EventStatus = "past" | "today" | "upcoming";

// ─── Utilities ────────────────────────────────────────────────────────────────

function getStatus(dateStr: string): EventStatus {
  // Parse date string using local time components to avoid UTC interpretation
  const [year, month, day] = dateStr.split("-").map(Number);
  const eventDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);
  if (eventDate.getTime() < today.getTime()) return "past";
  if (eventDate.getTime() === today.getTime()) return "today";
  return "upcoming";
}

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

function daysUntil(dateStr: string) {
  const eventDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil(
    (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');

  .live-page *, .live-page *::before, .live-page *::after { box-sizing: border-box; }

  .live-page {
    min-height: 100vh;
    background: #141414;
    color: #f2f2f2;
    font-family: 'DM Sans', sans-serif;
  }

  /* ── Hero — text-only, matches /event page style ── */
  .live-page .live-hero {
    position: relative;
    background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
    border-bottom: 1px solid #2a2a2a;
    padding: 96px 64px 72px;
    overflow: hidden;
  }

  /* Watermark event name in background */
  .live-page .live-hero::before {
    content: 'LIVE';
    position: absolute;
    right: -10px;
    top: 50%;
    transform: translateY(-50%);
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(140px, 20vw, 260px);
    color: rgba(229,62,62,0.04);
    line-height: 1;
    pointer-events: none;
    user-select: none;
    white-space: nowrap;
  }

  .live-page .hero-inner {
    position: relative;
    z-index: 2;
    max-width: 900px;
  }

  .live-page .back-link {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 13px; color: #555; text-decoration: none;
    margin-bottom: 28px;
    transition: color 0.15s;
  }
  .live-page .back-link:hover { color: #ccc; }
  .live-page .back-link svg { flex-shrink: 0; }

  .live-page .hero-label {
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.2em; text-transform: uppercase;
    color: #e53e3e; margin-bottom: 14px;
    display: flex; align-items: center; gap: 8px;
  }

  .live-page .live-badge-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #e53e3e;
    animation: live-pulse 1.5s infinite;
    display: inline-block;
  }
  @keyframes live-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.4; transform: scale(0.65); }
  }

  .live-page .hero-name {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(52px, 8vw, 96px);
    line-height: 0.95;
    letter-spacing: 0.02em;
    color: #f2f2f2;
    margin-bottom: 28px;
  }

  .live-page .hero-meta {
    display: flex; flex-wrap: wrap; gap: 20px;
  }
  .live-page .hero-meta-item {
    display: flex; align-items: center; gap: 8px;
    font-size: 14px; color: #888;
  }

  /* ── Countdown bar ── */
  .live-page .countdown-bar {
    background: #e53e3e;
    padding: 16px 64px;
    display: flex; align-items: center; gap: 16px;
    font-size: 14px; font-weight: 500; color: #fff;
    letter-spacing: 0.02em;
  }
  .live-page .countdown-num {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 28px; line-height: 1;
  }

  /* ── Body ── */
  .live-page .live-body {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 0;
    max-width: 1200px;
    margin: 0 auto;
    padding: 56px 64px 80px;
  }
  @media (max-width: 900px) {
    .live-page .live-body { grid-template-columns: 1fr; padding: 32px 24px 64px; }
  }

  .live-page .section-label {
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.2em; text-transform: uppercase;
    color: #e53e3e; margin-bottom: 16px;
  }

  /* Event picture in body */
  .live-page .event-picture-wrap {
    width: 100%;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 36px;
    background: #1e1e1e;
    border: 1px solid #2a2a2a;
    aspect-ratio: 16/9;
  }
  .live-page .event-picture-wrap img {
    width: 100%; height: 100%;
    object-fit: cover; object-position: center top;
    display: block;
  }

  .live-page .about-text {
    font-size: 16px; line-height: 1.8;
    color: #aaa;
    max-width: 560px;
    padding-right: 48px;
  }
  @media (max-width: 900px) { .live-page .about-text { padding-right: 0; max-width: 100%; } }

  .live-page .divider { height: 1px; background: #222; margin: 40px 0; }

  .live-page .detail-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  @media (max-width: 500px) { .live-page .detail-grid { grid-template-columns: 1fr; } }

  .live-page .detail-card {
    background: #1e1e1e;
    border: 1px solid #2a2a2a;
    border-radius: 10px;
    padding: 20px;
  }
  .live-page .detail-card-label {
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.15em; text-transform: uppercase;
    color: #555; margin-bottom: 8px;
  }
  .live-page .detail-card-value { font-size: 15px; font-weight: 500; color: #f2f2f2; }
  .live-page .detail-card-sub { font-size: 13px; color: #666; margin-top: 3px; }

  /* ── Sidebar ── */
  .live-page .live-sidebar {
    padding-left: 40px;
    border-left: 1px solid #222;
  }
  @media (max-width: 900px) {
    .live-page .live-sidebar { padding-left: 0; border-left: none; border-top: 1px solid #222; padding-top: 40px; }
  }
  .live-page .sidebar-sticky { position: sticky; top: 24px; }

  .live-page .tier-preview { display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px; }
  .live-page .tier-card {
    background: #1e1e1e; border: 1px solid #2a2a2a;
    border-radius: 10px; padding: 16px 18px;
    display: flex; justify-content: space-between; align-items: center;
    transition: border-color 0.15s;
  }
  .live-page .tier-card:hover { border-color: #444; }
  .live-page .tier-name { font-size: 15px; font-weight: 500; color: #f2f2f2; }
  .live-page .tier-desc { font-size: 12px; color: #666; margin-top: 3px; }
  .live-page .tier-price {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 26px; color: #f2f2f2; text-align: right;
  }
  .live-page .tier-price-label { font-size: 11px; color: #555; text-align: right; }

  .live-page .buy-btn {
    display: flex; align-items: center; justify-content: center;
    gap: 10px; width: 100%; padding: 18px;
    background: #e53e3e; color: #fff; border: none;
    border-radius: 8px; font-size: 15px; font-weight: 700;
    font-family: 'DM Sans', sans-serif; letter-spacing: 0.04em;
    text-transform: uppercase; cursor: pointer; text-decoration: none;
    transition: background 0.15s, transform 0.1s;
  }
  .live-page .buy-btn:hover { background: #c53030; }
  .live-page .buy-btn:active { transform: scale(0.98); }

  .live-page .buy-note {
    font-size: 12px; color: #555;
    text-align: center; margin-top: 12px; line-height: 1.5;
  }

  .live-page .past-overlay {
    background: #1e1e1e; border: 1px solid #2a2a2a;
    border-radius: 10px; padding: 24px; text-align: center;
  }
  .live-page .past-overlay-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 24px; color: #444; margin-bottom: 8px;
  }
  .live-page .past-overlay-sub { font-size: 13px; color: #555; }

  /* Loading skeleton */
  .live-page .skeleton {
    background: linear-gradient(90deg, #1e1e1e 25%, #252525 50%, #1e1e1e 75%);
    background-size: 200% 100%;
    animation: live-shimmer 1.5s infinite;
    border-radius: 6px;
  }
  @keyframes live-shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  @media (max-width: 640px) {
    .live-page .live-hero { padding: 80px 24px 56px; }
    .live-page .countdown-bar { padding: 14px 24px; }
  }
`;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LiveEventPage() {
  const params = useParams();
  const id = params?.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [tiers, setTiers] = useState<TicketTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([fetch("/api/events"), fetch("/api/ticket-tiers")])
      .then(async ([evRes, ttRes]) => {
        if (!evRes.ok || !ttRes.ok) throw new Error();
        const [allEvents, allTiers]: [Event[], TicketTier[]] =
          await Promise.all([evRes.json(), ttRes.json()]);
        const ev = allEvents.find((e) => e._id === id);
        if (!ev) {
          setError(true);
          return;
        }
        setEvent(ev);
        setTiers(allTiers.filter((t) => ev.ticketTierIds.includes(t._id)));
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="live-page">
        <style>{CSS}</style>
        <div style={{ padding: "96px 64px 72px", background: "#0f0f0f" }}>
          <div
            className="skeleton"
            style={{ height: 14, width: 80, marginBottom: 28 }}
          />
          <div
            className="skeleton"
            style={{ height: 12, width: 120, marginBottom: 14 }}
          />
          <div
            className="skeleton"
            style={{ height: 80, width: "60%", marginBottom: 28 }}
          />
          <div style={{ display: "flex", gap: 20 }}>
            <div className="skeleton" style={{ height: 14, width: 180 }} />
            <div className="skeleton" style={{ height: 14, width: 120 }} />
          </div>
        </div>
        <div
          style={{
            padding: "56px 64px",
            display: "grid",
            gridTemplateColumns: "1fr 380px",
            gap: 0,
          }}
        >
          <div
            style={{
              paddingRight: 48,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div
              className="skeleton"
              style={{ width: "100%", aspectRatio: "16/9", borderRadius: 12 }}
            />
            <div className="skeleton" style={{ height: 14, width: "90%" }} />
            <div className="skeleton" style={{ height: 14, width: "80%" }} />
            <div className="skeleton" style={{ height: 14, width: "85%" }} />
          </div>
          <div
            style={{
              paddingLeft: 40,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              className="skeleton"
              style={{ height: 90, borderRadius: 10 }}
            />
            <div
              className="skeleton"
              style={{ height: 90, borderRadius: 10 }}
            />
            <div
              className="skeleton"
              style={{ height: 56, borderRadius: 8, marginTop: 8 }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error || !event) {
    return (
      <div
        className="live-page"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "80vh",
        }}
      >
        <style>{CSS}</style>
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 48,
              color: "#333",
              marginBottom: 12,
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

  const status = getStatus(event.date);
  const isPast = status === "past";
  const days = daysUntil(event.date);
  const lowestPrice =
    tiers.length > 0 ? Math.min(...tiers.map((t) => t.price)) : null;

  return (
    <div className="live-page">
      <style>{CSS}</style>

      {/* ── Hero — text-based, matching /event page style ── */}
      <section className="live-hero">
        <div className="hero-inner">
          <Link href="/event" className="back-link">
            <ArrowLeft size={14} /> All Events
          </Link>

          {/* Status label */}
          <p className="hero-label">
            {status === "today" ? (
              <>
                <span className="live-badge-dot" /> Happening Today
              </>
            ) : isPast ? (
              "Past Event"
            ) : (
              "Upcoming Event"
            )}
          </p>

          <h1 className="hero-name">{event.name}</h1>

          <div className="hero-meta">
            <div className="hero-meta-item">
              <CalendarDays size={15} color="#e53e3e" />
              <span>{formatDate(event.date)}</span>
            </div>
            {event.time && (
              <div className="hero-meta-item">
                <Clock size={15} color="#555" />
                <span>{formatTime(event.time)}</span>
              </div>
            )}
            <div className="hero-meta-item">
              <MapPin size={15} color="#555" />
              <span>
                {event.location}
                {event.address ? ` · ${event.address}` : ""}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Countdown bar ── */}
      {!isPast && days > 0 && (
        <div className="countdown-bar">
          <span className="countdown-num">{days}</span>
          <span>day{days !== 1 ? "s" : ""} until the event</span>
          {lowestPrice !== null && (
            <span style={{ marginLeft: "auto", opacity: 0.8 }}>
              Tickets from ${lowestPrice.toFixed(2)} CAD
            </span>
          )}
        </div>
      )}

      {/* ── Body ── */}
      <div className="live-body">
        {/* Main column */}
        <div>
          {/* Event picture — in body, not hero */}
          {event.picture && (
            <div className="event-picture-wrap">
              <img src={event.picture} alt={event.name} />
            </div>
          )}

          <p className="section-label">About This Event</p>
          <p className="about-text">
            {event.description || "More details coming soon."}
          </p>

          <div className="divider" />

          <p className="section-label">Event Details</p>
          <div className="detail-grid">
            <div className="detail-card">
              <p className="detail-card-label">Date</p>
              <p className="detail-card-value">{formatDate(event.date)}</p>
            </div>
            {event.time && (
              <div className="detail-card">
                <p className="detail-card-label">Doors Open</p>
                <p className="detail-card-value">{formatTime(event.time)}</p>
              </div>
            )}
            <div className="detail-card">
              <p className="detail-card-label">Venue</p>
              <p className="detail-card-value">{event.location}</p>
              {event.address && (
                <p className="detail-card-sub">{event.address}</p>
              )}
            </div>
            {tiers.length > 0 && (
              <div className="detail-card">
                <p className="detail-card-label">Ticket Tiers</p>
                <p className="detail-card-value">{tiers.length} Available</p>
                {lowestPrice !== null && (
                  <p className="detail-card-sub">
                    From ${lowestPrice.toFixed(2)} CAD
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="live-sidebar">
          <div className="sidebar-sticky">
            {isPast ? (
              <div className="past-overlay">
                <p className="past-overlay-title">This Event Has Ended</p>
                <p className="past-overlay-sub">
                  Check out our upcoming events for future shows.
                </p>
                <Link
                  href="/event"
                  style={{
                    display: "inline-block",
                    marginTop: 16,
                    color: "#e53e3e",
                    fontSize: 13,
                  }}
                >
                  View All Events →
                </Link>
              </div>
            ) : (
              <>
                <p className="section-label">Ticket Tiers</p>
                {tiers.length > 0 ? (
                  <div className="tier-preview">
                    {tiers.map((t) => (
                      <div key={t._id} className="tier-card">
                        <div>
                          <p className="tier-name">{t.name}</p>
                          {t.description && (
                            <p className="tier-desc">{t.description}</p>
                          )}
                          {t.stock === 0 && (
                            <p
                              style={{
                                fontSize: 11,
                                color: "#e53e3e",
                                fontWeight: 600,
                                marginTop: 4,
                              }}
                            >
                              Out of Stock
                            </p>
                          )}
                          {t.stock !== null &&
                            t.stock !== 0 &&
                            t.stock !== undefined && (
                              <p
                                style={{
                                  fontSize: 10,
                                  color: "#666",
                                  marginTop: 2,
                                }}
                              >
                                {t.stock} remaining
                              </p>
                            )}
                        </div>
                        <div>
                          <p className="tier-price">${t.price.toFixed(2)}</p>
                          <p className="tier-price-label">CAD</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: "#555", marginBottom: 24 }}>
                    Ticket information coming soon.
                  </p>
                )}

                <Link href={`/ticket/${event._id}`} className="buy-btn">
                  <Ticket size={17} /> Buy Tickets
                </Link>
                <p className="buy-note">
                  Secure checkout · Instant confirmation
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
