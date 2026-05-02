/* eslint-disable @next/next/no-img-element */
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, Clock, CalendarDays, ChevronRight } from "lucide-react";

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

type EventStatus = "past" | "today" | "upcoming";

// ─── Utilities ────────────────────────────────────────────────────────────────

function getStatus(dateStr: string, timeStr?: string): EventStatus {
  // Parse date and time using local time components
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr ? timeStr.split(":").map(Number) : [0, 0];
  const eventStart = new Date(year, month - 1, day, hours, minutes);
  const now = new Date();
  // Event is past if current time is 8+ hours after event start
  const eventEnd = new Date(eventStart.getTime() + 8 * 60 * 60 * 1000);
  if (now >= eventEnd) return "past";
  // Event is today if it's on the same calendar day
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDay = new Date(year, month - 1, day);
  eventDay.setHours(0, 0, 0, 0);
  if (eventDay.getTime() === today.getTime()) return "today";
  return "upcoming";
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toLocaleDateString("en-CA", {
    weekday: "short",
    month: "short",
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

  .events-page {
    min-height: 100vh;
    background: #141414;
    color: #f2f2f2;
    font-family: 'DM Sans', sans-serif;
  }

  /* Hero */
  .events-hero {
    background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
    border-bottom: 1px solid #2a2a2a;
    padding: 72px 48px 60px;
    position: relative;
    overflow: hidden;
  }
  .events-hero::before {
    content: 'EVENTS';
    position: absolute;
    right: -20px;
    top: 50%;
    transform: translateY(-50%);
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(120px, 18vw, 240px);
    color: rgba(229,62,62,0.04);
    line-height: 1;
    pointer-events: none;
    user-select: none;
    white-space: nowrap;
  }
  .hero-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #e53e3e;
    margin-bottom: 12px;
  }
  .hero-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(52px, 8vw, 96px);
    line-height: 0.95;
    color: #f2f2f2;
    letter-spacing: 0.02em;
    margin-bottom: 16px;
  }
  .hero-sub {
    font-size: 15px;
    color: #777;
    max-width: 480px;
    line-height: 1.6;
  }

  /* Filter tabs */
  .filter-bar {
    padding: 24px 48px;
    display: flex;
    gap: 8px;
    border-bottom: 1px solid #222;
    background: #141414;
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .filter-btn {
    padding: 8px 20px;
    border-radius: 100px;
    font-size: 13px;
    font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: all 0.15s;
    border: 1px solid #333;
    background: transparent;
    color: #777;
  }
  .filter-btn:hover { border-color: #555; color: #ccc; }
  .filter-btn.active { background: #e53e3e; border-color: #e53e3e; color: #fff; }

  /* Grid */
  .events-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    padding: 24px;
    background: #141414;
    border-top: 1px solid #222;
  }
  @media (max-width: 1024px) { .events-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 600px) { .events-grid { grid-template-columns: 1fr; } }

  .event-card {
    background: #141414;
    display: flex;
    flex-direction: column;
    transition: background 0.2s;
  }
  .event-card:hover { background: #1a1a1a; }

  .card-image-wrap {
    position: relative;
    height: clamp(220px, 20vw, 360px);
    width: 100%;
    overflow: hidden;
    background: #1e1e1e;
  }
  .card-image-wrap img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center top;
    transition: transform 0.5s ease;
    display: block;
  }
  @media (max-width: 600px) { .card-image-wrap { height: 260px; } }
  .event-card:hover .card-image-wrap img { transform: scale(1.04); }
  .card-image-placeholder {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%);
  }
  .card-image-placeholder span {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 48px;
    color: #333;
    letter-spacing: 0.05em;
  }

  /* Status badge */
  .status-badge {
    position: absolute;
    top: 12px; left: 12px;
    padding: 4px 12px;
    border-radius: 100px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .status-past   { background: rgba(0,0,0,0.7); color: #666; backdrop-filter: blur(4px); border: 1px solid #333; }
  .status-today  { background: #e53e3e; color: #fff; }
  .status-upcoming { background: rgba(0,0,0,0.7); color: #f2f2f2; backdrop-filter: blur(4px); border: 1px solid #555; }

  /* Card body */
  .card-body {
    padding: 24px 24px 28px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .card-name {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 28px;
    letter-spacing: 0.03em;
    line-height: 1;
    color: #f2f2f2;
    margin-bottom: 12px;
  }
  .card-past .card-name { color: #555; }

  .card-meta {
    display: flex;
    flex-direction: column;
    gap: 7px;
    margin-bottom: 20px;
    flex: 1;
  }
  .meta-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #777;
  }
  .card-past .meta-row { color: #444; }

  .card-cta {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 24px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    text-decoration: none;
    letter-spacing: 0.04em;
    transition: all 0.15s;
    cursor: pointer;
    border: none;
  }
  .cta-live {
    background: #e53e3e;
    color: #fff;
  }
  .cta-live:hover { background: #c53030; }
  .cta-past {
    background: transparent;
    color: #444;
    border: 1px solid #2a2a2a;
    cursor: default;
    pointer-events: none;
  }

  /* Loading */
  .skeleton {
    background: linear-gradient(90deg, #1e1e1e 25%, #252525 50%, #1e1e1e 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 6px;
  }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  /* Empty / error */
  .state-center {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-height: 320px; gap: 12px; padding: 48px;
    text-align: center;
  }
  .state-title { font-family: 'Bebas Neue', sans-serif; font-size: 36px; color: #333; }
  .state-sub { font-size: 14px; color: #555; }

  /* Responsive hero/filter */
  @media (max-width: 640px) {
    .events-hero { padding: 48px 24px 40px; }
    .filter-bar { padding: 16px 24px; }
  }
`;

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="event-card">
      <div className="card-image-wrap">
        <div className="skeleton" style={{ width: "100%", height: "100%" }} />
      </div>
      <div className="card-body">
        <div
          className="skeleton"
          style={{ height: 28, width: "70%", marginBottom: 16 }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginBottom: 20,
          }}
        >
          <div className="skeleton" style={{ height: 14, width: "50%" }} />
          <div className="skeleton" style={{ height: 14, width: "60%" }} />
        </div>
        <div className="skeleton" style={{ height: 42, borderRadius: 6 }} />
      </div>
    </div>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────────────

function EventCard({ event }: { event: Event }) {
  const status = getStatus(event.date, event.time);
  const isPast = status === "past";

  return (
    <div className={`event-card${isPast ? " card-past" : ""}`}>
      <div className="card-image-wrap">
        {event.picture ? (
          <img src={event.picture} alt={event.name} />
        ) : (
          <div className="card-image-placeholder">
            <span>{event.name.slice(0, 2).toUpperCase()}</span>
          </div>
        )}
        <span className={`status-badge status-${status}`}>
          {status === "today"
            ? "🔴 Live Today"
            : status === "upcoming"
              ? "Upcoming"
              : "Past Event"}
        </span>
      </div>

      <div className="card-body">
        <h2 className="card-name">{event.name}</h2>
        <div className="card-meta">
          <div className="meta-row">
            <CalendarDays size={14} color={isPast ? "#333" : "#e53e3e"} />
            <span>{formatDate(event.date)}</span>
          </div>
          {event.time && (
            <div className="meta-row">
              <Clock size={14} color={isPast ? "#333" : "#555"} />
              <span>{formatTime(event.time)}</span>
            </div>
          )}
          <div className="meta-row">
            <MapPin size={14} color={isPast ? "#333" : "#555"} />
            <span>
              {event.location}
              {event.address ? `, ${event.address}` : ""}
            </span>
          </div>
        </div>

        {isPast ? (
          <div className="card-cta cta-past">Event Ended</div>
        ) : (
          <Link href={`/live-event/${event._id}`} className="card-cta cta-live">
            View Event <ChevronRight size={15} />
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Filter = "all" | "upcoming" | "past";

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    fetch("/api/events")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data: Event[]) => {
        // Upcoming & today first (soonest → latest), then past (most recent → oldest)
        const sorted = [...data].sort((a, b) => {
          const aIsPast = getStatus(a.date, a.time) === "past";
          const bIsPast = getStatus(b.date, b.time) === "past";
          if (aIsPast !== bIsPast) return aIsPast ? 1 : -1;
          const dir = aIsPast ? -1 : 1;
          // Parse dates using local time components to avoid UTC interpretation
          const [aYear, aMonth, aDay] = a.date.split("-").map(Number);
          const [bYear, bMonth, bDay] = b.date.split("-").map(Number);
          const aDate = new Date(aYear, aMonth - 1, aDay);
          const bDate = new Date(bYear, bMonth - 1, bDay);
          return dir * (aDate.getTime() - bDate.getTime());
        });
        setEvents(sorted);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const filtered = events.filter((ev) => {
    if (filter === "all") return true;
    const s = getStatus(ev.date, ev.time);
    if (filter === "upcoming") return s === "upcoming" || s === "today";
    return s === "past";
  });

  const upcomingCount = events.filter(
    (e) => getStatus(e.date, e.time) !== "past",
  ).length;

  return (
    <div className="events-page">
      <style>{CSS}</style>

      {/* Hero */}
      <section className="events-hero">
        <p className="hero-label">BePraize Sax</p>
        <h1 className="hero-title">
          All
          <br />
          Events
        </h1>
        <p className="hero-sub">
          {loading
            ? "Loading events…"
            : `${upcomingCount} upcoming event${upcomingCount !== 1 ? "s" : ""}. Secure your spot before it's gone.`}
        </p>
      </section>

      {/* Filter bar */}
      <div className="filter-bar">
        {(["all", "upcoming", "past"] as Filter[]).map((f) => (
          <button
            key={f}
            className={`filter-btn${filter === f ? " active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all"
              ? "All Events"
              : f === "upcoming"
                ? "Upcoming"
                : "Past"}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && (
        <div className="events-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {error && (
        <div className="state-center">
          <p className="state-title">Couldn&#39;t Load Events</p>
          <p className="state-sub">Check your connection and try again.</p>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="state-center">
          <p className="state-title">No Events Found</p>
          <p className="state-sub">
            {filter === "past"
              ? "No past events yet."
              : "Check back soon for upcoming events."}
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="events-grid">
          {filtered.map((ev) => (
            <EventCard key={ev._id} event={ev} />
          ))}
        </div>
      )}
    </div>
  );
}
