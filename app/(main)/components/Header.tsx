"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

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

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [upcomingEvent, setUpcomingEvent] = useState<Event | null>(null);
  const [eventsLoading, setEventsLoading] = useState(true);
  const pathname = usePathname();

  // Pages where the header should be transparent over a hero
  const heroPages = [
    "/",
    "/event",
    "/live-event",
    "/about",
    "/contact",
    "/summer",
  ];
  const isHeroPage = heroPages.some(
    (p) => pathname === p || pathname.startsWith("/live-event/"),
  );

  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem("sax-cart") || "[]");
      const count = cart.reduce(
        (total: number, item: { quantity: number }) => total + item.quantity,
        0,
      );
      setCartCount(count);
    };
    updateCartCount();
    window.addEventListener("storage", updateCartCount);
    window.addEventListener("cartUpdated", updateCartCount);
    return () => {
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("cartUpdated", updateCartCount);
    };
  }, []);

  useEffect(() => {
    if (!isHeroPage) return;
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHeroPage]);

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
      } catch {
      } finally {
        setEventsLoading(false);
      }
    }

    fetchEvents();
  }, []);

  // Transparent when on a hero page and not scrolled; solid otherwise
  const transparent = isHeroPage && !scrolled && !isMenuOpen;

  const showLiveEventLink = !eventsLoading && upcomingEvent !== null;

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/event", label: "Events" },
    ...(showLiveEventLink
      ? [{ href: "/live-event", label: "Live Events" }]
      : []),
    { href: "/contact", label: "Contact" },
  ];

  // Only show cart button on ticket pages, cart page and checkout
  const showCart =
    pathname === "/cart" ||
    pathname === "/checkout" ||
    pathname.startsWith("/ticket/");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap');

        .site-header {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          transition: background 0.3s ease, box-shadow 0.3s ease, backdrop-filter 0.3s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .site-header.solid {
          background: #0f0f0f;
          box-shadow: 0 1px 0 rgba(255,255,255,0.06);
        }
        .site-header.transparent {
          background: linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%);
          backdrop-filter: none;
        }
        .site-header.menu-open {
          background: #0f0f0f;
        }

        .header-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 32px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        /* Logo */
        .header-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          flex-shrink: 0;
        }
        .header-logo-text {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 20px;
          letter-spacing: 0.06em;
          color: #f2f2f2;
          line-height: 1;
        }

        /* Desktop nav */
        .header-nav {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-left: auto;
        }
        .header-nav a {
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.75);
          text-decoration: none;
          padding: 6px 12px;
          border-radius: 6px;
          transition: color 0.15s, background 0.15s;
          letter-spacing: 0.02em;
        }
        .header-nav a:hover { color: #fff; background: rgba(255,255,255,0.07); }
        .header-nav a.active { color: #e53e3e; }

        /* Right actions */
        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .cart-btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px; height: 38px;
          border-radius: 8px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.8);
          text-decoration: none;
          transition: background 0.15s, color 0.15s;
        }
        .cart-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }
        .cart-badge {
          position: absolute;
          top: -5px; right: -5px;
          min-width: 18px; height: 18px;
          background: #e53e3e;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          padding: 0 4px;
          border: 2px solid #0f0f0f;
        }
        /* Hamburger */
        .hamburger {
          display: none;
          width: 38px; height: 38px;
          align-items: center; justify-content: center;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          cursor: pointer;
          color: #f2f2f2;
        }
        .hamburger svg { display: block; }

        /* Mobile header actions */
        .mobile-header-actions {
          display: none;
        }

        /* Mobile menu */
        .mobile-nav {
          display: none;
          padding: 12px 16px 20px;
          border-top: 1px solid rgba(255,255,255,0.07);
        }
        .mobile-nav.open { display: block; }
        .mobile-nav a {
          display: block;
          padding: 11px 16px;
          font-size: 15px;
          font-weight: 500;
          color: rgba(255,255,255,0.75);
          text-decoration: none;
          border-radius: 8px;
          transition: background 0.12s, color 0.12s;
        }
        .mobile-nav a:hover { background: rgba(255,255,255,0.07); color: #fff; }
        .mobile-nav a.active { color: #e53e3e; }
        .mobile-nav-divider { height: 1px; background: rgba(255,255,255,0.07); margin: 10px 0; }
        .mobile-cart-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 11px 16px;
          font-size: 15px;
          font-weight: 500;
          color: rgba(255,255,255,0.75);
          border-radius: 8px;
          text-decoration: none;
          transition: background 0.12s;
        }
        .mobile-cart-row:hover { background: rgba(255,255,255,0.07); color: #fff; }
        .mobile-cart-badge {
          background: #e53e3e;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 10px;
        }

        @media (max-width: 768px) {
          .header-nav, .header-actions { display: none; }
          .hamburger { display: flex; }
          .header-inner { padding: 0 20px; }
          .mobile-header-actions {
            display: flex;
            align-items: center;
            gap: 8px;
          }
        }
      `}</style>

      <header
        className={`site-header ${transparent ? "transparent" : "solid"}${isMenuOpen ? " menu-open" : ""}`}
      >
        <div className="header-inner">
          {/* Logo */}
          <Link href="/" className="header-logo">
            <Image
              src="/logo.png"
              alt="BePraize Sax"
              width={38}
              height={38}
              style={{ width: "auto", height: "auto" }}
              loading="eager"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="header-nav">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={pathname === href ? "active" : ""}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="header-actions">
            {showCart && (
              <Link href="/cart" className="cart-btn" aria-label="Cart">
                <svg
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                {cartCount > 0 && (
                  <span className="cart-badge">{cartCount}</span>
                )}
              </Link>
            )}
          </div>

          {/* Mobile actions (cart + hamburger) */}
          <div className="mobile-header-actions">
            {showCart && (
              <Link href="/cart" className="cart-btn" aria-label="Cart">
                <svg
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                {cartCount > 0 && (
                  <span className="cart-badge">{cartCount}</span>
                )}
              </Link>
            )}
            <button
              className="hamburger"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Menu"
            >
              {isMenuOpen ? (
                <svg
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  viewBox="0 0 24 24"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  viewBox="0 0 24 24"
                >
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className={`mobile-nav${isMenuOpen ? " open" : ""}`}>
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={pathname === href ? "active" : ""}
              onClick={() => setIsMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
          <div className="mobile-nav-divider" />
          {showCart && (
            <Link
              href="/cart"
              className="mobile-cart-row"
              onClick={() => setIsMenuOpen(false)}
            >
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="mobile-cart-badge">{cartCount}</span>
              )}
            </Link>
          )}
        </nav>
      </header>

      {/* Spacer — only on non-hero pages so content isn't hidden under fixed header */}
      {!isHeroPage && <div style={{ height: 64 }} />}
    </>
  );
}
