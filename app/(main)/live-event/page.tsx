// app/live-event/page.tsx
// Server Component — queries MongoDB directly, no client JS needed.
// Redirects to the next upcoming event, or renders a "no event" page.

import { redirect } from "next/navigation";
import Link from "next/link";
import { connectDB } from "@/app/lib/mongodb";
import { EventModel } from "@/app/lib/models/Event";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .no-event-page {
    min-height: calc(100vh - 56px);
    background: #141414;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'DM Sans', sans-serif;
    padding: 48px 24px;
  }
  .no-event-inner {
    text-align: center;
    max-width: 480px;
  }
  .no-event-icon {
    width: 80px; height: 80px;
    border-radius: 20px;
    background: rgba(229,62,62,0.08);
    border: 1px solid rgba(229,62,62,0.2);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 32px;
    font-size: 36px;
  }
  .no-event-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #e53e3e;
    margin-bottom: 12px;
  }
  .no-event-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(42px, 7vw, 72px);
    line-height: 0.95;
    letter-spacing: 0.02em;
    color: #f2f2f2;
    margin-bottom: 20px;
  }
  .no-event-sub {
    font-size: 15px;
    color: #666;
    line-height: 1.7;
    margin-bottom: 36px;
  }
  .no-event-divider {
    width: 40px; height: 2px;
    background: #e53e3e;
    margin: 0 auto 36px;
    opacity: 0.5;
  }
  .no-event-link {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 14px 28px;
    background: #e53e3e;
    color: #fff;
    border-radius: 8px;
    text-decoration: none;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    transition: background 0.15s;
  }
  .no-event-link:hover { background: #c53030; }
  .no-event-ghost {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 12px 24px;
    color: #555;
    border: 1px solid #2a2a2a;
    border-radius: 8px;
    text-decoration: none;
    font-size: 13px;
    margin-left: 12px;
    transition: color 0.15s, border-color 0.15s;
  }
  .no-event-ghost:hover { color: #aaa; border-color: #444; }
`;

export default async function LiveEventIndex() {
  await connectDB();

  const now = new Date();

  // Fetch all events and filter for upcoming (current time < event start + 8 hours)
  const allEvents = await EventModel.find()
    .sort({ date: 1 })
    .lean<{ _id: { toString(): string }; date: string; time?: string }[]>();

  const upcoming = allEvents.find(
    (event: { _id: { toString(): string }; date: string; time?: string }) => {
      // Parse date and time using local time components
      const [year, month, day] = event.date.split("-").map(Number);
      const [hours, minutes] = event.time
        ? event.time.split(":").map(Number)
        : [0, 0];
      const eventStart = new Date(year, month - 1, day, hours, minutes);
      // Event is upcoming if current time is less than 8 hours after event start
      const eventEnd = new Date(eventStart.getTime() + 8 * 60 * 60 * 1000);
      return now < eventEnd;
    },
  );

  // Redirect immediately if there's an upcoming event
  if (upcoming) {
    redirect(`/live-event/${upcoming._id.toString()}`);
  }

  // No upcoming events — render a friendly message
  return (
    <div className="no-event-page">
      <style>{CSS}</style>
      <div className="no-event-inner">
        <div className="no-event-icon">🎷</div>
        <p className="no-event-label">BePraize Sax</p>
        <h1 className="no-event-title">
          No Current
          <br />
          Live Event
        </h1>
        <div className="no-event-divider" />
        <p className="no-event-sub">
          There are no upcoming events scheduled right now.
          <br />
          Check back soon — the next show will be announced here.
        </p>
        <div>
          <Link href="/event" className="no-event-link">
            View All Events
          </Link>
          <Link href="/" className="no-event-ghost">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
