"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

interface Event {
  _id: string;
  name: string;
  location: string;
  address: string;
  city: string;
  date: string;
  time: string;
  description: string;
  picture: string;
  ticketTierIds: string[];
  coupons: string[];
  saleEndDate: string;
  saleEndTime: string;
}

// ─── CSS ─────────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
  .home-page *, .home-page *::before, .home-page *::after { box-sizing: border-box; }

  .home-page {
    background: #141414;
    color: #f2f2f2;
    font-family: 'DM Sans', sans-serif;
  }

  /* ── Hero ── */
  .hp-hero {
    position: relative;
    height: 100vh;
    min-height: 600px;
    display: flex;
    align-items: flex-end;
    overflow: hidden;
  }
  .hp-hero-bg {
    position: absolute; inset: 0;
  }
  .hp-hero-bg img {
    width: 100%; height: 100%;
    object-fit: cover;
    object-position: center top;
    display: block;
  }
  .hp-hero-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(0,0,0,0.25) 0%,
      rgba(0,0,0,0.2) 40%,
      rgba(20,20,20,0.85) 75%,
      rgba(20,20,20,1) 100%
    );
  }
  .hp-hero-content {
    position: relative; z-index: 2;
    padding: 0 64px 72px;
    width: 100%;
    max-width: 900px;
  }
  .hp-hero-label {
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.2em; text-transform: uppercase;
    color: #e53e3e; margin-bottom: 14px;
  }
  .hp-hero-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(64px, 10vw, 128px);
    line-height: 0.9; letter-spacing: 0.02em;
    color: #fff; margin-bottom: 20px;
  }
  .hp-hero-sub {
    font-size: clamp(15px, 2vw, 18px);
    color: rgba(255,255,255,0.7);
    max-width: 520px; line-height: 1.7;
    margin-bottom: 36px;
  }
  .hp-hero-cta {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 14px 32px;
    background: #e53e3e; color: #fff;
    border-radius: 8px; text-decoration: none;
    font-size: 14px; font-weight: 700;
    letter-spacing: 0.05em; text-transform: uppercase;
    transition: background 0.15s, transform 0.1s;
  }
  .hp-hero-cta:hover { background: #c53030; }
  .hp-hero-cta:active { transform: scale(0.97); }

  /* Scroll indicator */
  .hp-scroll-hint {
    position: absolute; bottom: 28px; left: 50%;
    transform: translateX(-50%);
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    z-index: 3; opacity: 0.4;
    animation: bobble 2s ease-in-out infinite;
  }
  .hp-scroll-hint span { font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; }
  @keyframes bobble { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(6px)} }

  /* ── Concert banner ── */
  .hp-banner {
    background: #e53e3e;
    padding: 20px 48px;
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 16px;
  }
  .hp-banner-left { display: flex; align-items: center; gap: 14px; }
  .hp-banner-pulse {
    width: 10px; height: 10px; border-radius: 50%;
    background: #fff; flex-shrink: 0;
    animation: pulse 1.5s infinite;
  }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.7)} }
  .hp-banner-text { font-size: 16px; font-weight: 700; color: #fff; }
  .hp-banner-sub { font-size: 13px; color: rgba(255,255,255,0.75); margin-top: 2px; }
  .hp-banner-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 11px 24px; background: #fff; color: #e53e3e;
    border-radius: 8px; text-decoration: none;
    font-size: 13px; font-weight: 800;
    letter-spacing: 0.04em; text-transform: uppercase;
    transition: background 0.15s;
    white-space: nowrap;
  }
  .hp-banner-btn:hover { background: rgba(255,255,255,0.88); }

  /* ── Bio ── */
  .hp-bio {
    padding: 96px 64px;
    max-width: 1200px; margin: 0 auto;
    display: grid; grid-template-columns: 1fr 340px;
    gap: 72px; align-items: center;
  }
  @media (max-width: 900px) { .hp-bio { grid-template-columns: 1fr; gap: 40px; padding: 64px 24px; } }

  .hp-section-label {
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.2em; text-transform: uppercase;
    color: #e53e3e; margin-bottom: 14px;
  }
  .hp-bio-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(40px, 5vw, 64px);
    line-height: 0.95; letter-spacing: 0.02em;
    color: #f2f2f2; margin-bottom: 24px;
  }
  .hp-bio-text {
    font-size: 16px; line-height: 1.85;
    color: #888; margin-bottom: 28px;
    display: -webkit-box;
    -webkit-line-clamp: 5;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .hp-bio-link {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 13px; font-weight: 700;
    letter-spacing: 0.06em; text-transform: uppercase;
    color: #e53e3e; text-decoration: none;
    border-bottom: 1px solid rgba(229,62,62,0.3);
    padding-bottom: 2px;
    transition: border-color 0.15s;
  }
  .hp-bio-link:hover { border-color: #e53e3e; }

  .hp-bio-image-wrap {
    position: relative;
    width: 100%; aspect-ratio: 3/4;
    border-radius: 12px; overflow: hidden;
  }
  @media (max-width: 900px) {
    .hp-bio-image-wrap { aspect-ratio: 16/9; max-width: 400px; }
  }
  .hp-bio-image-wrap img {
    width: 100%; height: 100%;
    object-fit: cover; object-position: center top;
    display: block;
  }
  .hp-bio-image-accent {
    position: absolute; bottom: -12px; right: -12px;
    width: 60%; height: 60%;
    border: 2px solid rgba(229,62,62,0.25);
    border-radius: 12px; pointer-events: none;
  }

  /* ── Gallery ── */
  .hp-gallery { background: #0f0f0f; padding: 96px 64px; }
  @media (max-width: 640px) { .hp-gallery { padding: 64px 24px; } }

  .hp-gallery-header {
    max-width: 1200px; margin: 0 auto 40px;
    display: flex; align-items: flex-end; justify-content: space-between;
  }
  .hp-gallery-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(36px, 5vw, 56px);
    line-height: 0.95; letter-spacing: 0.02em; color: #f2f2f2;
  }
  .hp-gallery-nav { display: flex; gap: 10px; }
  .gallery-nav-btn {
    width: 42px; height: 42px; border-radius: 10px;
    background: #1e1e1e; border: 1px solid #2a2a2a;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #777;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
  }
  .gallery-nav-btn:hover:not(:disabled) { background: #e53e3e; border-color: #e53e3e; color: #fff; }
  .gallery-nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }

  .hp-gallery-grid {
    max-width: 1200px; margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }
  @media (max-width: 900px) { .hp-gallery-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 500px) { .hp-gallery-grid { grid-template-columns: 1fr 1fr; gap: 8px; } }

  .gallery-item {
    aspect-ratio: 4/5;
    border-radius: 10px; overflow: hidden;
    position: relative; background: #1e1e1e;
    cursor: pointer;
  }
  .gallery-item img {
    width: 100%; height: 100%;
    object-fit: cover; display: block;
    transition: transform 0.5s ease;
  }
  .gallery-item:hover img { transform: scale(1.06); }
  .gallery-item-overlay {
    position: absolute; inset: 0;
    background: rgba(0,0,0,0);
    transition: background 0.3s;
  }
  .gallery-item:hover .gallery-item-overlay { background: rgba(229,62,62,0.12); }

  .hp-gallery-dots {
    max-width: 1200px; margin: 24px auto 0;
    display: flex; justify-content: center; gap: 6px;
  }
  .gallery-dot {
    height: 3px; border-radius: 2px;
    background: #2a2a2a; border: none; cursor: pointer;
    transition: all 0.2s; padding: 0;
  }
  .gallery-dot.active { background: #e53e3e; width: 24px; }
  .gallery-dot:not(.active) { width: 8px; }
  .gallery-dot:not(.active):hover { background: #555; }

  @media (max-width: 640px) {
    .hp-hero-content { padding: 0 24px 56px; }
    .hp-banner { padding: 16px 24px; }
  }
`;

// ─── Gallery images ───────────────────────────────────────────────────────────

const GALLERY = [
  "/carousel1.jpg",
  "/carousel2.jpg",
  "/contact-hero.jpg",
  "/home-hero.jpg",
  "/car-ousel.jpg",
  "/home-bio.jpg",
];

const PER_PAGE = 4;

export default function HomePage() {
  const [galleryPage, setGalleryPage] = useState(0);
  const [upcomingEvent, setUpcomingEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("/api/events");
        const events: Event[] = await res.json();

        // Find the next upcoming event (first event with date >= today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const nextEvent = events.find((event) => {
          // Parse date string using local time components to avoid UTC interpretation
          const [year, month, day] = event.date.split("-").map(Number);
          const eventDate = new Date(year, month - 1, day);
          eventDate.setHours(0, 0, 0, 0);
          return eventDate >= today;
        });

        setUpcomingEvent(nextEvent || null);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  const showBanner = !loading && upcomingEvent !== null;

  const totalPages = Math.ceil(GALLERY.length / PER_PAGE);
  const visibleImages = GALLERY.slice(
    galleryPage * PER_PAGE,
    galleryPage * PER_PAGE + PER_PAGE,
  );

  return (
    <div className="home-page">
      <style>{CSS}</style>

      {/* ── Hero ── */}
      <section className="hp-hero">
        <div className="hp-hero-bg">
          <Image
            src="/home-hero.jpg"
            alt="BePraize Sax performing"
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover", objectPosition: "center 20%" }}
          />
          <div className="hp-hero-overlay" />
        </div>

        <div className="hp-hero-content">
          <p className="hp-hero-title">BePraize Sax</p>
          <h1 className="hp-hero-label">
            Professional Singer
            <br />
            and Saxophonist
          </h1>
          <p className="hp-hero-sub">
            Introducing BePraize Sax, a versatile music minister and brilliant
            saxophonist making waves in the Canada music industry.
          </p>
          {/* <Link href="/event" className="hp-hero-cta">
            Explore Events <ArrowRight size={16} />
          </Link> */}
        </div>

        <div className="hp-scroll-hint">
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
          <span>Scroll</span>
        </div>
      </section>

      {/* ── Concert Banner ── */}
      {showBanner && upcomingEvent && (
        <div className="hp-banner">
          <div className="hp-banner-left">
            <div className="hp-banner-pulse" />
            <div>
              <p className="hp-banner-text">
                Live Concert —{" "}
                {new Date(`${upcomingEvent.date}T00:00:00`).toLocaleDateString(
                  "en-CA",
                  {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  },
                )}
              </p>
              <p className="hp-banner-sub">
                {upcomingEvent.location}
                {upcomingEvent.city && ` · ${upcomingEvent.city}`}
              </p>
            </div>
          </div>
          <Link href="/live-event" className="hp-banner-btn">
            Get Tickets <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* ── Biography ── */}
      <section className="hp-bio">
        <div>
          <p className="hp-section-label">Biography</p>
          <h2 className="hp-bio-title">
            The Artist
            <br />
            Behind the Sound
          </h2>
          <p className="hp-bio-text">
            BePraize Sax is a renowned saxophonist, vocalist, and music minister
            whose captivating performances blend the soulful depth of African
            musical heritage with the sophistication of contemporary jazz. Born
            with an innate gift for music, he has spent over two decades
            mastering his craft and gracing prestigious stages across the globe
            — from intimate jazz lounges to grand concert halls — leaving
            audiences transformed by the power of live sound.
          </p>
          <Link href="/about" className="hp-bio-link">
            Full Biography <ArrowRight size={13} />
          </Link>
        </div>

        <div style={{ position: "relative" }}>
          <div className="hp-bio-image-wrap">
            <Image
              src="/home-bio.jpg"
              alt="BePraize Sax"
              fill
              sizes="(max-width: 900px) 100vw, 340px"
              style={{ objectFit: "cover", objectPosition: "center top" }}
            />
          </div>
          <div className="hp-bio-image-accent" />
        </div>
      </section>

      {/* ── Gallery ── */}
      <section className="hp-gallery">
        <div className="hp-gallery-header">
          <div>
            <p className="hp-section-label">Gallery</p>
            <h2 className="hp-gallery-title">
              In the
              <br />
              Spotlight
            </h2>
          </div>
          <div className="hp-gallery-nav">
            <button
              className="gallery-nav-btn"
              onClick={() => setGalleryPage((p) => Math.max(0, p - 1))}
              disabled={galleryPage === 0}
              aria-label="Previous"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              className="gallery-nav-btn"
              onClick={() =>
                setGalleryPage((p) => Math.min(totalPages - 1, p + 1))
              }
              disabled={galleryPage === totalPages - 1}
              aria-label="Next"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="hp-gallery-grid">
          {visibleImages.map((src, i) => (
            <div key={`${galleryPage}-${i}`} className="gallery-item">
              <Image
                src={src}
                alt={`Gallery ${galleryPage * PER_PAGE + i + 1}`}
                fill
                sizes="(max-width: 900px) 50vw, 25vw"
                style={{ objectFit: "cover" }}
              />
              <div className="gallery-item-overlay" />
            </div>
          ))}
        </div>

        <div className="hp-gallery-dots">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              className={`gallery-dot${i === galleryPage ? " active" : ""}`}
              onClick={() => setGalleryPage(i)}
              aria-label={`Page ${i + 1}`}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
