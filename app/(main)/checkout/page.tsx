"use client";

import { useState, useEffect, useRef } from "react";

import { useRouter } from "next/navigation";

import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  User,
  Mail,
  Phone,
  MapPin,
  Users,
} from "lucide-react";

import {
  CardElement,
  PaymentRequestButtonElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

import type {
  PaymentRequest,
  PaymentRequestPaymentMethodEvent,
  StripeCardElementChangeEvent,
} from "@stripe/stripe-js";

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

  coupons: string[]; // Array of coupon codes that apply to this event
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

  country: string;

  province: string;

  city: string;

  postalCode: string;
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

const US_STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
];

const COUNTRIES = ["Canada", "US"];

// Postal/Zip code validation patterns
const POSTAL_CODE_PATTERNS = {
  Canada: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
  US: /^\d{5}(-\d{4})?$/,
};

// Phone validation pattern (North American format: at least 10 digits)
const PHONE_PATTERN = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4}$/;

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
  .wallet-checkout { margin-bottom: 14px; }
  .wallet-divider { display: flex; align-items: center; gap: 10px; margin: 14px 0; color: #555; font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; }
  .wallet-divider::before, .wallet-divider::after { content: ""; flex: 1; height: 1px; background: #222; }

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
                  onChange={(e) => {
                    // Only allow numbers, spaces, parentheses, hyphens, and plus sign
                    const phoneValue = e.target.value.replace(
                      /[^0-9\s\-\(\)\+]/g,
                      "",
                    );
                    set("phone", phoneValue);
                  }}
                  placeholder="+1 (555) 000-0000"
                  pattern="^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$"
                  title="Please enter a valid phone number (e.g., +1 (555) 000-0000)"
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
    disableLink: true,
    hidePostalCode: true,
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

  // Per-event coupon map: { [eventId]: Coupon }
  const [appliedCouponsMap, setAppliedCouponsMap] = useState<
    Record<string, Coupon>
  >({});

  const [paymentMethod, setPaymentMethod] = useState<
    "card" | "apple" | "google"
  >("card");

  const [mailOption, setMailOption] = useState<MailOption>("both");

  const [placing, setPlacing] = useState(false);

  const [cardComplete, setCardComplete] = useState(false);

  const [attendeeError, setAttendeeError] = useState("");

  const [buyerPhoneError, setBuyerPhoneError] = useState("");

  const [walletPaymentRequest, setWalletPaymentRequest] =
    useState<PaymentRequest | null>(null);

  const stripe = useStripe();

  const elements = useElements();

  const [buyer, setBuyer] = useState<BuyerInfo>({
    name: "",

    email: "",

    phone: "",

    country: "Canada",

    province: "Ontario",

    city: "",

    postalCode: "",
  });

  // Build attendees list: one per ticket, sorted by tier price descending

  const sortedItems = [...cart].sort((a, b) => b.price - a.price);

  const flatAttendees = sortedItems.flatMap((item) =>
    Array.from({ length: item.quantity }, (_, i) => ({
      tierId: item.tierId,

      tierName: item.tierName,

      eventId: item.eventId,

      eventName: item.eventName,

      eventDate: item.eventDate,

      eventTime: item.eventTime,

      venue: item.venue,

      price: item.price,

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
      // Try sessionStorage first (set by cart handleCheckout)
      const stored = sessionStorage.getItem("sax-checkout");
      if (stored) {
        const data = JSON.parse(stored);
        setCart(data.cart || []);
        if (data.appliedCouponsMap) {
          setAppliedCouponsMap(data.appliedCouponsMap);
        }
      } else {
        // Fallback: read cart + per-event coupons from localStorage
        const cartStored = JSON.parse(localStorage.getItem("sax-cart") || "[]");
        setCart(cartStored);
        const storedCoupons = localStorage.getItem("sax-applied-coupons");
        if (storedCoupons) {
          setAppliedCouponsMap(JSON.parse(storedCoupons));
        }
      }
    };

    initializeCheckout();
  }, []);

  const subtotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );

  // Per-event discount — each coupon only applies to its own event's items
  const discount = cart.reduce((acc, item) => {
    const coupon = appliedCouponsMap[item.eventId];
    if (!coupon) return acc;
    return acc + item.price * item.quantity * (coupon.percentage / 100);
  }, 0);

  const taxable = subtotal - discount;

  const tax = taxable * TAX_RATE;

  const total = taxable + tax;

  const handlePlaceOrder = async (
    walletPaymentMethodId?: string,
    walletEvent?: PaymentRequestPaymentMethodEvent,
  ) => {
    if (!stripe || !elements) {
      alert("Payment system not loaded. Please refresh the page.");

      return;
    }

    // Validate buyer information
    if (
      !buyer.name ||
      !buyer.email ||
      !buyer.phone ||
      !buyer.city ||
      !buyer.country ||
      !buyer.province ||
      !buyer.postalCode
    ) {
      alert("Please fill in all required buyer information.");

      return;
    }

    // Validate postal/zip code format
    const postalCodePattern =
      POSTAL_CODE_PATTERNS[buyer.country as keyof typeof POSTAL_CODE_PATTERNS];
    if (!postalCodePattern.test(buyer.postalCode)) {
      alert(
        `Invalid ${buyer.country === "Canada" ? "postal code" : "zip code"} format.`,
      );
      return;
    }

    // Validate phone format
    if (!PHONE_PATTERN.test(buyer.phone)) {
      setBuyerPhoneError(
        "Please enter a valid phone number (e.g., +1 (555) 000-0000)",
      );
      return;
    }

    setBuyerPhoneError("");

    // Validate at least one attendee field is filled
    const hasAttendeeInfo = attendees.some(
      (attendee) => attendee.name || attendee.email || attendee.phone,
    );
    if (!hasAttendeeInfo) {
      setAttendeeError(
        "Please fill in at least one attendee field (name, email, or phone).",
      );
      return;
    }

    setAttendeeError("");
    setPlacing(true);

    // Group attendees by event to handle multi-event orders correctly
    const usedTicketIds = new Set<string>();
    const attendeesWithTickets = attendees.map((attendee, index) => ({
      ...attendee,
      tierId: flatAttendees[index]?.tierId,
      tierName: flatAttendees[index]?.tierName,
      eventId: flatAttendees[index]?.eventId,
    }));

    // Group attendees by eventId and assign per-event order IDs and ticket IDs
    const attendeesByEvent = new Map<string, typeof attendeesWithTickets>();
    const eventOrderIds = new Map<string, string>();

    attendeesWithTickets.forEach((attendee, index) => {
      const attendeeTier = flatAttendees[index];
      if (attendeeTier?.eventId) {
        if (!attendeesByEvent.has(attendeeTier.eventId)) {
          attendeesByEvent.set(attendeeTier.eventId, []);
          // Generate order ID for this event using event name and date
          const eventOrder = createOrderNumber(
            attendeeTier.eventName,
            attendeeTier.eventDate,
          );
          eventOrderIds.set(attendeeTier.eventId, eventOrder);
        }
        attendeesByEvent.get(attendeeTier.eventId)!.push(attendee);
      }
    });

    // Assign ticket IDs using per-event order IDs
    const attendeesWithTicketIds = attendeesWithTickets.map(
      (attendee, index) => {
        const attendeeTier = flatAttendees[index];
        const eventId = attendeeTier?.eventId;
        const eventOrderId = eventId ? eventOrderIds.get(eventId) : "";
        return {
          ...attendee,
          ticketId: eventOrderId
            ? createTicketId(eventOrderId, usedTicketIds)
            : "",
        };
      },
    );

    // Use the first event's order ID as the master order ID for the order record
    const firstEventId = Array.from(eventOrderIds.values())[0];
    const masterOrderId =
      firstEventId ||
      createOrderNumber("MULTI", new Date().toISOString().split("T")[0]);

    const order = {
      cart,

      buyer,

      attendees: attendeesWithTicketIds,

      appliedCoupon: Object.values(appliedCouponsMap)[0] ?? null, // legacy compat
      appliedCouponsMap,

      mailOption,

      paymentMethod,

      subtotal,

      discount,

      tax,

      total,

      orderId: masterOrderId,

      createdAt: new Date().toISOString(),
    };

    let walletCompleted = false;

    try {
      let paymentIntentId: string | undefined;

      if (walletPaymentMethodId) {
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: total,
            currency: "cad",
            orderId: masterOrderId,
            customer_email: buyer.email,
            metadata: {
              orderId: masterOrderId,
              eventNames: cart.map((c) => c.eventName).join(", "),
            },
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create payment intent");
        }

        const { clientSecret } = await response.json();
        const paymentResult = await stripe.confirmCardPayment(
          clientSecret,
          { payment_method: walletPaymentMethodId },
          { handleActions: false },
        );

        if (paymentResult.error) {
          walletEvent?.complete("fail");
          walletCompleted = true;
          alert(`Payment failed: ${paymentResult.error.message}`);
          setPlacing(false);
          return;
        }

        walletEvent?.complete("success");
        walletCompleted = true;

        let confirmedPaymentIntent = paymentResult.paymentIntent;
        if (confirmedPaymentIntent?.status === "requires_action") {
          const actionResult = await stripe.confirmCardPayment(clientSecret);
          if (actionResult.error) {
            alert(`Payment failed: ${actionResult.error.message}`);
            setPlacing(false);
            return;
          }
          confirmedPaymentIntent = actionResult.paymentIntent;
        }

        if (confirmedPaymentIntent?.status !== "succeeded") {
          alert("Payment processing failed. Please try again.");
          setPlacing(false);
          return;
        }

        paymentIntentId = confirmedPaymentIntent.id;
      } else if (paymentMethod === "card") {
        // Create payment intent

        const response = await fetch("/api/orders", {
          method: "POST",

          headers: { "Content-Type": "application/json" },

          body: JSON.stringify({
            amount: total,

            currency: "cad",

            orderId: masterOrderId,

            customer_email: buyer.email,

            metadata: {
              orderId: masterOrderId,

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

        paymentIntentId = paymentResult.paymentIntent.id;
      }

      // Save order to MongoDB
      const saveOrderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.orderId,
          buyer: order.buyer,
          attendees: order.attendees,
          cart: cart,
          total: total,
          mailOption: order.mailOption,
          appliedCoupon: order.appliedCoupon,
          paymentMethod: order.paymentMethod,
          paymentIntentId,
          createdAt: new Date().toISOString(),
        }),
      });

      if (!saveOrderRes.ok) {
        const errorData = await saveOrderRes.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save order");
      }

      const savedOrder: {
        ticketDeliveryTokens?: Record<string, string>;
      } = await saveOrderRes.json();

      // Send tickets after order confirmation - group by event
      const eventsMap = new Map<string, (typeof cart)[0]>();
      cart.forEach((item) => {
        eventsMap.set(item.eventId, item);
      });

      // Group attendees by eventId
      const attendeesByEvent = new Map<string, typeof order.attendees>();
      order.attendees.forEach((attendee, index) => {
        const attendeeTier = flatAttendees[index];
        if (attendeeTier?.eventId) {
          if (!attendeesByEvent.has(attendeeTier.eventId)) {
            attendeesByEvent.set(attendeeTier.eventId, []);
          }
          attendeesByEvent.get(attendeeTier.eventId)!.push(attendee);
        }
      });

      // Send tickets for each event group
      for (const [eventId, eventAttendees] of attendeesByEvent) {
        const eventDetails = eventsMap.get(eventId);
        const eventOrderId = eventOrderIds.get(eventId);
        if (!eventDetails || !eventOrderId) continue;

        const sendTicketsRes = await fetch("/api/send-tickets", {
          method: "POST",

          headers: { "Content-Type": "application/json" },

          body: JSON.stringify({
            orderId: eventOrderId,

            mailOption: order.mailOption,

            buyer: { name: order.buyer.name, email: order.buyer.email },

            event: {
              name: eventDetails.eventName,
              date: eventDetails.eventDate,
              time: eventDetails.eventTime,
              venue: eventDetails.venue,
            },

            ticketDeliveryToken:
              savedOrder.ticketDeliveryTokens?.[eventOrderId],

            attendees: eventAttendees.map((a) => ({
              name: a.name,
              email: a.email,
              tierName: a.tierName || "Standard",
              ticketId: a.ticketId,
              price: `$${eventDetails.price.toFixed(2)}`,
            })),
          }),
        });

        if (!sendTicketsRes.ok) {
          const errorData = await sendTicketsRes.json();
          alert(
            `Warning: Tickets for ${eventDetails.eventName} were not sent via email. Error: ${errorData.error || "Unknown error"}`,
          );
        }
      }

      // Store order in session

      sessionStorage.setItem("sax-order", JSON.stringify(order));

      // Clear cart

      localStorage.removeItem("sax-cart");
      localStorage.removeItem("sax-applied-coupons");
      sessionStorage.removeItem("sax-checkout");
      setAppliedCouponsMap({});

      window.dispatchEvent(new Event("cartUpdated"));

      // Redirect to receipt page

      await new Promise((resolve) => setTimeout(resolve, 800));

      router.push("/receipt");
    } catch (error) {
      if (walletEvent && !walletCompleted) {
        walletEvent.complete("fail");
      }
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";

      alert(`Error: ${errorMessage}`);

      setPlacing(false);
    }
  };

  const isValid =
    buyer.name &&
    buyer.email &&
    buyer.phone &&
    buyer.city &&
    buyer.country &&
    buyer.province &&
    buyer.postalCode &&
    POSTAL_CODE_PATTERNS[
      buyer.country as keyof typeof POSTAL_CODE_PATTERNS
    ].test(buyer.postalCode);

  const handlePlaceOrderRef = useRef(handlePlaceOrder);

  useEffect(() => {
    handlePlaceOrderRef.current = handlePlaceOrder;
  });

  useEffect(() => {
    if (!stripe || !isValid || cart.length === 0 || total <= 0) {
      return;
    }

    const paymentRequest = stripe.paymentRequest({
      country: "CA",
      currency: "cad",
      total: {
        label: "BePraize Sax tickets",
        amount: Math.round(total * 100),
      },
      displayItems: [
        {
          label: "Subtotal",
          amount: Math.round(taxable * 100),
        },
        ...(discount > 0
          ? [
              {
                label: "Discount",
                amount: -Math.round(discount * 100),
              },
            ]
          : []),
        {
          label: "HST",
          amount: Math.round(tax * 100),
        },
      ],
      requestPayerName: true,
      requestPayerEmail: true,
    });

    let active = true;

    paymentRequest
      .canMakePayment()
      .then((result) => {
        if (!active) return;

        setWalletPaymentRequest(
          result?.applePay || result?.googlePay ? paymentRequest : null,
        );
      })
      .catch(() => {
        if (active) setWalletPaymentRequest(null);
      });

    const handleWalletPayment = (event: PaymentRequestPaymentMethodEvent) => {
      void handlePlaceOrderRef.current(event.paymentMethod.id, event);
    };

    paymentRequest.on("paymentmethod", handleWalletPayment);

    return () => {
      active = false;
      paymentRequest.off("paymentmethod", handleWalletPayment);
    };
  }, [stripe, isValid, cart.length, total, taxable, discount, tax]);
  const paymentOptions = [
    {
      id: "card" as const,

      icon: "💳",

      name: "Credit / Debit Card",

      sub: "Visa, Mastercard, Amex",
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
                    className={`form-input${
                      buyer.phone && !PHONE_PATTERN.test(buyer.phone)
                        ? " error"
                        : ""
                    }`}
                    type="tel"
                    value={buyer.phone}
                    onChange={(e) => {
                      // Only allow numbers, spaces, parentheses, hyphens, and plus sign
                      const phoneValue = e.target.value.replace(
                        /[^0-9\s\-\(\)\+]/g,
                        "",
                      );
                      setBuyer({ ...buyer, phone: phoneValue });
                      setBuyerPhoneError("");
                    }}
                    placeholder="+1 (555) 000-0000"
                    pattern="^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4}$"
                    title="Please enter a valid phone number (e.g., +1 (555) 000-0000)"
                  />
                </div>
                {buyerPhoneError && (
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#e53e3e",
                      marginTop: "4px",
                    }}
                  >
                    {buyerPhoneError}
                  </div>
                )}
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Country</label>

                <select
                  className="form-select"
                  value={buyer.country}
                  onChange={(e) =>
                    setBuyer({
                      ...buyer,
                      country: e.target.value,
                      province: "",
                      postalCode: "",
                    })
                  }
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {buyer.country === "Canada" ? "Province" : "State"}
                </label>

                <select
                  className="form-select"
                  value={buyer.province}
                  onChange={(e) =>
                    setBuyer({ ...buyer, province: e.target.value })
                  }
                >
                  <option value="">
                    Select {buyer.country === "Canada" ? "province" : "state"}
                  </option>
                  {(buyer.country === "Canada" ? PROVINCES : US_STATES).map(
                    (p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ),
                  )}
                </select>
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
                <label className="form-label">
                  {buyer.country === "Canada" ? "Postal Code" : "Zip Code"}
                </label>

                <input
                  className={`form-input${
                    buyer.postalCode &&
                    !POSTAL_CODE_PATTERNS[
                      buyer.country as keyof typeof POSTAL_CODE_PATTERNS
                    ].test(buyer.postalCode)
                      ? " error"
                      : ""
                  }`}
                  value={buyer.postalCode}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    setBuyer({ ...buyer, postalCode: value });
                  }}
                  placeholder={buyer.country === "Canada" ? "A1A 1A1" : "12345"}
                />
                {buyer.postalCode &&
                  !POSTAL_CODE_PATTERNS[
                    buyer.country as keyof typeof POSTAL_CODE_PATTERNS
                  ].test(buyer.postalCode) && (
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#e53e3e",
                        marginTop: "4px",
                      }}
                    >
                      {buyer.country === "Canada"
                        ? "Invalid format. Use A1A 1A1"
                        : "Invalid format. Use 12345 or 12345-6789"}
                    </div>
                  )}
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

              {attendeeError && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "#e53e3e",
                    marginBottom: "12px",
                  }}
                >
                  {attendeeError}
                </div>
              )}

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

            {walletPaymentRequest &&
              isValid &&
              cart.length > 0 &&
              total > 0 && (
                <div className="wallet-checkout">
                  <PaymentRequestButtonElement
                    options={{
                      paymentRequest: walletPaymentRequest,
                      style: {
                        paymentRequestButton: {
                          type: "buy",
                          theme: "dark",
                          height: "48px",
                        },
                      },
                    }}
                  />
                  <div className="wallet-divider">or pay by card</div>
                </div>
              )}

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

          {/* Order rows grouped by event */}
          {(() => {
            const grouped = cart.reduce<Record<string, typeof cart>>(
              (acc, item) => {
                if (!acc[item.eventId]) acc[item.eventId] = [];
                acc[item.eventId].push(item);
                return acc;
              },
              {},
            );

            return Object.entries(grouped).map(([eventId, items]) => {
              const coupon = appliedCouponsMap[eventId];
              const eventDiscount = coupon
                ? items.reduce(
                    (a, i) =>
                      a + i.price * i.quantity * (coupon.percentage / 100),
                    0,
                  )
                : 0;
              return (
                <div key={eventId}>
                  <p className="summary-event">{items[0].eventName}</p>
                  {coupon && (
                    <div
                      className="coupon-msg coupon-valid"
                      style={{ marginBottom: 8 }}
                    >
                      <CheckCircle size={12} />
                      <span>
                        <strong>{coupon.name}</strong> — {coupon.percentage}%
                        off
                      </span>
                    </div>
                  )}
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
                      <span>-${eventDiscount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              );
            });
          })()}

          <div style={{ display: "flex", flexDirection: "column" }}>
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
            onClick={() => handlePlaceOrder()}
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
