import Image from "next/image";
import {
  Phone,
  Users,
  Clock,
  Award,
  Heart,
  Keyboard,
  Guitar,
} from "lucide-react";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
  .summer-page *, .summer-page *::before, .summer-page *::after { box-sizing: border-box; }

  .summer-page {
    background: #141414;
    color: #f2f2f2;
    font-family: 'DM Sans', sans-serif;
  }

  /* ── Hero ── */
  .summer-hero {
    position: relative;
    height: 100vh;
    min-height: 600px;
    display: flex;
    align-items: flex-end;
    overflow: hidden;
  }
  .summer-hero-bg { position: absolute; inset: 0; }
  .summer-hero-bg img {
    width: 100%; height: 100%;
    object-fit: cover; object-position: center top;
    display: block;
  }
  .summer-hero-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(0,0,0,0.3) 0%,
      rgba(0,0,0,0.4) 40%,
      rgba(20,20,20,0.9) 75%,
      rgba(20,20,20,1) 100%
    );
  }
  .summer-hero-content {
    position: relative; z-index: 2;
    padding: 0 64px 72px;
    width: 100%;
    max-width: 900px;
  }
  .summer-hero-tagline {
    font-size: 13px; font-weight: 700;
    letter-spacing: 0.25em; text-transform: uppercase;
    color: #e53e3e; margin-bottom: 16px;
  }
  .summer-hero-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(56px, 9vw, 120px);
    line-height: 0.9; letter-spacing: 0.02em;
    color: #fff; margin-bottom: 16px;
  }
  .summer-hero-subtitle {
    font-size: clamp(18px, 3vw, 28px);
    font-weight: 600;
    color: rgba(255,255,255,0.9);
    margin-bottom: 24px;
  }
  .summer-hero-desc {
    font-size: 15px; line-height: 1.7;
    color: rgba(255,255,255,0.7);
    max-width: 500px; margin-bottom: 36px;
  }
  .summer-hero-cta {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 14px 32px;
    background: #e53e3e; color: #fff;
    border-radius: 8px; text-decoration: none;
    font-size: 14px; font-weight: 700;
    letter-spacing: 0.05em; text-transform: uppercase;
    transition: background 0.15s, transform 0.1s;
  }
  .summer-hero-cta:hover { background: #c53030; }
  .summer-hero-cta:active { transform: scale(0.97); }

  /* ── Circular Badge ── */
  .summer-badge {
    position: absolute;
    top: 15%;
    right: 8%;
    width: 180px;
    height: 180px;
    border-radius: 50%;
    background: rgba(229,62,62,0.15);
    border: 2px solid rgba(229,62,62,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 20px;
    z-index: 3;
  }
  .summer-badge-text {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 18px;
    line-height: 1.3;
    letter-spacing: 0.1em;
    color: #fff;
    text-transform: uppercase;
  }
  @media (max-width: 900px) {
    .summer-badge {
      width: 140px;
      height: 140px;
      top: 12%;
      right: 5%;
    }
    .summer-badge-text { font-size: 14px; }
  }
  @media (max-width: 640px) {
    .summer-hero-content { padding: 0 24px 56px; }
    .summer-badge { display: none; }
  }

  /* ── Section shared ── */
  .summer-section {
    max-width: 1200px;
    margin: 0 auto;
    padding: 96px 64px;
  }
  @media (max-width: 768px) { .summer-section { padding: 64px 24px; } }

  .summer-section-label {
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.2em; text-transform: uppercase;
    color: #e53e3e; margin-bottom: 14px;
  }
  .summer-section-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(36px, 5vw, 60px);
    line-height: 0.95; letter-spacing: 0.02em;
    color: #f2f2f2; margin-bottom: 40px;
  }

  /* ── Instruments Grid ── */
  .summer-instruments-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 20px;
  }
  @media (max-width: 900px) { .summer-instruments-grid { grid-template-columns: repeat(3, 1fr); } }
  @media (max-width: 600px) { .summer-instruments-grid { grid-template-columns: repeat(2, 1fr); } }

  .summer-instrument-card {
    background: #1a1a1a;
    border: 1px solid #2a2a2a;
    border-radius: 12px;
    padding: 28px 20px;
    text-align: center;
    transition: border-color 0.2s, transform 0.2s;
  }
  .summer-instrument-card:hover {
    border-color: rgba(229,62,62,0.3);
    transform: translateY(-4px);
  }
  .summer-instrument-icon {
    width: 56px; height: 56px;
    margin: 0 auto 16px;
    background: rgba(229,62,62,0.08);
    border: 1px solid rgba(229,62,62,0.15);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .summer-instrument-name {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 18px;
    letter-spacing: 0.05em;
    color: #f2f2f2;
  }

  /* ── Benefits ── */
  .summer-benefits {
    background: #0f0f0f;
    border-top: 1px solid #1e1e1e;
    border-bottom: 1px solid #1e1e1e;
  }
  .summer-benefits-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
  }
  @media (max-width: 900px) { .summer-benefits-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 500px) { .summer-benefits-grid { grid-template-columns: 1fr; } }

  .summer-benefit-card {
    background: #141414;
    border: 1px solid #1e1e1e;
    border-radius: 12px;
    padding: 32px 24px;
    transition: border-color 0.2s;
  }
  .summer-benefit-card:hover { border-color: rgba(229,62,62,0.25); }
  .summer-benefit-icon {
    width: 48px; height: 48px;
    margin-bottom: 20px;
    background: rgba(229,62,62,0.08);
    border: 1px solid rgba(229,62,62,0.15);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .summer-benefit-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 22px;
    letter-spacing: 0.03em;
    color: #f2f2f2;
    margin-bottom: 10px;
  }
  .summer-benefit-text {
    font-size: 14px;
    color: #666;
    line-height: 1.6;
  }

  /* ── Audience Banner ── */
  .summer-audience {
    background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
    padding: 56px 64px;
    text-align: center;
  }
  @media (max-width: 768px) { .summer-audience { padding: 40px 24px; } }
  .summer-audience-text {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(28px, 4vw, 48px);
    line-height: 1.1;
    color: #fff;
    margin-bottom: 8px;
  }
  .summer-audience-sub {
    font-size: 14px;
    color: rgba(255,255,255,0.85);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  /* ── Pricing Section ── */
  .summer-pricing {
    background: #141414;
  }
  .summer-pricing-inner {
    max-width: 900px;
    margin: 0 auto;
    padding: 80px 24px;
  }
  .summer-pricing-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(40px, 6vw, 64px);
    line-height: 0.95;
    color: #f2f2f2;
    margin-bottom: 16px;
  }
  .summer-pricing-sub {
    font-size: 14px;
    color: #e53e3e;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-bottom: 40px;
  }
  .summer-pricing-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
    margin-bottom: 40px;
  }
  @media (max-width: 600px) { .summer-pricing-grid { grid-template-columns: 1fr; } }
  .summer-pricing-card {
    background: #1a1a1a;
    border: 1px solid #2a2a2a;
    border-radius: 12px;
    padding: 32px;
  }
  .summer-pricing-amount {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 48px;
    color: #e53e3e;
    margin-bottom: 8px;
  }
  .summer-pricing-label {
    font-size: 14px;
    color: #888;
    margin-bottom: 12px;
  }
  .summer-pricing-desc {
    font-size: 13px;
    color: #666;
    line-height: 1.6;
  }

  /* ── Registration Form ── */
  .summer-form {
    background: #1a1a1a;
    border: 1px solid #2a2a2a;
    border-radius: 12px;
    padding: 40px;
  }
  .summer-form-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 28px;
    color: #f2f2f2;
    margin-bottom: 8px;
  }
  .summer-form-sub {
    font-size: 13px;
    color: #888;
    margin-bottom: 24px;
  }
  .summer-form-group {
    margin-bottom: 20px;
  }
  .summer-form-label {
    display: block;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #555;
    margin-bottom: 8px;
  }
  .summer-form-input {
    width: 100%;
    background: #0f0f0f;
    border: 1px solid #2a2a2a;
    border-radius: 8px;
    padding: 12px 16px;
    color: #f2f2f2;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    outline: none;
    transition: border-color 0.15s;
  }
  .summer-form-input:focus {
    border-color: #e53e3e;
  }
  .summer-form-input::placeholder {
    color: #555;
  }
  .summer-form-submit {
    width: 100%;
    padding: 14px 32px;
    background: #e53e3e;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    cursor: pointer;
    transition: background 0.15s;
  }
  .summer-form-submit:hover {
    background: #c53030;
  }

  /* ── CTA Section ── */
  .summer-cta {
    background: #141414;
  }
  .summer-cta-inner {
    max-width: 900px;
    margin: 0 auto;
    text-align: center;
    padding: 80px 24px;
  }
  .summer-cta-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(40px, 6vw, 64px);
    line-height: 0.95;
    color: #f2f2f2;
    margin-bottom: 24px;
  }
  .summer-cta-text {
    font-size: 16px;
    color: #888;
    line-height: 1.7;
    margin-bottom: 40px;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }
  .summer-cta-buttons {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
  }
  .summer-cta-primary {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 14px 32px;
    background: #e53e3e; color: #fff;
    border-radius: 8px; text-decoration: none;
    font-size: 14px; font-weight: 700;
    letter-spacing: 0.05em; text-transform: uppercase;
    transition: background 0.15s;
  }
  .summer-cta-primary:hover { background: #c53030; }
  .summer-cta-secondary {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 14px 32px;
    background: transparent; color: #f2f2f2;
    border: 1px solid #2a2a2a; border-radius: 8px;
    text-decoration: none; font-size: 14px; font-weight: 600;
    letter-spacing: 0.05em; text-transform: uppercase;
    transition: border-color 0.15s, background 0.15s;
  }
  .summer-cta-secondary:hover {
    border-color: #555;
    background: #1a1a1a;
  }

  /* ── Footer ── */
  .summer-footer {
    background: #0a0a0a;
    border-top: 1px solid #1e1e1e;
    padding: 40px 64px;
    text-align: center;
  }
  @media (max-width: 768px) { .summer-footer { padding: 32px 24px; } }
  .summer-footer-text {
    font-size: 13px;
    color: #555;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }
  .summer-footer-divider {
    color: #e53e3e;
    margin: 0 12px;
  }
`;

const INSTRUMENTS = [
  {
    name: "Saxophone",
    icon: <Image src="/sax.svg" alt="Saxophone" width={24} height={24} />,
  },
  { name: "Keyboard", icon: <Keyboard size={24} color="#e53e3e" /> },
  { name: "Guitar", icon: <Guitar size={24} color="#e53e3e" /> },
  {
    name: "Talking Drum",
    icon: (
      <Image
        src="/talking-drum.svg"
        alt="Talking Drum"
        width={24}
        height={24}
      />
    ),
  },
  {
    name: "Drums",
    icon: <Image src="/drum.svg" alt="Drums" width={24} height={24} />,
  },
];

const BENEFITS = [
  {
    icon: <Users size={22} color="#e53e3e" />,
    title: "All Ages & Levels",
    text: "From beginners to advanced players, everyone is welcome. No prior experience needed.",
  },
  {
    icon: <Award size={22} color="#e53e3e" />,
    title: "Experienced Instructors",
    text: "Learn from professional musicians with years of performance and teaching expertise.",
  },
  {
    icon: <Clock size={22} color="#e53e3e" />,
    title: "Flexible Schedules",
    text: "Choose lesson times that work for you. Weekday, evening, and weekend options available.",
  },
  {
    icon: <Heart size={22} color="#e53e3e" />,
    title: "Personalized Lessons",
    text: "Tailored instruction to match your goals, pace, and musical interests.",
  },
];

export default function SummerPage() {
  return (
    <div className="summer-page">
      <style>{CSS}</style>

      {/* ── Hero ── */}
      <section className="summer-hero">
        <div className="summer-hero-bg">
          <Image
            src="/home-hero.jpg"
            alt="Summer Music Class"
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover", objectPosition: "center top" }}
          />
          <div className="summer-hero-overlay" />
        </div>

        <div className="summer-badge">
          <p className="summer-badge-text">
            Learn.
            <br />
            Grow.
            <br />
            Perform.
            <br />
            Inspire.
          </p>
        </div>

        <div className="summer-hero-content">
          <p className="summer-hero-tagline">Play. Praise. Inspire.</p>
          <h1 className="summer-hero-title">
            Summer
            <br />
            Music Class
          </h1>
          <p className="summer-hero-subtitle">
            Discover Your Talent. Make Beautiful Music!
          </p>
          <p className="summer-hero-desc">
            Join our summer coaching program and unlock your musical potential
            with expert guidance in a supportive environment.
          </p>
        </div>
      </section>

      {/* ── Instruments ── */}
      <section className="summer-section">
        <p className="summer-section-label">What We Teach</p>
        <h2 className="summer-section-title">
          Instruments
          <br />
          We Offer
        </h2>
        <div className="summer-instruments-grid">
          {INSTRUMENTS.map(({ name, icon }) => (
            <div key={name} className="summer-instrument-card">
              <div className="summer-instrument-icon">{icon}</div>
              <p className="summer-instrument-name">{name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing & Registration ── */}
      <section className="summer-pricing" id="register">
        <div className="summer-pricing-inner">
          <h2 className="summer-pricing-title">
            Pricing &
            <br />
            Registration
          </h2>
          <p className="summer-pricing-sub">Registration is Ongoing</p>

          <div className="summer-pricing-grid">
            <div className="summer-pricing-card">
              <p className="summer-pricing-amount">$50</p>
              <p className="summer-pricing-label">Registration Fee</p>
              <p className="summer-pricing-desc">
                One-time fee to secure your spot in our summer music program.
              </p>
            </div>
            <div className="summer-pricing-card">
              <p className="summer-pricing-amount">Per Hour</p>
              <p className="summer-pricing-label">Class Billing</p>
              <p className="summer-pricing-desc">
                Classes are billed hourly. Contact us for detailed hourly
                pricing information.
              </p>
            </div>
          </div>

          <div className="summer-form">
            <h3 className="summer-form-title">Register Now</h3>
            <p className="summer-form-sub">
              Fill out the form below to get started
            </p>
            <form>
              <div className="summer-form-group">
                <label className="summer-form-label">Full Name</label>
                <input
                  type="text"
                  className="summer-form-input"
                  placeholder="Your full name"
                  required
                />
              </div>
              <div className="summer-form-group">
                <label className="summer-form-label">Email</label>
                <input
                  type="email"
                  className="summer-form-input"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div className="summer-form-group">
                <label className="summer-form-label">Phone Number</label>
                <input
                  type="tel"
                  className="summer-form-input"
                  placeholder="+1 (555) 000-0000"
                  required
                />
              </div>
              <button type="submit" className="summer-form-submit">
                Submit Registration
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <div className="summer-benefits">
        <section className="summer-section">
          <h2 className="summer-section-title">
            Program
            <br />
            Benefits
          </h2>
          <div className="summer-benefits-grid">
            {BENEFITS.map(({ icon, title, text }) => (
              <div key={title} className="summer-benefit-card">
                <div className="summer-benefit-icon">{icon}</div>
                <h3 className="summer-benefit-title">{title}</h3>
                <p className="summer-benefit-text">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── Audience Banner ── */}
      <div className="summer-audience">
        <p className="summer-audience-text">
          All Ages. All Levels. No Experience? No Problem!
        </p>
        <p className="summer-audience-sub">Music Is For Everyone</p>
      </div>

      {/* ── Footer ── */}
      <footer className="summer-footer">
        <p className="summer-footer-text">
          Learn with Passion
          <span className="summer-footer-divider">•</span>
          Play with Purpose
          <span className="summer-footer-divider">•</span>
          Praise Through Music
        </p>
      </footer>
    </div>
  );
}
