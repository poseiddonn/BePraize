import Image from "next/image";
import Link from "next/link";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
  .about-page *, .about-page *::before, .about-page *::after { box-sizing: border-box; }

  .about-page {
    background: #141414;
    color: #f2f2f2;
    font-family: 'DM Sans', sans-serif;
  }

  /* ── Hero ── */
  .about-hero {
    position: relative;
    height: 80vh;
    min-height: 480px;
    display: flex;
    align-items: flex-end;
    overflow: hidden;
  }
  .about-hero-bg { position: absolute; inset: 0; }
  .about-hero-bg img {
    width: 100%; height: 100%;
    object-fit: cover; object-position: center 30%;
    display: block;
  }
  .about-hero-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(0,0,0,0.2) 0%,
      rgba(0,0,0,0.3) 40%,
      rgba(20,20,20,0.88) 75%,
      rgba(20,20,20,1) 100%
    );
  }
  .about-hero-content {
    position: relative; z-index: 2;
    padding: 0 64px 64px;
    width: 100%;
  }
  .about-hero-label {
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.2em; text-transform: uppercase;
    color: #e53e3e; margin-bottom: 12px;
  }
  .about-hero-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(60px, 9vw, 110px);
    line-height: 0.9; letter-spacing: 0.02em;
    color: #fff;
  }
  @media (max-width: 640px) {
    .about-hero-content { padding: 0 24px 48px; }
  }

  /* ── Section shared ── */
  .about-section {
    max-width: 1200px;
    margin: 0 auto;
    padding: 96px 64px;
  }
  @media (max-width: 768px) { .about-section { padding: 64px 24px; } }

  .about-section-label {
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.2em; text-transform: uppercase;
    color: #e53e3e; margin-bottom: 14px;
  }
  .about-section-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(36px, 5vw, 60px);
    line-height: 0.95; letter-spacing: 0.02em;
    color: #f2f2f2; margin-bottom: 36px;
  }

  /* ── Bio ── */
  .about-bio-grid {
    display: grid;
    grid-template-columns: 1fr 400px;
    grid-template-rows: auto auto auto;
    grid-template-areas:
      "heading heading"
      "top   image"
      "bottom image";
    gap: 0 72px;
    align-items: start;
  }
  .about-bio-heading { grid-area: heading; }
  .about-bio-top    { grid-area: top; }
  .about-bio-bottom { grid-area: bottom; padding-top: 20px; }
  .about-bio-image  { grid-area: image; position: relative; }

  @media (max-width: 1000px) {
    .about-bio-grid {
      grid-template-columns: 1fr;
      grid-template-rows: unset;
      grid-template-areas: unset;
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    .about-bio-heading { order: 1; }
    .about-bio-top     { order: 2; }
    .about-bio-image   { order: 3; margin: 32px 0; }
    .about-bio-bottom  { order: 4; }
  }

  .about-bio-text {
    font-size: 16px; line-height: 1.9;
    color: #888; margin-bottom: 20px;
  }
  .about-bio-text:last-of-type { margin-bottom: 32px; }

  .about-cta-row { display: flex; gap: 12px; flex-wrap: wrap; }
  .about-cta-primary {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 13px 28px; background: #e53e3e; color: #fff;
    border-radius: 8px; text-decoration: none;
    font-size: 13px; font-weight: 700;
    letter-spacing: 0.04em; text-transform: uppercase;
    transition: background 0.15s;
  }
  .about-cta-primary:hover { background: #c53030; }
  .about-cta-ghost {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 13px 28px;
    background: transparent; color: #777;
    border: 1px solid #2a2a2a; border-radius: 8px;
    text-decoration: none; font-size: 13px; font-weight: 600;
    letter-spacing: 0.04em; text-transform: uppercase;
    transition: color 0.15s, border-color 0.15s;
  }
  .about-cta-ghost:hover { color: #f2f2f2; border-color: #555; }

  .about-image-wrap {
    position: relative;
    width: 100%; aspect-ratio: 3/4;
    border-radius: 12px; overflow: hidden;
    background: #1e1e1e;
  }
  @media (max-width: 1000px) {
    .about-image-wrap { position: relative; height: 0; padding-bottom: 450px; width: 100%; }
  }
  .about-image-wrap img {
    width: 100%; height: 100%;
    object-fit: cover; object-position: center top;
    display: block;
  }
  .about-image-accent {
    position: absolute; bottom: -14px; left: -14px;
    width: 55%; height: 55%;
    border: 2px solid rgba(229,62,62,0.2);
    border-radius: 12px; pointer-events: none;
  }

  /* ── Stats bar ── */
  .about-stats {
    background: #0f0f0f;
    border-top: 1px solid #1e1e1e;
    border-bottom: 1px solid #1e1e1e;
  }
  .about-stats-inner {
    max-width: 1200px; margin: 0 auto;
    padding: 56px 64px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0;
  }
  @media (max-width: 768px) {
    .about-stats-inner { grid-template-columns: repeat(2, 1fr); padding: 40px 24px; }
  }
  @media (max-width: 400px) { .about-stats-inner { grid-template-columns: 1fr; } }

  .about-stat {
    padding: 0 32px;
    border-right: 1px solid #1e1e1e;
    text-align: center;
  }
  .about-stat:first-child { border-left: 1px solid #1e1e1e; }
  @media (max-width: 768px) {
    .about-stat { border: none; padding: 20px 16px; border-bottom: 1px solid #1e1e1e; }
    .about-stat:nth-child(odd) { border-right: 1px solid #1e1e1e; }
  }
  .about-stat-num {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 52px; line-height: 1;
    color: #e53e3e; margin-bottom: 6px;
  }
  .about-stat-label { font-size: 12px; color: #555; letter-spacing: 0.06em; text-transform: uppercase; }

  /* ── Values ── */
  .about-values { background: #141414; }
  .about-values-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px; margin-top: 0;
  }
  @media (max-width: 768px) { .about-values-grid { grid-template-columns: 1fr; } }

  .about-value-card {
    background: #111;
    border: 1px solid #1e1e1e;
    border-radius: 12px;
    padding: 28px;
    transition: border-color 0.2s;
  }
  .about-value-card:hover { border-color: rgba(229,62,62,0.25); }

  .about-value-icon {
    width: 44px; height: 44px; border-radius: 10px;
    background: rgba(229,62,62,0.08);
    border: 1px solid rgba(229,62,62,0.15);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 18px;
  }
  .about-value-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 22px; letter-spacing: 0.03em;
    color: #f2f2f2; margin-bottom: 10px;
  }
  .about-value-text { font-size: 14px; color: #666; line-height: 1.7; }

  /* ── CTA banner ── */
  .about-cta-banner {
    background: #0f0f0f;
    border-top: 1px solid #1e1e1e;
  }
  .about-cta-banner-inner {
    max-width: 1200px; margin: 0 auto;
    padding: 80px 64px;
    display: flex; align-items: center; justify-content: space-between;
    gap: 32px; flex-wrap: wrap;
  }
  @media (max-width: 768px) {
    .about-cta-banner-inner { padding: 56px 24px; flex-direction: column; text-align: center; }
  }
  .about-cta-banner-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(32px, 4vw, 52px);
    line-height: 0.95; color: #f2f2f2;
    margin-bottom: 8px;
  }
  .about-cta-banner-sub { font-size: 15px; color: #555; }
`;

export default function AboutPage() {
  return (
    <div className="about-page">
      <style>{CSS}</style>

      {/* ── Hero ── */}
      <section className="about-hero">
        <div className="about-hero-bg">
          <Image
            src="/car-ousel.jpg"
            alt="BePraize Sax"
            fill
            priority
            style={{ objectFit: "cover", objectPosition: "center top" }}
          />
          <div className="about-hero-overlay" />
        </div>
        <div className="about-hero-content">
          <p className="about-hero-label">The Story</p>
          <h1 className="about-hero-title">
            About
            <br />
            BePraize Sax
          </h1>
        </div>
      </section>

      {/* ── Biography ── */}
      <section className="about-section">
        <div className="about-bio-grid">
          <div className="about-bio-heading">
            <p className="about-section-label">Full Biography</p>
            <h2 className="about-section-title">
              The Artist
              <br />
              Behind the Sound
            </h2>
          </div>

          {/* Top: p1 + p2 */}
          <div className="about-bio-top">
            <p className="about-bio-text">
              <strong>Akintunde Adegoke,</strong> professionally known as
              BePraize Sax, is a celebrated saxophonist, vocalist, and music
              minister whose artistry bridges the vibrant soul of African
              musical tradition with the refined sophistication of contemporary
              jazz. From his earliest years, music was not merely a pursuit — it
              was a calling. Raised in an environment steeped in rhythm and
              worship, he his voice, a means through which he could speak what
              words alone could not express.
            </p>
            <p className="about-bio-text">
              Over more than two decades of dedicated mastery, BePraize Sax has
              graced some of the most prestigious stages across Africa, Europe,
              and North America. His performances are renowned for their
              emotional authenticity — an immersive experience that draws
              audiences into a shared moment of connection, transcending
              language, culture, and background. Whether commanding a grand
              concert hall or leading an intimate worship gathering, he brings
              the same unwavering excellence and spiritual depth.
            </p>
          </div>

          {/* Image — right column on desktop, between p2 & p3 on mobile */}
          <div className="about-bio-image">
            <div className="about-image-wrap">
              <Image
                src="/home-bio.jpg"
                alt="BePraize Sax"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: "cover", objectPosition: "center top" }}
              />
            </div>
            <div className="about-image-accent" />
          </div>

          {/* Bottom: p3 + p4 + CTAs */}
          <div className="about-bio-bottom">
            <p className="about-bio-text">
              Now based in Canada, BePraize Sax continues to expand the
              frontiers of what African-inspired music can sound and feel like
              in a global context. His discography spans multiple
              award-recognized projects that showcase his remarkable versatility
              as both performer and composer. Each album is a chapter in an
              evolving musical narrative — one that honours his roots while
              embracing the future. His presence in the Canadian music landscape
              has earned him a devoted following and a reputation as one of the
              most compelling live performers of his generation.
            </p>
            <p className="about-bio-text">
              Beyond performance, BePraize Sax is deeply committed to mentorship
              and the nurturing of emerging artists. He regularly leads
              workshops, masterclasses, and collaborative sessions, investing in
              the next generation of musicians with the same passion that has
              defined his own journey. For BePraize Sax, music is not a career —
              it is a ministry, and every note played is an act of purpose.
            </p>

            <div className="about-cta-row">
              <Link href="/contact" className="about-cta-primary">
                Get in Touch
              </Link>
              {/* <Link href="/live-event" className="about-cta-primary">
                <svg
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Watch Live
              </Link> */}
              {/* <Link href="/contact" className="about-cta-ghost">
                Get in Touch
              </Link> */}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <div className="about-stats">
        <div className="about-stats-inner">
          {[
            { num: "20+", label: "Years Performing" },
            { num: "3", label: "Continents Toured" },
            { num: "10+", label: "Albums Released" },
            { num: "50K+", label: "Fans Worldwide" },
          ].map(({ num, label }) => (
            <div key={label} className="about-stat">
              <p className="about-stat-num">{num}</p>
              <p className="about-stat-label">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Values ── */}
      <div className="about-values">
        <section
          className="about-section"
          style={{ paddingTop: 80, paddingBottom: 80 }}
        >
          <p className="about-section-label">What We Stand For</p>
          <h2 className="about-section-title" style={{ marginBottom: 40 }}>
            Our Values
          </h2>
          <div className="about-values-grid">
            {[
              {
                icon: (
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="#e53e3e"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                ),
                title: "Authenticity",
                text: "Every performance is a genuine expression of culture, faith, and artistry — never manufactured, always real.",
              },
              {
                icon: (
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="#e53e3e"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                    <line x1="9" y1="9" x2="9.01" y2="9" />
                    <line x1="15" y1="9" x2="15.01" y2="9" />
                  </svg>
                ),
                title: "Connection",
                text: "Music at its core is about bringing people together — across backgrounds, borders, and beliefs.",
              },
              {
                icon: (
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="#e53e3e"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ),
                title: "Excellence",
                text: "From rehearsal rooms to concert halls, the standard is always the same — nothing less than the very best.",
              },
            ].map(({ icon, title, text }) => (
              <div key={title} className="about-value-card">
                <div className="about-value-icon">{icon}</div>
                <h3 className="about-value-title">{title}</h3>
                <p className="about-value-text">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
