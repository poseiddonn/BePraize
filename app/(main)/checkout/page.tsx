"use client";

import { useState, useEffect } from "react";

import { useRouter } from "next/navigation";

import {
  CheckCircle,
  Tag,
  X,
  ChevronDown,
  ChevronUp,
  User,
  Mail,
  Phone,
  MapPin,
  Users,
} from "lucide-react";

import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

import { StripeCardElementChangeEvent } from "@stripe/stripe-js";

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

interface BuyerInfo {
  name: string;

  email: string;

  phone: string;

  province: string;

  city: string;
}

interface AttendeeInfo {
  name: string;

  email: string;

  phone: string;

  ticketId?: string;

  tierId?: string;

  tierName?: string;
}

type MailOption = "buyer" | "attendees" | "both";

function randomFourDigits() {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return String(1000 + (values[0] % 9000));
}

function createOrderNumber(eventName: string, eventDate: string) {
  // Extract first 2 letters from event name (uppercase, non-alphabetic chars removed)
  const eventPrefix = eventName
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 2);

  // Parse event date as local time to avoid UTC offset issues
  const [year, month, day] = eventDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const yearStr = date.getFullYear().toString().slice(-2);
  const monthStr = String(date.getMonth() + 1).padStart(2, "0");
  const dayStr = String(date.getDate()).padStart(2, "0");

  return `${eventPrefix}-${yearStr}${monthStr}${dayStr}${randomFourDigits()}`;
}

function createTicketId(orderNumber: string, usedTicketIds: Set<string>) {
  let ticketId = `${orderNumber}-${randomFourDigits()}`;

  while (usedTicketIds.has(ticketId)) {
    ticketId = `${orderNumber}-${randomFourDigits()}`;
  }

  usedTicketIds.add(ticketId);
  return ticketId;
}

const PROVINCES = [
  "Alberta",

  "British Columbia",

  "Manitoba",

  "New Brunswick",

  "Newfoundland and Labrador",

  "Northwest Territories",

  "Nova Scotia",

  "Nunavut",

  "Ontario",

  "Prince Edward Island",

  "Quebec",

  "Saskatchewan",

  "Yukon",
];

const TAX_RATE = 0.13;

const CSS = `

  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');

  .co-page *, .co-page *::before, .co-page *::after { box-sizing: border-box; }



  .co-page {

    min-height: 100vh;

    background: #141414;

    color: #f2f2f2;

    font-family: 'DM Sans', sans-serif;

  }



  /* Top bar */

  .co-topbar {

    background: #0f0f0f;

    border-bottom: 1px solid #1e1e1e;

    padding: 16px 48px;

    display: flex; align-items: center; justify-content: space-between;

  }

  .co-back {

    display: inline-flex; align-items: center; gap: 6px;

    font-size: 13px; color: #666; text-decoration: none; transition: color 0.15s;

  }

  .co-back:hover { color: #ccc; }

  .co-topbar-title {

    font-family: 'Bebas Neue', sans-serif;

    font-size: 18px; letter-spacing: 0.05em;

  }



  /* Layout */

  .co-layout {

    display: grid;

    grid-template-columns: 1fr 380px;

    gap: 0;

    max-width: 1100px;

    margin: 0 auto;

    padding: 40px 48px 80px;

    align-items: start;

  }

  @media (max-width: 900px) {

    .co-layout { grid-template-columns: 1fr; padding: 24px; }

    .co-topbar { padding: 14px 24px; }

  }



  /* Left column */

  .co-left { padding-right: 40px; }

  @media (max-width: 900px) { .co-left { padding-right: 0; } }



  .co-section {

    margin-bottom: 36px;

  }

  .section-title {

    font-family: 'Bebas Neue', sans-serif;

    font-size: 24px; letter-spacing: 0.03em;

    color: #f2f2f2; margin-bottom: 4px;

  }

  .section-sub { font-size: 13px; color: #555; margin-bottom: 20px; }



  /* Form grid */

  .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

  @media (max-width: 600px) { .form-grid-2 { grid-template-columns: 1fr; } }



  .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }

  .checkbox-label {
    display: flex; align-items: center; gap: 8px;
    font-size: 14px; color: #ccc; cursor: pointer;
    margin-bottom: 12px;
  }

  .checkbox-label input[type="checkbox"] {
    width: 16px; height: 16px;
    accent-color: #e50914;
  }

  .form-label {

    font-size: 10px; font-weight: 700; letter-spacing: 0.15em;

    text-transform: uppercase; color: #555;

  }

  .form-input, .form-select {

    background: #1a1a1a; border: 1px solid #2a2a2a;

    color: #f2f2f2; border-radius: 8px;

    padding: 11px 14px; font-size: 14px;

    font-family: 'DM Sans', sans-serif; width: 100%;

    outline: none; transition: border-color 0.15s;

    appearance: none;

  }

  .form-input:focus, .form-select:focus { border-color: #e53e3e; }

  .form-input.error { border-color: rgba(229,62,62,0.6); }

  .form-input:disabled {
    background: #0f0f0f; border-color: #1a1a1a;
    color: #666; cursor: not-allowed;
  }



  /* Input with icon */

  .input-wrap { position: relative; }

  .input-icon {

    position: absolute; left: 12px; top: 50%;

    transform: translateY(-50%); color: #444; pointer-events: none;

  }

  .input-wrap .form-input { padding-left: 38px; }



  /* Attendee blocks */

  .attendee-block {

    background: #1a1a1a; border: 1px solid #2a2a2a;

    border-radius: 10px; margin-bottom: 12px; overflow: hidden;

  }

  .attendee-header {

    display: flex; align-items: center; justify-content: space-between;

    padding: 14px 18px; cursor: pointer; user-select: none;

    transition: background 0.12s;

  }

  .attendee-header:hover { background: #222; }

  .attendee-header-left { display: flex; align-items: center; gap: 10px; }

  .attendee-tier-badge {

    padding: 3px 10px; border-radius: 12px;

    background: rgba(129,140,248,0.1); color: #818cf8;

    font-size: 11px; font-weight: 600; letter-spacing: 0.06em;

  }

  .attendee-name-label { font-size: 14px; color: #f2f2f2; font-weight: 500; }

  .attendee-body { padding: 18px; border-top: 1px solid #2a2a2a; }



  /* Mail options */

  .mail-options { display: flex; gap: 10px; flex-wrap: wrap; }

  .mail-option {

    flex: 1; min-width: 120px;

    padding: 14px 16px; border-radius: 10px;

    border: 1px solid #2a2a2a; background: #1a1a1a;

    cursor: pointer; transition: all 0.15s; text-align: center;

  }

  .mail-option:hover { border-color: #e53e3e; background: rgba(229,62,62,0.05); }

  .mail-option.selected { border-color: #e53e3e; background: rgba(229,62,62,0.1); }

  .mail-option-icon { font-size: 22px; margin-bottom: 6px; }

  .mail-option-label { font-size: 13px; font-weight: 600; color: #f2f2f2; }

  .mail-option-sub { font-size: 11px; color: #555; margin-top: 2px; }

  .mail-option.selected .mail-option-label { color: #e53e3e; }



  /* Payment methods */

  .payment-options { display: flex; flex-direction: column; gap: 10px; }

  .payment-option {

    display: flex; align-items: center; gap: 14px;

    padding: 16px 18px; border-radius: 10px;

    border: 1px solid #2a2a2a; background: #1a1a1a;

    cursor: pointer; transition: all 0.15s;

  }

  .payment-option:hover { border-color: #444; }

  .payment-option.selected { border-color: #e53e3e; background: rgba(229,62,62,0.07); }

  .payment-option-icon {

    width: 44px; height: 32px; border-radius: 6px;

    display: flex; align-items: center; justify-content: center;

    font-size: 18px; background: #222; flex-shrink: 0;

  }

  .payment-option-name { font-size: 14px; font-weight: 600; color: #f2f2f2; }

  .payment-option-sub { font-size: 12px; color: #555; }

  .payment-radio {

    width: 18px; height: 18px; border-radius: 50%;

    border: 2px solid #333; margin-left: auto; flex-shrink: 0;

    transition: border-color 0.15s; position: relative;

  }

  .payment-option.selected .payment-radio { border-color: #e53e3e; }

  .payment-option.selected .payment-radio::after {

    content: ''; position: absolute;

    width: 8px; height: 8px; background: #e53e3e;

    border-radius: 50%; top: 50%; left: 50%;

    transform: translate(-50%, -50%);

  }



  /* Card fields */

  .card-fields { margin-top: 16px; padding: 18px; background: #111; border-radius: 10px; border: 1px solid #222; }

  .card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }



  /* Divider */

  .co-divider { height: 1px; background: #1e1e1e; margin: 28px 0; }



  /* Right: summary sticky */

  .co-summary {

    background: #111; border: 1px solid #1e1e1e;

    border-radius: 12px; padding: 28px;

    position: sticky; top: 88px;

  }

  .summary-label {

    font-size: 10px; font-weight: 700; letter-spacing: 0.2em;

    text-transform: uppercase; color: #e53e3e; margin-bottom: 18px;

  }

  .summary-event { font-family: 'Bebas Neue', sans-serif; font-size: 18px; color: #888; margin-bottom: 14px; }

  .summary-row {

    display: flex; justify-content: space-between;

    font-size: 13px; color: #666; padding: 6px 0;

    border-bottom: 1px solid #1a1a1a;

  }

  .summary-row:last-child { border-bottom: none; }

  .summary-row.discount { color: #38a169; }

  .summary-divider { height: 1px; background: #2a2a2a; margin: 12px 0; }

  .summary-total {

    display: flex; justify-content: space-between;

    font-size: 18px; font-weight: 600; color: #f2f2f2;

    margin-bottom: 24px;

  }

  .place-order-btn {

    display: flex; align-items: center; justify-content: center;

    gap: 10px; width: 100%;

    padding: 16px; background: #e53e3e; color: #fff; border: none;

    border-radius: 8px; font-size: 14px; font-weight: 700;

    font-family: 'DM Sans', sans-serif; letter-spacing: 0.05em;

    text-transform: uppercase; cursor: pointer;

    transition: background 0.15s, transform 0.1s;

  }

  .place-order-btn:hover:not(:disabled) { background: #c53030; }

  .place-order-btn:active:not(:disabled) { transform: scale(0.98); }

  .place-order-btn:disabled { background: #2a2a2a; color: #555; cursor: not-allowed; }

  .order-note { font-size: 12px; color: #444; text-align: center; margin-top: 10px; line-height: 1.5; }



  /* Coupon in summary */

  .co-coupon-row { display: flex; gap: 8px; margin-bottom: 18px; }

  .co-coupon-input {

    flex: 1; background: #1a1a1a; border: 1px solid #2a2a2a;

    color: #f2f2f2; border-radius: 6px; padding: 9px 12px;

    font-size: 13px; font-family: 'DM Sans', sans-serif;

    outline: none; letter-spacing: 0.06em; text-transform: uppercase;

    transition: border-color 0.15s;

  }

  .co-coupon-input:focus { border-color: #e53e3e; }

  .co-coupon-btn {

    padding: 9px 14px; background: #1e1e1e; border: 1px solid #2a2a2a;

    border-radius: 6px; color: #aaa; font-size: 12px; font-weight: 600;

    font-family: 'DM Sans', sans-serif; cursor: pointer; white-space: nowrap;

    transition: all 0.15s;

  }

  .co-coupon-btn:hover { background: #2a2a2a; color: #f2f2f2; }

  .coupon-msg { display: flex; align-items: center; gap: 6px; font-size: 12px; margin-bottom: 12px; }

  .coupon-valid { color: #38a169; }

  .coupon-invalid { color: #e53e3e; }

  .coupon-clear { background: none; border: none; cursor: pointer; color: #555; padding: 0; }



  @media (max-width: 640px) {

    .mail-option { flex: 1 0 calc(50% - 5px); }

  }

`;

// ─── Attendee block ───────────────────────────────────────────────────────────

function AttendeeBlock({
  index,

  tierName,

  value,

  onChange,

  buyerInfo,

  isSameAsBuyerDisabled,
  onSameAsBuyerToggle,
  duplicateError,
}: {
  index: number;

  tierName: string;

  value: AttendeeInfo;

  onChange: (v: AttendeeInfo) => void;

  buyerInfo?: { name: string; email: string; phone: string };

  isSameAsBuyerDisabled?: boolean;

  onSameAsBuyerToggle?: (checked: boolean, index: number) => void;

  duplicateError?: string;
}) {
  const [open, setOpen] = useState(index === 0);
  const [sameAsBuyer, setSameAsBuyer] = useState(false);

  const set = (k: keyof AttendeeInfo, v: string) =>
    onChange({ ...value, [k]: v });

  const handleSameAsBuyerChange = (checked: boolean) => {
    setSameAsBuyer(checked);
    if (onSameAsBuyerToggle) {
      onSameAsBuyerToggle(checked, index);
    }
    if (checked && buyerInfo) {
      onChange({
        name: buyerInfo.name,
        email: buyerInfo.email,
        phone: buyerInfo.phone,
      });
    }
  };

  return (
    <div className="attendee-block">
      <div className="attendee-header" onClick={() => setOpen(!open)}>
        <div className="attendee-header-left">
          <span className="attendee-tier-badge">{tierName}</span>

          <span className="attendee-name-label">
            {value.name || `Attendee ${index + 1}`}
          </span>
        </div>

        {open ? (
          <ChevronUp size={15} color="#555" />
        ) : (
          <ChevronDown size={15} color="#555" />
        )}
      </div>

      {open && (
        <div className="attendee-body">
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={sameAsBuyer}
                onChange={(e) => handleSameAsBuyerChange(e.target.checked)}
                disabled={isSameAsBuyerDisabled}
              />
              Same as buyer information
            </label>
          </div>

          {duplicateError && (
            <div
              style={{
                color: "#ff4444",
                fontSize: "12px",
                marginBottom: "12px",
              }}
            >
              {duplicateError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Full Name</label>

            <div className="input-wrap">
              <User size={14} className="input-icon" />

              <input
                className="form-input"
                value={value.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Attendee full name"
                disabled={sameAsBuyer}
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Email</label>

              <div className="input-wrap">
                <Mail size={14} className="input-icon" />

                <input
                  className="form-input"
                  type="email"
                  value={value.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="email@example.com"
                  disabled={sameAsBuyer}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone</label>

              <div className="input-wrap">
                <Phone size={14} className="input-icon" />

                <input
                  className="form-input"
                  type="tel"
                  value={value.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  disabled={sameAsBuyer}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stripe Card Fields Component ─────────────────────────────────────────────

function StripeCardFieldsComponent({
  setCardComplete,
}: {
  setCardComplete: (complete: boolean) => void;
}) {
  const stripe = useStripe();

  const elements = useElements();

  const handleCardChange = (event: StripeCardElementChangeEvent) => {
    setCardComplete(event.complete);
  };

  const CARD_ELEMENT_OPTIONS = {
    style: {
      base: {
        fontSize: "14px",

        color: "#f2f2f2",

        "::placeholder": {
          color: "#555",
        },
      },

      invalid: {
        color: "#e53e3e",
      },
    },
    address: {
      country: "CA",
    },
  };

  return (
    <div className="card-fields">
      <div className="form-group">
        <label className="form-label">Card Details</label>

        <div
          style={{
            padding: "11px 14px",

            border: "1px solid #2a2a2a",

            borderRadius: "8px",

            background: "#1a1a1a",
          }}
        >
          {stripe && elements ? (
            <CardElement
              options={CARD_ELEMENT_OPTIONS}
              onChange={handleCardChange}
            />
          ) : (
            <div style={{ color: "#555", fontSize: "14px" }}>
              Loading payment form...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();

  const [cart, setCart] = useState<CartItem[]>([]);

  const [coupons, setCoupons] = useState<Coupon[]>([]);

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  const [couponInput, setCouponInput] = useState("");

  const [couponError, setCouponError] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<
    "card" | "apple" | "google"
  >("card");

  const [mailOption, setMailOption] = useState<MailOption>("both");

  const [placing, setPlacing] = useState(false);

  const [cardComplete, setCardComplete] = useState(false);

  const stripe = useStripe();

  const elements = useElements();

  const [isApple] = useState(
    () =>
      typeof navigator !== "undefined" &&
      /iPhone|iPad|Mac/.test(navigator.userAgent),
  );

  const [buyer, setBuyer] = useState<BuyerInfo>({
    name: "",

    email: "",

    phone: "",

    province: "Ontario",

    city: "",
  });

  // Build attendees list: one per ticket, sorted by tier price descending

  const sortedItems = [...cart].sort((a, b) => b.price - a.price);

  const flatAttendees = sortedItems.flatMap((item) =>
    Array.from({ length: item.quantity }, (_, i) => ({
      tierId: item.tierId,

      tierName: item.tierName,

      idx: i,
    })),
  );

  const [attendees, setAttendees] = useState<AttendeeInfo[]>([]);
  const [sameAsBuyerIndex, setSameAsBuyerIndex] = useState<number | null>(null);

  useEffect(() => {
    const initializeAttendees = () => {
      setAttendees(
        flatAttendees.map(() => ({ name: "", email: "", phone: "" })),
      );
      setSameAsBuyerIndex(null);
    };

    initializeAttendees();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.length]);

  // Check for duplicate attendees
  const getDuplicateError = (currentIndex: number): string | undefined => {
    const currentAttendee = attendees[currentIndex];
    if (!currentAttendee || (!currentAttendee.email && !currentAttendee.name))
      return undefined;

    for (let i = 0; i < attendees.length; i++) {
      if (i !== currentIndex) {
        const otherAttendee = attendees[i];
        if (otherAttendee) {
          // Check if both name and email match
          if (
            currentAttendee.email &&
            otherAttendee.email === currentAttendee.email
          ) {
            return "This email is already used by another attendee";
          }
          if (
            currentAttendee.name &&
            otherAttendee.name === currentAttendee.name
          ) {
            return "This name is already used by another attendee";
          }
        }
      }
    }
    return undefined;
  };

  const handleSameAsBuyerToggle = (checked: boolean, index: number) => {
    if (checked) {
      setSameAsBuyerIndex(index);
    } else if (sameAsBuyerIndex === index) {
      setSameAsBuyerIndex(null);
    }
  };

  useEffect(() => {
    const initializeCheckout = async () => {
      const stored = sessionStorage.getItem("sax-checkout");

      if (stored) {
        const data = JSON.parse(stored);

        setCart(data.cart || []);

        if (data.appliedCoupon) setAppliedCoupon(data.appliedCoupon);
      } else {
        const cartStored = JSON.parse(localStorage.getItem("sax-cart") || "[]");

        setCart(cartStored);

        const storedCoupon = localStorage.getItem("sax-applied-coupon");
        if (storedCoupon) {
          setAppliedCoupon(JSON.parse(storedCoupon));
        }
      }

      try {
        const response = await fetch("/api/coupons");

        const data: Coupon[] = await response.json();

        setCoupons(data.filter((c) => c.active));
      } catch {
        // Silently handle error
      }
    };

    initializeCheckout();
  }, []);

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

  const handlePlaceOrder = async () => {
    if (!stripe || !elements) {
      alert("Payment system not loaded. Please refresh the page.");

      return;
    }

    // Validate buyer information
    if (!buyer.name || !buyer.email || !buyer.phone || !buyer.city) {
      alert("Please fill in all required buyer information.");

      return;
    }

    setPlacing(true);

    // Get event name and date from first cart item
    const firstEvent = cart[0];
    const orderId = createOrderNumber(
      firstEvent.eventName,
      firstEvent.eventDate,
    );
    const usedTicketIds = new Set<string>();
    const attendeesWithTickets = attendees.map((attendee, index) => ({
      ...attendee,
      tierId: flatAttendees[index]?.tierId,
      tierName: flatAttendees[index]?.tierName,
      ticketId: createTicketId(orderId, usedTicketIds),
    }));

    const order = {
      cart,

      buyer,

      attendees: attendeesWithTickets,

      appliedCoupon,

      mailOption,

      paymentMethod,

      subtotal,

      discount,

      tax,

      total,

      orderId,

      createdAt: new Date().toISOString(),
    };

    try {
      if (paymentMethod === "card") {
        // Create payment intent

        const response = await fetch("/api/orders", {
          method: "POST",

          headers: { "Content-Type": "application/json" },

          body: JSON.stringify({
            amount: total,

            currency: "cad",

            orderId,

            customer_email: buyer.email,

            metadata: {
              orderId,

              eventNames: cart.map((c) => c.eventName).join(", "),
            },
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create payment intent");
        }

        const { clientSecret } = await response.json();

        // Confirm payment

        const paymentResult = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: elements.getElement(CardElement)!,

            billing_details: {
              name: buyer.name,

              email: buyer.email,
            },
          },
        });

        if (paymentResult.error) {
          alert(`Payment failed: ${paymentResult.error.message}`);

          setPlacing(false);

          return;
        }

        if (paymentResult.paymentIntent?.status !== "succeeded") {
          alert("Payment processing failed. Please try again.");

          setPlacing(false);

          return;
        }
      }

      // Save order to MongoDB
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.orderId,
          buyer: order.buyer,
          attendees: order.attendees,
          cart: cart,
          total: total,
          mailOption: order.mailOption,
          createdAt: new Date().toISOString(),
        }),
      });

      // Send tickets after order confirmation

      const sendTicketsRes = await fetch("/api/send-tickets", {
        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({
          orderId: order.orderId,

          mailOption: order.mailOption, // "buyer" | "attendees" | "both"

          buyer: { name: order.buyer.name, email: order.buyer.email },

          event: {
            name: firstEvent.eventName,
            date: firstEvent.eventDate,
            time: firstEvent.eventTime,
            venue: firstEvent.venue,
          },

          attendees: order.attendees.map((a, i) => {
            // Find the corresponding cart item for this attendee

            const attendeeTier = flatAttendees[i];

            const cartItem = cart.find(
              (item) => item.tierId === attendeeTier.tierId,
            );

            return {
              name: a.name,

              email: a.email,

              tierName: cartItem?.tierName || "Standard", // "Silver", "Gold", "Platinum" etc.

              ticketId: a.ticketId,

              price: cartItem ? `$${cartItem.price.toFixed(2)}` : "$200.00",
            };
          }),
        }),
      });

      if (!sendTicketsRes.ok) {
        const errorData = await sendTicketsRes.json();
        alert(
          `Warning: Tickets were not sent via email. Error: ${errorData.error || "Unknown error"}`,
        );
      } else {
      }

      // Store order in session

      sessionStorage.setItem("sax-order", JSON.stringify(order));

      // Clear cart

      localStorage.removeItem("sax-cart");
      localStorage.removeItem("sax-applied-coupon");
      sessionStorage.removeItem("sax-checkout");
      setAppliedCoupon(null);
      setCouponInput("");
      setCouponError(false);

      window.dispatchEvent(new Event("cartUpdated"));

      // Redirect to receipt page

      await new Promise((resolve) => setTimeout(resolve, 800));

      router.push("/receipt");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";

      alert(`Error: ${errorMessage}`);

      setPlacing(false);
    }
  };

  const isValid = buyer.name && buyer.email && buyer.phone && buyer.city;

  const paymentOptions = [
    {
      id: "card" as const,

      icon: "💳",

      name: "Credit / Debit Card",

      sub: "Visa, Mastercard, Amex",
    },

    ...(isApple
      ? [
          {
            id: "apple" as const,

            icon: "🍎",

            name: "Apple Pay",

            sub: "Pay with Touch ID or Face ID",
          },
        ]
      : []),

    {
      id: "google" as const,

      icon: "G",

      name: "Google Pay",

      sub: "Fast checkout with Google",
    },
  ];

  return (
    <div className="co-page">
      <style>{CSS}</style>

      <div className="co-topbar">
        <a href="/cart" className="co-back">
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
          Back to Cart
        </a>

        <span className="co-topbar-title">Checkout</span>

        <span style={{ width: 100 }} />
      </div>

      <div className="co-layout">
        <div className="co-left">
          {/* Buyer info */}

          <div className="co-section">
            <h2 className="section-title">Your Information</h2>

            <p className="section-sub">
              Contact details for your order confirmation
            </p>

            <div className="form-group">
              <label className="form-label">Full Name</label>

              <div className="input-wrap">
                <User size={14} className="input-icon" />

                <input
                  className="form-input"
                  value={buyer.name}
                  onChange={(e) => setBuyer({ ...buyer, name: e.target.value })}
                  placeholder="Your full name"
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Email</label>

                <div className="input-wrap">
                  <Mail size={14} className="input-icon" />

                  <input
                    className="form-input"
                    type="email"
                    value={buyer.email}
                    onChange={(e) =>
                      setBuyer({ ...buyer, email: e.target.value })
                    }
                    placeholder="you@email.com"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Phone</label>

                <div className="input-wrap">
                  <Phone size={14} className="input-icon" />

                  <input
                    className="form-input"
                    type="tel"
                    value={buyer.phone}
                    onChange={(e) =>
                      setBuyer({ ...buyer, phone: e.target.value })
                    }
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">City</label>

                <div className="input-wrap">
                  <MapPin size={14} className="input-icon" />

                  <input
                    className="form-input"
                    value={buyer.city}
                    onChange={(e) =>
                      setBuyer({ ...buyer, city: e.target.value })
                    }
                    placeholder="City"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Province</label>

                <select
                  className="form-select"
                  value={buyer.province}
                  onChange={(e) =>
                    setBuyer({ ...buyer, province: e.target.value })
                  }
                >
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="co-divider" />

          {/* Attendees */}

          {flatAttendees.length > 0 && (
            <div className="co-section">
              <h2 className="section-title">Attendee Information</h2>

              <p className="section-sub" style={{ marginBottom: 18 }}>
                One entry per ticket — sorted by tier
              </p>

              {flatAttendees.map((a, i) => (
                <AttendeeBlock
                  key={`${a.tierId}-${i}`}
                  index={i}
                  tierName={a.tierName}
                  value={attendees[i] || { name: "", email: "", phone: "" }}
                  buyerInfo={{
                    name: buyer.name,
                    email: buyer.email,
                    phone: buyer.phone,
                  }}
                  isSameAsBuyerDisabled={
                    sameAsBuyerIndex !== null && sameAsBuyerIndex !== i
                  }
                  onSameAsBuyerToggle={handleSameAsBuyerToggle}
                  duplicateError={getDuplicateError(i)}
                  onChange={(v) => {
                    const updated = [...attendees];

                    updated[i] = v;

                    setAttendees(updated);
                  }}
                />
              ))}
            </div>
          )}

          <div className="co-divider" />

          {/* Mail delivery option */}

          <div className="co-section">
            <h2 className="section-title">Ticket Delivery</h2>

            <p className="section-sub">
              Who should receive the tickets by email?
            </p>

            <div className="mail-options">
              {(
                [
                  {
                    id: "buyer" as MailOption,

                    icon: "👤",

                    label: "Buyer Only",

                    sub: "Send to me",
                  },

                  {
                    id: "attendees" as MailOption,

                    icon: <Users size={20} />,

                    label: "Attendees Only",

                    sub: "Send to each attendee",
                  },

                  {
                    id: "both" as MailOption,

                    icon: "📧",

                    label: "Everyone",

                    sub: "Buyer & all attendees",
                  },
                ] as {
                  id: MailOption;

                  icon: React.ReactNode;

                  label: string;

                  sub: string;
                }[]
              ).map((opt) => (
                <div
                  key={opt.id}
                  className={`mail-option${mailOption === opt.id ? " selected" : ""}`}
                  onClick={() => setMailOption(opt.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setMailOption(opt.id)}
                >
                  <div className="mail-option-icon">{opt.icon}</div>

                  <p className="mail-option-label">{opt.label}</p>

                  <p className="mail-option-sub">{opt.sub}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="co-divider" />

          {/* Payment */}

          <div className="co-section">
            <h2 className="section-title">Payment</h2>

            <p className="section-sub">Choose how you&#39;d like to pay</p>

            <div className="payment-options">
              {paymentOptions.map((opt) => (
                <div
                  key={opt.id}
                  className={`payment-option${paymentMethod === opt.id ? " selected" : ""}`}
                  onClick={() => setPaymentMethod(opt.id)}
                >
                  <div className="payment-option-icon">{opt.icon}</div>

                  <div>
                    <p className="payment-option-name">{opt.name}</p>

                    <p className="payment-option-sub">{opt.sub}</p>
                  </div>

                  <div className="payment-radio" />
                </div>
              ))}
            </div>

            {paymentMethod === "card" && (
              <StripeCardFieldsComponent setCardComplete={setCardComplete} />
            )}
          </div>
        </div>

        {/* Summary sidebar */}

        <div className="co-summary">
          <p className="summary-label">Order Summary</p>

          {cart.length > 0 && (
            <p className="summary-event">{cart[0].eventName}</p>
          )}

          {/* Coupon input */}

          {!appliedCoupon ? (
            <>
              <div className="co-coupon-row">
                <input
                  className="co-coupon-input"
                  value={couponInput}
                  onChange={(e) => {
                    setCouponInput(e.target.value.toUpperCase());

                    setCouponError(false);
                  }}
                  placeholder="PROMO CODE"
                  onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                />

                <button className="co-coupon-btn" onClick={applyCoupon}>
                  <Tag
                    size={11}
                    style={{ display: "inline", marginRight: 3 }}
                  />
                  Apply
                </button>
              </div>

              {couponError && (
                <div className="coupon-msg coupon-invalid">
                  <X size={12} /> Invalid code
                </div>
              )}
            </>
          ) : (
            <div
              className="coupon-msg coupon-valid"
              style={{ marginBottom: 12 }}
            >
              <CheckCircle size={13} />

              <span>
                <strong>{appliedCoupon.name}</strong> —{" "}
                {appliedCoupon.percentage}% off
              </span>

              <button
                className="coupon-clear"
                onClick={() => {
                  setAppliedCoupon(null);

                  setCouponInput("");
                }}
              >
                <X size={13} />
              </button>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column" }}>
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
                <span>Promo</span>

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
            <span>Total</span>

            <span>${total.toFixed(2)} CAD</span>
          </div>

          <button
            className="place-order-btn"
            onClick={handlePlaceOrder}
            disabled={
              !isValid ||
              placing ||
              cart.length === 0 ||
              (paymentMethod === "card" && !cardComplete)
            }
          >
            {placing ? "Processing…" : "Place Order"}

            {!placing && <CheckCircle size={16} />}
          </button>

          <p className="order-note">
            By placing your order you agree to our Terms of Service.
            <br />
            Tickets are non-refundable.
          </p>
        </div>
      </div>
    </div>
  );
}
