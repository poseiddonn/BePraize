"use client";
import { useState, useEffect, useCallback } from "react";
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
  eventDate: string;
  eventTime: string;
  venue: string;
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

  /* Header */
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

  /* Layout */
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

  /* Items */
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

  /* Empty state */
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

  /* Section label */
  .section-label {
    font-size: 10px; font-weight: 700; letter-spacing: 0.2em;
    text-transform: uppercase; color: #e53e3e; margin-bottom: 14px;
  }

  /* Summary panel */
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
  .summary-divider { height: 1px; background: #2a2a2a; margin: 12px 0; }
  .summary-total {
    display: flex; justify-content: space-between; align-items: baseline;
    margin-bottom: 24px;
  }
  .summary-total-label { font-size: 14px; color: #777; }
  .summary-total-val { font-family: 'Bebas Neue', sans-serif; font-size: 32px; color: #f2f2f2; }

  /* Coupon */
  .coupon-wrap { margin-bottom: 24px; }
  .coupon-input-row { display: flex; gap: 8px; }
  .coupon-input {
    flex: 1;
    background: #1a1a1a !important; border: 1px solid #2a2a2a !important;
    color: #f2f2f2 !important; border-radius: 6px !important;
    padding: 10px 12px !important; font-size: 13px !important;
    font-family: 'DM Sans', sans-serif !important; outline: none;
    letter-spacing: 0.06em; text-transform: uppercase; width: 100%;
    transition: border-color 0.15s;
  }
  .coupon-input:focus { border-color: #e53e3e !important; }
  .coupon-btn {
    padding: 10px 16px; background: #1e1e1e; border: 1px solid #2a2a2a;
    border-radius: 6px; color: #aaa; font-size: 13px; font-weight: 500;
    font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.15s;
    white-space: nowrap;
  }
  .coupon-btn:hover { background: #2a2a2a; color: #f2f2f2; }
  .coupon-msg {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; margin-top: 8px;
  }
  .coupon-valid { color: #38a169; }
  .coupon-invalid { color: #e53e3e; }
  .coupon-clear { background: none; border: none; cursor: pointer; color: #555; padding: 0; display: flex; }
  .coupon-clear:hover { color: #aaa; }

  /* Checkout btn */
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

// ─── Page ─────────────────────────────────────────────────────────────────────

const TAX_RATE = 0.13;

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState(false);

  const loadCart = useCallback(() => {
    const stored = JSON.parse(localStorage.getItem("sax-cart") || "[]");
    setCart(stored);
    const storedCoupon = localStorage.getItem("sax-applied-coupon");
    if (storedCoupon) {
      setAppliedCoupon(JSON.parse(storedCoupon));
    }
  }, []);

  useEffect(() => {
    const initializeCart = async () => {
      loadCart();
      try {
        const response = await fetch("/api/coupons");
        const data: Coupon[] = await response.json();
        setCoupons(data.filter((c) => c.active));
      } catch {
        // Silently handle error
      }
    };

    initializeCart();
  }, [loadCart]);

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

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    const found = coupons.find((c) => c.name === code);
    if (found) {
      setAppliedCoupon(found);
      localStorage.setItem("sax-applied-coupon", JSON.stringify(found));
      setCouponError(false);
    } else {
      setAppliedCoupon(null);
      localStorage.removeItem("sax-applied-coupon");
      setCouponError(true);
    }
  };

  const clearCoupon = () => {
    setAppliedCoupon(null);
    localStorage.removeItem("sax-applied-coupon");
    setCouponInput("");
    setCouponError(false);
  };

  // Group by event
  const grouped = cart.reduce<Record<string, CartItem[]>>((acc, item) => {
    if (!acc[item.eventId]) acc[item.eventId] = [];
    acc[item.eventId].push(item);
    return acc;
  }, {});

  const subtotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );
  const discount = appliedCoupon
    ? subtotal * (appliedCoupon.percentage / 100)
    : 0;
  const taxable = subtotal - discount;
  const tax = taxable * TAX_RATE;
  const total = taxable + tax;
  const totalItems = cart.reduce((a, b) => a + b.quantity, 0);

  const handleCheckout = () => {
    const checkoutData = { cart, appliedCoupon };
    sessionStorage.setItem("sax-checkout", JSON.stringify(checkoutData));
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
          {/* Items */}
          <div>
            {Object.entries(grouped).map(([, items]) => (
              <div key={items[0].eventId} style={{ marginBottom: 24 }}>
                <p className="section-label">{items[0].eventName}</p>
                <div className="cart-items">
                  {items.map((item) => {
                    const globalIndex = cart.findIndex(
                      (c) =>
                        c.eventId === item.eventId && c.tierId === item.tierId,
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
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="cart-summary">
            <p className="section-label">Order Summary</p>

            {/* Coupon */}
            <div className="coupon-wrap">
              {appliedCoupon ? (
                <div className="coupon-msg coupon-valid">
                  <CheckCircle size={13} />
                  <span>
                    <strong>{appliedCoupon.name}</strong> —{" "}
                    {appliedCoupon.percentage}% off
                  </span>
                  <button className="coupon-clear" onClick={clearCoupon}>
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="coupon-input-row">
                    <input
                      className="coupon-input"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase());
                        setCouponError(false);
                      }}
                      placeholder="PROMO CODE"
                      onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                    />
                    <button className="coupon-btn" onClick={applyCoupon}>
                      <Tag
                        size={13}
                        style={{ display: "inline", marginRight: 4 }}
                      />
                      Apply
                    </button>
                  </div>
                  {couponError && (
                    <div className="coupon-msg coupon-invalid">
                      <X size={12} /> Invalid or expired code
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="summary-rows">
              {cart.map((item) => (
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
              {appliedCoupon && (
                <div className="summary-row discount">
                  <span>Promo ({appliedCoupon.name})</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="summary-row">
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
