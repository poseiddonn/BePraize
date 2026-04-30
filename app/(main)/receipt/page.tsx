"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { CheckCircle, Download, Printer, Mail, ArrowRight } from "lucide-react";

interface CartItem {
  eventId: string;
  eventName: string;
  tierId: string;
  tierName: string;
  price: number;
  quantity: number;
}

interface Order {
  orderId: string;
  createdAt: string;
  cart: CartItem[];
  buyer: {
    name: string;
    email: string;
    phone: string;
    province: string;
    city: string;
  };
  attendees: { name: string; email: string; phone: string }[];
  appliedCoupon: { name: string; percentage: number } | null;
  mailOption: "buyer" | "attendees" | "both";
  paymentMethod: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
  .receipt-page *, .receipt-page *::before, .receipt-page *::after { box-sizing: border-box; }

  .receipt-page {
    min-height: 100vh;
    background: #141414;
    color: #f2f2f2;
    font-family: 'DM Sans', sans-serif;
    padding: 48px 24px 80px;
  }

  .receipt-inner {
    max-width: 700px;
    margin: 0 auto;
  }

  /* Success banner */
  .receipt-success {
    display: flex; align-items: center; gap: 16px;
    background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2);
    border-radius: 12px; padding: 20px 24px; margin-bottom: 36px;
  }
  .receipt-success-icon {
    width: 44px; height: 44px; border-radius: 12px;
    background: rgba(16,185,129,0.15);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .receipt-success-title { font-weight: 600; font-size: 16px; color: #f2f2f2; margin-bottom: 2px; }
  .receipt-success-sub { font-size: 13px; color: #666; }

  /* Receipt card */
  .receipt-card {
    background: #111;
    border: 1px solid #1e1e1e;
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 24px;
  }

  .receipt-card-header {
    background: #0a0a0a;
    padding: 28px 32px;
    border-bottom: 1px solid #1e1e1e;
    display: flex; justify-content: space-between; align-items: flex-start;
  }
  .receipt-brand {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 24px; letter-spacing: 0.05em; color: #f2f2f2;
    margin-bottom: 4px;
  }
  .receipt-order-id { font-size: 12px; color: #444; letter-spacing: 0.06em; }
  .receipt-date { font-size: 12px; color: #444; text-align: right; }

  .receipt-card-body { padding: 28px 32px; }

  /* Section heading */
  .r-section-label {
    font-size: 10px; font-weight: 700; letter-spacing: 0.18em;
    text-transform: uppercase; color: #e53e3e;
    margin-bottom: 14px; margin-top: 24px;
  }
  .r-section-label:first-child { margin-top: 0; }

  /* Info grid */
  .r-info-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
    margin-bottom: 4px;
  }
  @media (max-width: 500px) { .r-info-grid { grid-template-columns: 1fr; } }
  .r-info-item-label { font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #444; margin-bottom: 3px; }
  .r-info-item-val { font-size: 14px; color: #ccc; }

  /* Ticket rows */
  .r-ticket-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 12px 0; border-bottom: 1px solid #1a1a1a;
  }
  .r-ticket-row:last-child { border-bottom: none; }
  .r-ticket-tier { font-size: 15px; font-weight: 500; color: #f2f2f2; }
  .r-ticket-event { font-size: 12px; color: #555; margin-top: 2px; }
  .r-ticket-qty { font-size: 13px; color: #666; margin: 0 16px; }
  .r-ticket-price { font-family: 'Bebas Neue', sans-serif; font-size: 20px; color: #f2f2f2; }

  /* Attendees table */
  .r-attendees { display: flex; flex-direction: column; gap: 10px; }
  .r-attendee {
    background: #1a1a1a; border: 1px solid #222; border-radius: 8px;
    padding: 12px 16px;
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 8px; align-items: center;
  }
  @media (max-width: 500px) { .r-attendee { grid-template-columns: 1fr; } }
  .r-attendee-badge {
    font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
    color: #818cf8; margin-bottom: 4px;
  }
  .r-attendee-name { font-size: 14px; font-weight: 500; color: #f2f2f2; }
  .r-attendee-contact { font-size: 12px; color: #555; }

  /* Totals */
  .r-totals { display: flex; flex-direction: column; gap: 0; }
  .r-total-row {
    display: flex; justify-content: space-between;
    font-size: 14px; color: #666; padding: 7px 0;
    border-bottom: 1px solid #1a1a1a;
  }
  .r-total-row:last-child { border-bottom: none; }
  .r-total-row.discount { color: #38a169; }
  .r-total-divider { height: 1px; background: #2a2a2a; margin: 10px 0; }
  .r-grand-total {
    display: flex; justify-content: space-between; align-items: baseline;
  }
  .r-grand-label { font-size: 14px; color: #aaa; font-weight: 600; }
  .r-grand-val { font-family: 'Bebas Neue', sans-serif; font-size: 32px; color: #f2f2f2; }

  /* Delivery note */
  .r-delivery {
    background: rgba(129,140,248,0.08); border: 1px solid rgba(129,140,248,0.15);
    border-radius: 10px; padding: 16px 20px;
    display: flex; align-items: center; gap: 12px;
    font-size: 13px; color: #aaa; line-height: 1.5;
    margin-top: 24px;
  }
  .r-delivery-icon { flex-shrink: 0; color: #818cf8; }

  /* Actions */
  .receipt-actions {
    display: flex; gap: 12px; flex-wrap: wrap;
  }
  .r-action-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 22px; border-radius: 8px;
    font-size: 13px; font-weight: 700; font-family: 'DM Sans', sans-serif;
    letter-spacing: 0.04em; text-transform: uppercase;
    cursor: pointer; transition: all 0.15s; text-decoration: none; border: none;
  }
  .r-btn-primary { background: #e53e3e; color: #fff; }
  .r-btn-primary:hover { background: #c53030; }
  .r-btn-ghost { background: #1a1a1a; color: #aaa; border: 1px solid #2a2a2a; }
  .r-btn-ghost:hover { background: #222; color: #f2f2f2; }

  /* Print styles */
  @media print {
    .receipt-page { background: #fff !important; color: #111 !important; padding: 0; }
    .receipt-actions, .receipt-success { display: none !important; }
    .receipt-card { border: 1px solid #ddd; border-radius: 0; }
    .receipt-card-header { background: #f9f9f9; }
    .receipt-brand, .r-grand-val, .r-ticket-price, .receipt-page .r-section-label { color: #e53e3e !important; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

function formatDate(iso: string) {
  const [year, month, day] = iso.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ReceiptPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadOrder = () => {
      const stored = sessionStorage.getItem("sax-order");
      if (stored) setOrder(JSON.parse(stored));
    };

    loadOrder();
  }, []);

  const handlePrint = () => window.print();

  if (!order) {
    return (
      <div className="receipt-page">
        <style>{CSS}</style>
        <div
          className="receipt-inner"
          style={{ textAlign: "center", paddingTop: 80 }}
        >
          <p
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 48,
              color: "#333",
            }}
          >
            No Order Found
          </p>
          <p style={{ color: "#555", marginBottom: 24 }}>
            Head to Events to purchase tickets.
          </p>
          <Link href="/event" style={{ color: "#e53e3e", fontSize: 14 }}>
            Browse Events →
          </Link>
        </div>
      </div>
    );
  }

  const mailLabel =
    order.mailOption === "buyer"
      ? "your email"
      : order.mailOption === "attendees"
        ? "each attendee's email"
        : "your email and each attendee's email";

  return (
    <div className="receipt-page">
      <style>{CSS}</style>
      <div className="receipt-inner" ref={receiptRef}>
        {/* Success banner */}
        <div className="receipt-success">
          <div className="receipt-success-icon">
            <CheckCircle size={22} color="#10b981" />
          </div>
          <div>
            <p className="receipt-success-title">Order Confirmed!</p>
            <p className="receipt-success-sub">
              Your tickets have been sent to {mailLabel}.
            </p>
          </div>
        </div>

        {/* Receipt card */}
        <div className="receipt-card">
          <div className="receipt-card-header">
            <div>
              <p className="receipt-brand">
                {order.cart[0]?.eventName || "Event"}
              </p>
              <p className="receipt-order-id">ORDER # {order.orderId}</p>
            </div>
            <p className="receipt-date">{formatDate(order.createdAt)}</p>
          </div>

          <div className="receipt-card-body">
            {/* Buyer */}
            <p className="r-section-label">Buyer Information</p>
            <div className="r-info-grid">
              <div>
                <p className="r-info-item-label">Name</p>
                <p className="r-info-item-val">{order.buyer.name}</p>
              </div>
              <div>
                <p className="r-info-item-label">Email</p>
                <p className="r-info-item-val">{order.buyer.email}</p>
              </div>
              <div>
                <p className="r-info-item-label">Phone</p>
                <p className="r-info-item-val">{order.buyer.phone}</p>
              </div>
              <div>
                <p className="r-info-item-label">Location</p>
                <p className="r-info-item-val">
                  {order.buyer.city}, {order.buyer.province}
                </p>
              </div>
            </div>

            {/* Tickets */}
            <p className="r-section-label">Tickets</p>
            {order.cart.map((item) => (
              <div
                key={`${item.eventId}-${item.tierId}`}
                className="r-ticket-row"
              >
                <div>
                  <p className="r-ticket-tier">{item.tierName}</p>
                  <p className="r-ticket-event">{item.eventName}</p>
                </div>
                <span className="r-ticket-qty">× {item.quantity}</span>
                <span className="r-ticket-price">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}

            {/* Attendees */}
            {order.attendees && order.attendees.some((a) => a.name) && (
              <>
                <p className="r-section-label">Attendees</p>
                <div className="r-attendees">
                  {order.attendees.map((a, i) =>
                    a.name ? (
                      <div key={i} className="r-attendee">
                        <div>
                          <p className="r-attendee-badge">Attendee {i + 1}</p>
                          <p className="r-attendee-name">{a.name}</p>
                        </div>
                        <div>
                          {a.email && (
                            <p className="r-attendee-contact">{a.email}</p>
                          )}
                          {a.phone && (
                            <p className="r-attendee-contact">{a.phone}</p>
                          )}
                        </div>
                      </div>
                    ) : null,
                  )}
                </div>
              </>
            )}

            {/* Totals */}
            <p className="r-section-label">Payment Summary</p>
            <div className="r-totals">
              {order.cart.map((item) => (
                <div
                  key={`${item.eventId}-${item.tierId}`}
                  className="r-total-row"
                >
                  <span>
                    {item.tierName} × {item.quantity}
                  </span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              {order.appliedCoupon && (
                <div className="r-total-row discount">
                  <span>Promo ({order.appliedCoupon.name})</span>
                  <span>−${order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="r-total-row">
                <span>Subtotal</span>
                <span>${(order.total - order.tax).toFixed(2)}</span>
              </div>
              <div className="r-total-row">
                <span>HST (13%)</span>
                <span>${order.tax.toFixed(2)}</span>
              </div>
            </div>
            <div className="r-total-divider" />
            <div className="r-grand-total">
              <span className="r-grand-label">Total Paid</span>
              <span className="r-grand-val">${order.total.toFixed(2)} CAD</span>
            </div>

            {/* Delivery note */}
            <div className="r-delivery">
              <Mail size={18} className="r-delivery-icon" />
              <span>
                Tickets have been sent to{" "}
                <strong style={{ color: "#f2f2f2" }}>{mailLabel}</strong>. Check
                your spam folder if you don&#39;t see them within a few minutes.
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="receipt-actions">
          <button className="r-action-btn r-btn-primary" onClick={handlePrint}>
            <Printer size={15} /> Print Receipt
          </button>
          <button className="r-action-btn r-btn-ghost" onClick={handlePrint}>
            <Download size={15} /> Save as PDF
          </button>
          <Link href="/event" className="r-action-btn r-btn-ghost">
            <ArrowRight size={15} /> Browse Events
          </Link>
        </div>
      </div>
    </div>
  );
}
