"use client";

import { useState } from "react";
import Image from "next/image";
import {
  CheckCircle,
  AlertCircle,
  Send,
  User,
  Mail,
  Phone,
  MessageSquare,
} from "lucide-react";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
  .contact-page *, .contact-page *::before, .contact-page *::after { box-sizing: border-box; }

  .contact-page {
    background: #141414;
    color: #f2f2f2;
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
  }

  /* ── Hero ── */
  .contact-hero {
    position: relative;
    height: 80vh;
    min-height: 460px;
    display: flex;
    align-items: flex-end;
    overflow: hidden;
  }
  .contact-hero-bg { position: absolute; inset: 0; }
  .contact-hero-bg img {
    width: 100%; height: 100%;
    object-fit: contain;
    object-position: center top;
    display: block;
    background: #141414;
  }
  .contact-hero-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(0,0,0,0.2) 0%,
      rgba(0,0,0,0.25) 40%,
      rgba(20,20,20,0.9) 75%,
      rgba(20,20,20,1) 100%
    );
  }
  .contact-hero-content {
    position: relative; z-index: 2;
    padding: 0 64px 64px;
    width: 100%;
  }
  .contact-hero-label {
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.2em; text-transform: uppercase;
    color: #e53e3e; margin-bottom: 12px;
  }
  .contact-hero-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(60px, 9vw, 110px);
    line-height: 0.9; letter-spacing: 0.02em;
    color: #fff;
  }
  .contact-hero-sub {
    font-size: 16px; color: rgba(255,255,255,0.6);
    margin-top: 14px; max-width: 440px; line-height: 1.6;
  }
  @media (max-width: 640px) {
    .contact-hero-content { padding: 0 24px 48px; }
    .contact-hero-bg img {
      object-fit: cover;
      object-position: center 40%;
    }
  }

  /* ── Body ── */
  .contact-body {
    max-width: 1200px; margin: 0 auto;
    padding: 80px 64px;
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 64px;
    align-items: start;
  }
  @media (max-width: 1000px) {
    .contact-body { grid-template-columns: 1fr; gap: 48px; padding: 56px 24px; }
  }

  /* ── Form ── */
  .contact-form-wrap { }

  .contact-section-label {
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.2em; text-transform: uppercase;
    color: #e53e3e; margin-bottom: 12px;
  }
  .contact-form-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(32px, 4vw, 48px);
    line-height: 0.95; letter-spacing: 0.02em;
    color: #f2f2f2; margin-bottom: 32px;
  }

  .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  @media (max-width: 600px) { .form-grid-2 { grid-template-columns: 1fr; } }

  .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
  .form-label {
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.15em; text-transform: uppercase; color: #555;
  }
  .input-wrap { position: relative; }
  .input-icon {
    position: absolute; left: 13px; top: 50%;
    transform: translateY(-50%); color: #444; pointer-events: none;
  }
  .textarea-icon { top: 14px; transform: none; }
  .form-input, .form-select, .form-textarea {
    background: #1a1a1a; border: 1px solid #2a2a2a;
    color: #f2f2f2; border-radius: 8px;
    padding: 11px 14px 11px 40px;
    font-size: 14px; font-family: 'DM Sans', sans-serif;
    width: 100%; outline: none;
    transition: border-color 0.15s, background 0.15s;
    appearance: none;
  }
  .form-input::placeholder, .form-textarea::placeholder { color: #444; }
  .form-input:focus, .form-select:focus, .form-textarea:focus {
    border-color: #e53e3e;
    background: #1e1010;
  }
  .form-select { padding-left: 40px; cursor: pointer; }
  .form-select option { background: #1a1a1a; }
  .form-textarea { padding-top: 12px; min-height: 130px; resize: vertical; line-height: 1.6; }

  /* No icon variant */
  .form-input.no-icon, .form-select.no-icon { padding-left: 14px; }

  /* Success / error */
  .form-alert {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 14px 16px; border-radius: 10px;
    font-size: 13px; margin-bottom: 20px; line-height: 1.5;
  }
  .form-alert.success {
    background: rgba(16,185,129,0.08);
    border: 1px solid rgba(16,185,129,0.2);
    color: #10b981;
  }
  .form-alert.error {
    background: rgba(229,62,62,0.08);
    border: 1px solid rgba(229,62,62,0.2);
    color: #e53e3e;
  }
  .form-alert svg { flex-shrink: 0; margin-top: 1px; }

  /* Submit button */
  .contact-submit-btn {
    display: flex; align-items: center; justify-content: center; gap: 10px;
    width: 100%; padding: 15px;
    background: #e53e3e; color: #fff; border: none;
    border-radius: 8px; font-size: 14px; font-weight: 700;
    font-family: 'DM Sans', sans-serif; letter-spacing: 0.05em;
    text-transform: uppercase; cursor: pointer;
    transition: background 0.15s, transform 0.1s;
    margin-top: 6px;
  }
  .contact-submit-btn:hover:not(:disabled) { background: #c53030; }
  .contact-submit-btn:active:not(:disabled) { transform: scale(0.98); }
  .contact-submit-btn:disabled { background: #2a2a2a; color: #555; cursor: not-allowed; }

  /* ── Sidebar info ── */
  .contact-info { padding-top: 4px; }

  .contact-info-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(32px, 4vw, 48px);
    line-height: 0.95; letter-spacing: 0.02em;
    color: #f2f2f2; margin-bottom: 32px;
  }

  .contact-info-item {
    display: flex; align-items: flex-start; gap: 16px;
    padding: 20px 0;
    border-bottom: 1px solid #1e1e1e;
  }
  .contact-info-item:last-of-type { border-bottom: none; }

  .contact-info-icon {
    width: 42px; height: 42px; border-radius: 10px;
    background: rgba(229,62,62,0.08);
    border: 1px solid rgba(229,62,62,0.15);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .contact-info-label {
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.15em; text-transform: uppercase;
    color: #e53e3e; margin-bottom: 5px;
  }
  .contact-info-val { font-size: 15px; color: #ccc; font-weight: 500; margin-bottom: 2px; }
  .contact-info-sub { font-size: 12px; color: #555; }

  /* Socials row */
  .contact-socials { display: flex; gap: 10px; margin-top: 32px; }
  .contact-social-btn {
    width: 40px; height: 40px; border-radius: 10px;
    background: #1a1a1a; border: 1px solid #2a2a2a;
    display: flex; align-items: center; justify-content: center;
    color: #555; text-decoration: none;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
  }
  .contact-social-btn:hover { background: #e53e3e; border-color: #e53e3e; color: #fff; }

  @keyframes spin { to { transform: rotate(360deg); } }
  .spin { animation: spin 0.7s linear infinite; }
`;

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const set =
    (k: keyof typeof form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus("idle");
    await new Promise((r) => setTimeout(r, 1200));
    setStatus("success");
    setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    setSubmitting(false);
  };

  const infoItems = [
    {
      icon: <Mail size={18} color="#e53e3e" />,
      label: "Email",
      val: "benadepraise@gmail.com",
      sub: "We reply within 24 hours",
    },
    {
      icon: (
        <svg
          width="18"
          height="18"
          fill="none"
          stroke="#e53e3e"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l.91-.9a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.02z" />
        </svg>
      ),
      label: "Inquiries",
      val: "416 - 893 - 1269",
      // sub: "Instagram · TikTok · Facebook",
    },
    {
      icon: (
        <svg
          width="18"
          height="18"
          fill="none"
          stroke="#e53e3e"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      ),
      label: "Based In",
      val: "Toronto, Ontario",
      sub: "Canada",
    },
  ];

  return (
    <div className="contact-page">
      <style>{CSS}</style>

      {/* ── Hero ── */}
      <section className="contact-hero">
        <div className="contact-hero-bg">
          <Image
            src="/carousel1.jpg"
            alt="Contact BePraize Sax"
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover", objectPosition: "center 7%" }}
          />
          <div className="contact-hero-overlay" />
        </div>
        <div className="contact-hero-content">
          <p className="contact-hero-label">Let&#39;s Talk</p>
          <h1 className="contact-hero-title">
            Get in
            <br />
            Touch
          </h1>
          <p className="contact-hero-sub">
            Have a question, booking inquiry, or collaboration idea? We&#39;d
            love to hear from you.
          </p>
        </div>
      </section>

      {/* ── Body ── */}
      <div className="contact-body">
        {/* Form */}
        <div className="contact-form-wrap">
          <p className="contact-section-label">Send a Message</p>
          <h2 className="contact-form-title">
            We&#39;ll Get Back
            <br />
            to You
          </h2>

          {status === "success" && (
            <div className="form-alert success">
              <CheckCircle size={16} />
              <span>
                Thank you! Your message has been sent. We&#39;ll be in touch
                within 24 hours.
              </span>
            </div>
          )}
          {status === "error" && (
            <div className="form-alert error">
              <AlertCircle size={16} />
              <span>
                Something went wrong. Please try again or reach us directly by
                email.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <div className="input-wrap">
                  <User size={14} className="input-icon" />
                  <input
                    className="form-input"
                    value={form.name}
                    onChange={set("name")}
                    placeholder="Your name"
                    required
                    disabled={submitting}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <div className="input-wrap">
                  <Mail size={14} className="input-icon" />
                  <input
                    className="form-input"
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    placeholder="you@email.com"
                    required
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div className="input-wrap">
                <Phone size={14} className="input-icon" />
                <input
                  className="form-input"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => {
                    // Only allow numbers, spaces, parentheses, hyphens, and plus sign
                    const phoneValue = e.target.value.replace(
                      /[^0-9\s\-\(\)\+]/g,
                      "",
                    );
                    set("phone")({
                      target: { value: phoneValue },
                    } as React.ChangeEvent<HTMLInputElement>);
                  }}
                  placeholder="+1 (555) 000-0000"
                  pattern="^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$"
                  title="Please enter a valid phone number (e.g., +1 (555) 000-0000)"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Subject *</label>
              <div className="input-wrap">
                <svg
                  width="14"
                  height="14"
                  fill="none"
                  stroke="#444"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                  className="input-icon"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <select
                  className="form-select"
                  value={form.subject}
                  onChange={set("subject")}
                  required
                  disabled={submitting}
                >
                  <option value="">Select a subject</option>
                  <option value="ticket-issue">Ticket Issue</option>
                  <option value="booking">Booking Inquiry</option>
                  <option value="summer-program">Summer Program</option>
                  <option value="partnership">
                    Partnership / Collaboration
                  </option>
                  <option value="feedback">Feedback</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Message *</label>
              <div className="input-wrap">
                <MessageSquare size={14} className="input-icon textarea-icon" />
                <textarea
                  className="form-textarea"
                  value={form.message}
                  onChange={set("message")}
                  placeholder="Tell us what's on your mind…"
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <button
              type="submit"
              className="contact-submit-btn"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="spin"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Sending…
                </>
              ) : (
                <>
                  <Send size={14} /> Send Message
                </>
              )}
            </button>
          </form>
        </div>

        {/* Info sidebar */}
        <div className="contact-info">
          <p className="contact-section-label">Contact Details</p>
          <h2 className="contact-info-title">
            How to
            <br />
            Reach Us
          </h2>

          {infoItems.map(({ icon, label, val, sub }) => (
            <div key={label} className="contact-info-item">
              <div className="contact-info-icon">{icon}</div>
              <div>
                <p className="contact-info-label">{label}</p>
                <p className="contact-info-val">{val}</p>
                <p className="contact-info-sub">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
