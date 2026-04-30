export default function Footer() {
  const year = new Date().getFullYear();

  const socials = [
    {
      label: "Facebook",
      href: "https://www.facebook.com/share/1AENTUd7ca/",
      icon: (
        <svg
          width="20"
          height="20"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      label: "Instagram",
      href: "https://www.instagram.com/bepraizesax?utm_source=qr&igsh=bmF1aWUycG13bGll",
      icon: (
        <svg
          width="20"
          height="20"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
        </svg>
      ),
    },
    {
      label: "TikTok",
      href: "https://www.tiktok.com/@bepraizesax?_t=ZM-8usC5rCJstJ&_r=1",
      icon: (
        <svg
          width="20"
          height="20"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
        </svg>
      ),
    },
    {
      label: "YouTube",
      href: "https://youtube.com/@bepraizesax5622?si=exLlPD8ykh4va_hY",
      icon: (
        <svg
          width="20"
          height="20"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
        .site-footer {
          background: #0a0a0a;
          border-top: 1px solid #1e1e1e;
          font-family: 'DM Sans', sans-serif;
          color: #f2f2f2;
        }
        .footer-main {
          max-width: 1280px;
          margin: 0 auto;
          padding: 64px 48px 40px;
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr;
          gap: 48px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .footer-main {
            grid-template-columns: 1fr;
            text-align: center;
            padding: 48px 24px 32px;
            gap: 36px;
          }
        }
        .footer-brand-name {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 28px;
          letter-spacing: 0.05em;
          color: #f2f2f2;
          margin-bottom: 10px;
        }
        .footer-brand-tagline {
          font-size: 14px;
          color: #555;
          line-height: 1.6;
          max-width: 240px;
        }
        @media (max-width: 768px) {
          .footer-brand-tagline { max-width: 100%; }
        }
        .footer-accent-line {
          width: 32px; height: 2px;
          background: #e53e3e;
          margin-top: 16px;
          border-radius: 2px;
        }
        @media (max-width: 768px) {
          .footer-accent-line { margin: 16px auto 0; }
        }
        .footer-col-title {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #e53e3e;
          margin-bottom: 18px;
        }
        .footer-links {
          list-style: none;
          padding: 0; margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        @media (max-width: 768px) {
          .footer-links { align-items: center; }
        }
        .footer-links a {
          font-size: 14px;
          color: #555;
          text-decoration: none;
          transition: color 0.15s;
        }
        .footer-links a:hover { color: #f2f2f2; }
        .footer-socials {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        @media (max-width: 768px) {
          .footer-socials { justify-content: center; }
        }
        .footer-social-btn {
          width: 40px; height: 40px;
          border-radius: 10px;
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          display: flex; align-items: center; justify-content: center;
          color: #555;
          text-decoration: none;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
        }
        .footer-social-btn:hover {
          background: #e53e3e;
          border-color: #e53e3e;
          color: #fff;
        }
        .footer-bottom {
          max-width: 1280px;
          margin: 0 auto;
          padding: 20px 48px;
          border-top: 1px solid #1a1a1a;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        @media (max-width: 768px) {
          .footer-bottom {
            flex-direction: column;
            padding: 20px 24px;
            text-align: center;
            gap: 8px;
          }
        }
        .footer-copy {
          font-size: 12px;
          color: #333;
        }
        .footer-legal {
          display: flex; gap: 16px;
        }
        .footer-legal a {
          font-size: 12px;
          color: #333;
          text-decoration: none;
          transition: color 0.15s;
        }
        .footer-legal a:hover { color: #777; }
      `}</style>

      <footer className="site-footer" role="contentinfo">
        <div className="footer-main">
          {/* Brand */}
          <div>
            <p className="footer-brand-name">BePraize Sax</p>
            <p className="footer-brand-tagline">
              Experience the rhythm of Africa. Live music, live energy, live
              experience.
            </p>
          </div>

          {/* Socials */}
          <div>
            <p className="footer-col-title">Connect</p>
            <div className="footer-socials">
              {socials.map(({ label, href, icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-social-btn"
                  aria-label={label}
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">
            &copy; {year} MARSH. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}
