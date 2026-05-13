"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Minus,
  Plus,
  Trash2,
  Tag,
  X,
  CheckCircle,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CartItem {
  eventId: string;
  eventName: string;
  tierId: string;
  tierName: string;
  price: number;
  quantity: number;
}

interface Coupon {
  _id: string;
  name: string;
  percentage: number;
  active: boolean;
}

interface Event {
  _id: string;
  name: string;
  coupons: string[]; // coupon codes valid for this event
}

// ─── CSS ─────────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
  .cart-page *, .cart-page *::before, .cart-page *::after { box-sizing: border-box; }

  .cart-page {
    min-height: 100vh;
    background: #141414;
    color: #f2f2f2;
    font-family: 'DM Sans', sans-serif;
  }

  .cart-header {
    padding: 48px 48px 0;
    max-width: 1100px;
    margin: 0 auto;
  }
  .cart-back {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 13px; color: #555; text-decoration: none;
    margin-bottom: 28px; transition: color 0.15s;
  }
  .cart-back:hover { color: #ccc; }
  .cart-page-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(48px, 7vw, 80px);
    line-height: 0.92; letter-spacing: 0.02em;
    color: #f2f2f2; margin-bottom: 6px;
  }
  .cart-page-sub { font-size: 14px; color: #555; }

  .cart-layout {
    display: grid;
    grid-template-columns: 1fr 360px;
    gap: 32px;
    max-width: 1100px;
    margin: 40px auto 80px;
    padding: 0 48px;
    align-items: start;
  }
  @media (max-width: 900px) {
    .cart-layout { grid-template-columns: 1fr; padding: 0 24px; }
    .cart-header { padding: 32px 24px 0; }
  }

  .cart-items { display: flex; flex-direction: column; gap: 1px; background: #1e1e1e; border-radius: 12px; overflow: hidden; border: 1px solid #1e1e1e; }

  .cart-item {
    background: #141414;
    padding: 20px 24px;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 16px;
    align-items: center;
    transition: background 0.15s;
  }
  .cart-item:hover { background: #191919; }

  .ci-event { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #e53e3e; margin-bottom: 4px; }
  .ci-tier { font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 0.03em; color: #f2f2f2; margin-bottom: 2px; }
  .ci-price-each { font-size: 12px; color: #555; }

  .ci-right { display: flex; align-items: center; gap: 16px; }

  .qty-control {
    display: flex; align-items: center;
    background: #1e1e1e; border: 1px solid #2a2a2a; border-radius: 8px; overflow: hidden;
  }
  .qty-btn {
    width: 34px; height: 34px;
    display: flex; align-items: center; justify-content: center;
    background: transparent; border: none; cursor: pointer;
    color: #777; transition: background 0.12s, color 0.12s;
  }
  .qty-btn:hover { background: #2a2a2a; color: #f2f2f2; }
  .qty-btn.red:hover { color: #e53e3e; }
  .qty-val {
    width: 40px; text-align: center;
    font-size: 14px; font-weight: 600; color: #f2f2f2;
    border-left: 1px solid #2a2a2a; border-right: 1px solid #2a2a2a;
    height: 34px; line-height: 34px;
  }

  .ci-subtotal { font-family: 'Bebas Neue', sans-serif; font-size: 22px; color: #f2f2f2; min-width: 80px; text-align: right; }
  .delete-btn {
    width: 32px; height: 32px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    background: transparent; border: 1px solid #2a2a2a; cursor: pointer;
    color: #555; transition: background 0.12s, color 0.12s, border-color 0.12s;
  }
  .delete-btn:hover { background: rgba(244,63,94,0.1); border-color: rgba(244,63,94,0.3); color: #f43f5e; }

  /* Per-event coupon strip */
  .event-coupon-strip {
    background: #111;
    border-top: 1px solid #1e1e1e;
    padding: 14px 24px;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .coupon-input-row { display: flex; gap: 8px; flex: 1; min-width: 200px; }
  .coupon-input {
    flex: 1;
    background: #1a1a1a !important; border: 1px solid #2a2a2a !important;
    color: #f2f2f2 !important; border-radius: 6px !important;
    padding: 8px 12px !important; font-size: 12px !important;
    font-family: 'DM Sans', sans-serif !important; outline: none;
    letter-spacing: 0.06em; text-transform: uppercase; width: 100%;
    transition: border-color 0.15s;
  }
  .coupon-input:focus { border-color: #e53e3e !important; }
  .coupon-btn {
    padding: 8px 14px; background: #1e1e1e; border: 1px solid #2a2a2a;
    border-radius: 6px; color: #aaa; font-size: 12px; font-weight: 500;
    font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.15s;
    white-space: nowrap;
  }
  .coupon-btn:hover { background: #2a2a2a; color: #f2f2f2; }
  .coupon-msg {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px;
  }
  .coupon-valid { color: #38a169; }
  .coupon-invalid { color: #e53e3e; }
  .coupon-clear { background: none; border: none; cursor: pointer; color: #555; padding: 0; display: flex; }
  .coupon-clear:hover { color: #aaa; }

  .cart-empty {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 80px 24px; text-align: center; gap: 16px;
  }
  .cart-empty-icon {
    width: 72px; height: 72px; border-radius: 18px;
    background: #1e1e1e; border: 1px solid #2a2a2a;
    display: flex; align-items: center; justify-content: center;
    color: #333;
  }
  .cart-empty-title { font-family: 'Bebas Neue', sans-serif; font-size: 32px; color: #333; }
  .cart-empty-sub { font-size: 14px; color: #444; }
  .cart-empty-link {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 24px; background: #e53e3e; color: #fff;
    border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 700;
    letter-spacing: 0.04em; text-transform: uppercase; margin-top: 8px;
    transition: background 0.15s;
  }
  .cart-empty-link:hover { background: #c53030; }

  .section-label {
    font-size: 10px; font-weight: 700; letter-spacing: 0.2em;
    text-transform: uppercase; color: #e53e3e; margin-bottom: 14px;
  }

  .cart-summary {
    background: #111;
    border: 1px solid #1e1e1e;
    border-radius: 12px;
    padding: 28px;
    position: sticky;
    top: 88px;
  }

  .summary-rows { display: flex; flex-direction: column; gap: 0; margin-bottom: 20px; }
  .summary-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 0; font-size: 14px; color: #666;
    border-bottom: 1px solid #1a1a1a;
  }
  .summary-row:last-child { border-bottom: none; }
  .summary-row.discount { color: #38a169; }
  .summary-row.event-name { color: #444; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding-top: 12px; }
  .summary-divider { height: 1px; background: #2a2a2a; margin: 12px 0; }
  .summary-total {
    display: flex; justify-content: space-between; align-items: baseline;
    margin-bottom: 24px;
  }
  .summary-total-label { font-size: 14px; color: #777; }
  .summary-total-val { font-family: 'Bebas Neue', sans-serif; font-size: 32px; color: #f2f2f2; }

  .checkout-btn {
    display: flex; align-items: center; justify-content: center;
    gap: 10px; width: 100%;
    padding: 16px; background: #e53e3e; color: #fff; border: none;
    border-radius: 8px; font-size: 14px; font-weight: 700;
    font-family: 'DM Sans', sans-serif; letter-spacing: 0.04em;
    text-transform: uppercase; cursor: pointer; text-decoration: none;
    transition: background 0.15s, transform 0.1s;
  }
  .checkout-btn:hover { background: #c53030; }
  .checkout-btn:active { transform: scale(0.98); }
  .checkout-note { font-size: 12px; color: #444; text-align: center; margin-top: 10px; line-height: 1.5; }

  @media (max-width: 640px) {
    .ci-right { flex-wrap: wrap; justify-content: flex-end; }
    .cart-item { grid-template-columns: 1fr; gap: 12px; }
  }
`;

// ─── Constants ────────────────────────────────────────────────────────────────

const TAX_RATE = 0.13;

// ─── Per-event coupon state ───────────────────────────────────────────────────

interface EventCouponState {
  input: string;
  applied: Coupon | null;
  error: boolean;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [allCoupons, setAllCoupons] = useState<Coupon[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  // Per-event coupon state: { [eventId]: { input, applied, error } }
  const [couponStates, setCouponStates] = useState<
    Record<string, EventCouponState>
  >({});

  useEffect(() => {
    Promise.all([
      fetch("/api/coupons").then((r) => r.json()),
      fetch("/api/events").then((r) => r.json()),
    ])
      .then(([couponsData, eventsData]: [Coupon[], Event[]]) => {
        const activeCoupons = couponsData.filter((c) => c.active);
        setAllCoupons(activeCoupons);
        setEvents(eventsData);

        const storedCart = localStorage.getItem("sax-cart");
        if (storedCart) {
          setCart(JSON.parse(storedCart));
        }

        // Seed per-event coupon states from what was applied on the ticket pages
        const storedCoupons = localStorage.getItem("sax-applied-coupons");
        if (storedCoupons) {
          const savedMap: Record<string, Coupon> = JSON.parse(storedCoupons);
          const initial: Record<string, EventCouponState> = {};
          for (const [eventId, coupon] of Object.entries(savedMap)) {
            const ev = eventsData.find((e: Event) => e._id === eventId);
            // Only restore if the coupon is still active and valid for this event
            if (
              ev &&
              ev.coupons.includes(coupon.name) &&
              activeCoupons.some((c) => c.name === coupon.name)
            ) {
              initial[eventId] = {
                input: coupon.name,
                applied: coupon,
                error: false,
              };
            }
          }
          if (Object.keys(initial).length > 0) {
            setCouponStates(initial);
          }
        }
      })
      .catch(() => {});
  }, []);

  const saveCart = (updated: CartItem[]) => {
    setCart(updated);
    localStorage.setItem("sax-cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const updateQty = (index: number, delta: number) => {
    const updated = cart
      .map((item, i) => {
        if (i !== index) return item;
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      })
      .filter((item) => item.quantity > 0);
    saveCart(updated);
  };

  const removeItem = (index: number) => {
    saveCart(cart.filter((_, i) => i !== index));
  };

  // ── Per-event coupon handlers ─────────────────────────────────────────────

  const getCouponState = (eventId: string): EventCouponState =>
    couponStates[eventId] ?? { input: "", applied: null, error: false };

  const setCouponState = (
    eventId: string,
    patch: Partial<EventCouponState>,
  ) => {
    setCouponStates((prev) => ({
      ...prev,
      [eventId]: { ...getCouponState(eventId), ...patch },
    }));
  };

  const applyCoupon = (eventId: string) => {
    const state = getCouponState(eventId);
    const code = state.input.trim().toUpperCase();

    // Find the event so we can check which coupons are valid for it
    const event = events.find((e) => e._id === eventId);
    const validCouponNames = event?.coupons ?? [];

    // The coupon must be active AND assigned to this event
    const found = allCoupons.find(
      (c) => c.name === code && validCouponNames.includes(c.name),
    );

    if (found) {
      setCouponState(eventId, { applied: found, error: false });
    } else {
      setCouponState(eventId, { applied: null, error: true });
    }
  };

  const clearCoupon = (eventId: string) => {
    setCouponState(eventId, { applied: null, input: "", error: false });
  };

  // ── Grouped cart + totals ─────────────────────────────────────────────────

  const grouped = cart.reduce<Record<string, CartItem[]>>((acc, item) => {
    if (!acc[item.eventId]) acc[item.eventId] = [];
    acc[item.eventId].push(item);
    return acc;
  }, {});

  // Per-event subtotals and discounts
  const eventTotals = Object.entries(grouped).map(([eventId, items]) => {
    const eventSubtotal = items.reduce((a, i) => a + i.price * i.quantity, 0);
    const coupon = getCouponState(eventId).applied;
    const eventDiscount = coupon
      ? eventSubtotal * (coupon.percentage / 100)
      : 0;
    return {
      eventId,
      eventName: items[0].eventName,
      eventSubtotal,
      eventDiscount,
      coupon,
      items,
    };
  });

  const subtotal = eventTotals.reduce((a, e) => a + e.eventSubtotal, 0);
  const totalDiscount = eventTotals.reduce((a, e) => a + e.eventDiscount, 0);
  const taxable = subtotal - totalDiscount;
  const tax = taxable * TAX_RATE;
  const total = taxable + tax;
  const totalItems = cart.reduce((a, b) => a + b.quantity, 0);

  const handleCheckout = () => {
    // Build per-event coupon map from current states
    const appliedCouponsMap: Record<string, Coupon> = {};
    for (const [eventId, state] of Object.entries(couponStates)) {
      if (state.applied) appliedCouponsMap[eventId] = state.applied;
    }
    // Persist to localStorage so checkout can read it even after navigation
    localStorage.setItem(
      "sax-applied-coupons",
      JSON.stringify(appliedCouponsMap),
    );
    // Also pass full cart + coupons via sessionStorage
    sessionStorage.setItem(
      "sax-checkout",
      JSON.stringify({ cart, appliedCouponsMap }),
    );
    router.push("/checkout");
  };

  return (
    <div className="cart-page">
      <style>{CSS}</style>

      <div className="cart-header">
        <Link href="/event" className="cart-back">
          <svg
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Continue Shopping
        </Link>
        <h1 className="cart-page-title">
          Your
          <br />
          Cart
        </h1>
        <p className="cart-page-sub">
          {totalItems > 0
            ? `${totalItems} ticket${totalItems !== 1 ? "s" : ""} selected`
            : "Your cart is empty"}
        </p>
      </div>

      {cart.length === 0 ? (
        <div
          className="cart-empty"
          style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 48px" }}
        >
          <div className="cart-empty-icon">
            <ShoppingBag size={28} />
          </div>
          <p className="cart-empty-title">Nothing Here Yet</p>
          <p className="cart-empty-sub">
            Browse upcoming events and grab your tickets.
          </p>
          <Link href="/event" className="cart-empty-link">
            <ArrowRight size={15} /> Browse Events
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          {/* Items grouped by event */}
          <div>
            {eventTotals.map(({ eventId, eventName, coupon, items }) => {
              const ev = events.find((e) => e._id === eventId);
              const hasValidCoupons =
                ev &&
                ev.coupons.length > 0 &&
                allCoupons.some((c) => ev.coupons.includes(c.name));
              const state = getCouponState(eventId);

              return (
                <div key={eventId} style={{ marginBottom: 28 }}>
                  <p className="section-label">{eventName}</p>

                  <div className="cart-items">
                    {items.map((item) => {
                      const globalIndex = cart.findIndex(
                        (c) =>
                          c.eventId === item.eventId &&
                          c.tierId === item.tierId,
                      );
                      return (
                        <div key={item.tierId} className="cart-item">
                          <div>
                            <p className="ci-event">{item.eventName}</p>
                            <p className="ci-tier">{item.tierName}</p>
                            <p className="ci-price-each">
                              ${item.price.toFixed(2)} CAD each
                            </p>
                          </div>
                          <div className="ci-right">
                            <div className="qty-control">
                              <button
                                className="qty-btn red"
                                onClick={() => updateQty(globalIndex, -1)}
                              >
                                <Minus size={13} />
                              </button>
                              <div className="qty-val">{item.quantity}</div>
                              <button
                                className="qty-btn"
                                onClick={() => updateQty(globalIndex, 1)}
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                            <div className="ci-subtotal">
                              ${(item.price * item.quantity).toFixed(2)}
                            </div>
                            <button
                              className="delete-btn"
                              onClick={() => removeItem(globalIndex)}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Coupon strip — only shown if this event has valid coupons */}
                    {hasValidCoupons && (
                      <div className="event-coupon-strip">
                        {coupon ? (
                          <div className="coupon-msg coupon-valid">
                            <CheckCircle size={13} />
                            <span>
                              <strong>{coupon.name}</strong> —{" "}
                              {coupon.percentage}% off this event
                            </span>
                            <button
                              className="coupon-clear"
                              onClick={() => clearCoupon(eventId)}
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="coupon-input-row">
                              <input
                                className="coupon-input"
                                value={state.input}
                                onChange={(e) =>
                                  setCouponState(eventId, {
                                    input: e.target.value.toUpperCase(),
                                    error: false,
                                  })
                                }
                                placeholder="PROMO CODE"
                                onKeyDown={(e) =>
                                  e.key === "Enter" && applyCoupon(eventId)
                                }
                              />
                              <button
                                className="coupon-btn"
                                onClick={() => applyCoupon(eventId)}
                              >
                                <Tag
                                  size={12}
                                  style={{ display: "inline", marginRight: 4 }}
                                />
                                Apply
                              </button>
                            </div>
                            {state.error && (
                              <div className="coupon-msg coupon-invalid">
                                <X size={12} /> Invalid or not valid for this
                                event
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="cart-summary">
            <p className="section-label">Order Summary</p>

            <div className="summary-rows">
              {eventTotals.map(
                ({ eventId, eventName, eventDiscount, coupon, items }) => (
                  <div key={eventId}>
                    {/* Event name sub-header */}
                    <div className="summary-row event-name">
                      <span>{eventName}</span>
                    </div>
                    {items.map((item) => (
                      <div
                        key={`${item.eventId}-${item.tierId}`}
                        className="summary-row"
                      >
                        <span>
                          {item.tierName} × {item.quantity}
                        </span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    {coupon && (
                      <div className="summary-row discount">
                        <span>Promo ({coupon.name})</span>
                        <span>−${eventDiscount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                ),
              )}

              <div
                className="summary-row"
                style={{
                  marginTop: 8,
                  borderTop: "1px solid #2a2a2a",
                  paddingTop: 10,
                }}
              >
                <span>Subtotal</span>
                <span>${taxable.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>HST (13%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
            </div>

            <div className="summary-divider" />
            <div className="summary-total">
              <span className="summary-total-label">Total</span>
              <span className="summary-total-val">${total.toFixed(2)} CAD</span>
            </div>

            <button className="checkout-btn" onClick={handleCheckout}>
              Proceed to Checkout <ArrowRight size={16} />
            </button>
            <p className="checkout-note">
              Secure checkout · Tickets delivered instantly by email
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
