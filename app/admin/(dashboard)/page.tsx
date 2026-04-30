/* eslint-disable @next/next/no-img-element */
"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Scanner, type IDetectedBarcode } from "@yudiel/react-qr-scanner";
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  Tag,
  Plus,
  Pencil,
  Trash2,
  X,
  TrendingUp,
  CheckCircle,
  XCircle,
  BarChart3,
  MapPin,
  Percent,
  AlertTriangle,
  Image as ImageIcon,
  Loader2,
  ShoppingBag,
  RefreshCw,
  DollarSign,
  QrCode,
  Users,
  Edit,
  Menu,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type TabId =
  | "dashboard"
  | "events"
  | "tickets"
  | "coupons"
  | "transactions"
  | "checkin"
  | "users";

// ─── Constants ───────────────────────────────────────────────────────────────

const NAV_ITEMS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "events", label: "Events", icon: Calendar },
  { id: "tickets", label: "Ticket Tiers", icon: Ticket },
  { id: "coupons", label: "Coupons", icon: Tag },
  { id: "transactions", label: "Transactions", icon: ShoppingBag },
  { id: "checkin", label: "Check-in", icon: QrCode },
  { id: "users", label: "Users", icon: Users },
];

export type TransactionStatus = "success" | "failed" | "pending" | "refunded";

interface Transaction {
  _id: string;
  orderId: string;
  buyerName: string;
  buyerEmail: string;
  status: TransactionStatus;
  total: number;
  ticketCount: number;
  eventName: string;
  createdAt: string;
}

interface DetailedOrder {
  _id: string;
  orderId: string;
  buyer: {
    name: string;
    email: string;
    phone?: string;
  };
  cart: Array<{
    eventId: string;
    eventName: string;
    tierId: string;
    tierName: string;
    price: number;
    quantity: number;
  }>;
  attendees: Array<{
    name: string;
    email: string;
    phone?: string;
    ticketId?: string;
    tierId?: string;
    tierName?: string;
  }>;
  mailOption: "buyer" | "attendees" | "both";
  paymentMethod: string;
  appliedCoupon?: {
    name: string;
    percentage: number;
  };
  total: number;
  status: TransactionStatus;
  createdAt: string;
}

interface CheckIn {
  ticketId: string;
  orderId: string;
  signature?: string;
  tier?: string;
  attendeeName: string;
  attendeeEmail: string;
  eventName: string;
  tierName: string;
  checkInTime: string;
}

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

interface TicketTier {
  _id: string;
  name: string;
  price: number;
  description: string;
  stock: number | null;
}

interface Coupon {
  _id: string;
  name: string;
  percentage: number;
  active: boolean;
}

interface DeleteConfirm {
  type: "event" | "ticket" | "coupon";
  _id: string;
  name: string;
}

interface ModalState<T> {
  type: "create" | "edit";
  data?: T;
}

type EventPayload = Omit<Event, "_id"> & { _id?: string };
type TierPayload = Omit<TicketTier, "_id"> & { _id?: string };
type CouponPayload = Omit<Coupon, "_id"> & { _id?: string };

// ─── Constants ───────────────────────────────────────────────────────────────

const C = {
  bg: "#09090f",
  sidebar: "#0f0f18",
  card: "#13131e",
  cardBorder: "#1e1e30",
  accent: "#f59e0b",
  accentDim: "rgba(245,158,11,0.12)",
  accentBorder: "rgba(245,158,11,0.35)",
  text: "#eeeef5",
  muted: "#7777a0",
  faint: "#333350",
  success: "#10b981",
  successDim: "rgba(16,185,129,0.12)",
  danger: "#f43f5e",
  dangerDim: "rgba(244,63,94,0.12)",
  warning: "#f59e0b",
  info: "#818cf8",
  infoDim: "rgba(129,140,248,0.12)",
} as const;

const FONT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  input, textarea, select {
    background: ${C.bg} !important;
    border: 1px solid ${C.cardBorder} !important;
    color: ${C.text} !important;
    border-radius: 8px !important;
    padding: 9px 12px !important;
    font-size: 14px !important;
    font-family: 'DM Sans', sans-serif !important;
    width: 100%;
    outline: none;
    transition: border-color 0.15s;
  }
  input:focus, textarea:focus, select:focus { border-color: ${C.accent} !important; }
  textarea { min-height: 72px; resize: vertical; }
  select option { background: ${C.sidebar}; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${C.faint}; border-radius: 4px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spin { animation: spin 0.8s linear infinite; }
`;

// ─── Shared Styles ────────────────────────────────────────────────────────────

const TABLE_HEAD: React.CSSProperties = {
  padding: "10px 14px",
  textAlign: "left",
  fontSize: 11,
  fontWeight: 600,
  color: C.muted,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  borderBottom: `1px solid ${C.cardBorder}`,
};

const TABLE_CELL: React.CSSProperties = {
  padding: "13px 14px",
  borderBottom: `1px solid ${C.faint}`,
  fontSize: 14,
  color: C.text,
  verticalAlign: "middle",
};

// ─── Primitive Components ─────────────────────────────────────────────────────

type BtnVariant = "primary" | "secondary" | "danger" | "ghost" | "warning";

interface BtnProps {
  variant?: BtnVariant;
  onClick?: () => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
  disabled?: boolean;
}

function Btn({
  variant = "primary",
  onClick,
  children,
  style = {},
  disabled,
}: BtnProps) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: 13,
    fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif",
    border: "none",
    transition: "all 0.15s",
    opacity: disabled ? 0.5 : 1,
  };
  const variants: Record<BtnVariant, React.CSSProperties> = {
    primary: {
      background: C.accent,
      color: "#0a0a0f",
      padding: "9px 18px",
      fontWeight: 600,
    },
    secondary: {
      background: "transparent",
      color: C.muted,
      padding: "8px 14px",
      border: `1px solid ${C.cardBorder}`,
    },
    danger: {
      background: C.dangerDim,
      color: C.danger,
      padding: "7px 14px",
      border: `1px solid rgba(244,63,94,0.3)`,
    },
    ghost: {
      background: "transparent",
      color: C.muted,
      padding: "6px 10px",
      border: `1px solid ${C.faint}`,
    },
    warning: {
      background: "rgba(245,158,11,0.1)",
      color: C.warning,
      padding: "7px 14px",
      border: `1px solid rgba(245,158,11,0.3)`,
    },
  };
  return (
    <button
      disabled={disabled}
      style={{ ...base, ...variants[variant], ...style }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Badge({ active }: { active: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 500,
        background: active ? C.successDim : C.dangerDim,
        color: active ? C.success : C.danger,
      }}
    >
      {active ? <CheckCircle size={11} /> : <XCircle size={11} />}
      {active ? "Active" : "Inactive"}
    </span>
  );
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subtitle,
}: StatCardProps) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.cardBorder}`,
        borderRadius: 14,
        padding: "1.25rem 1.5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: C.muted,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {label}
        </span>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: `${color}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={16} color={color} />
        </div>
      </div>
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 30,
          fontWeight: 700,
          color: C.text,
        }}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {subtitle && (
        <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
          {subtitle}
        </div>
      )}
      <div
        style={{
          width: 36,
          height: 3,
          background: color,
          borderRadius: 2,
          marginTop: 12,
          opacity: 0.7,
        }}
      />
    </div>
  );
}

function Divider() {
  return (
    <div style={{ height: 1, background: C.cardBorder, margin: "20px 0" }} />
  );
}

interface FormGroupProps {
  label: string;
  children: React.ReactNode;
}

function FormGroup({ label, children }: FormGroupProps) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        style={{
          display: "block",
          fontSize: 11,
          fontWeight: 600,
          color: C.muted,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function ModalSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: C.accent,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        marginBottom: 12,
      }}
    >
      {children}
    </h4>
  );
}

function ModalInfoPanel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.cardBorder}`,
        borderRadius: 10,
        padding: "14px 16px",
      }}
    >
      {children}
    </div>
  );
}

function DetailItem({
  label,
  children,
  accent,
}: {
  label: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div>
      <span
        style={{
          display: "block",
          fontSize: 11,
          fontWeight: 600,
          color: C.muted,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          marginBottom: 5,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: accent ? C.accent : C.text,
        }}
      >
        {children}
      </span>
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  sub?: string;
  action?: React.ReactNode;
}

function SectionHeader({ title, sub, action }: SectionHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginBottom: 20,
      }}
    >
      <div>
        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 22,
            fontWeight: 700,
            color: C.text,
          }}
        >
          {title}
        </h2>
        {sub && (
          <p style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>{sub}</p>
        )}
      </div>
      {action}
    </div>
  );
}

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}

function Modal({ title, onClose, children, wide }: ModalProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: C.sidebar,
          border: `1px solid ${C.cardBorder}`,
          borderRadius: 16,
          padding: "1.75rem",
          width: "100%",
          maxWidth: wide ? 620 : 480,
          maxHeight: "92vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h3
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 18,
              fontWeight: 700,
              color: C.text,
            }}
          >
            {title}
          </h3>
          <button
            style={{
              background: "transparent",
              border: "none",
              color: C.muted,
              cursor: "pointer",
              padding: 4,
            }}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

function ConfirmModal({
  message,
  onConfirm,
  onCancel,
  loading,
}: ConfirmModalProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
        padding: 16,
      }}
    >
      <div
        style={{
          background: C.sidebar,
          border: `1px solid rgba(244,63,94,0.3)`,
          borderRadius: 14,
          padding: "1.5rem",
          width: "100%",
          maxWidth: 400,
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: C.dangerDim,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <AlertTriangle size={22} color={C.danger} />
        </div>
        <p
          style={{
            fontSize: 15,
            color: C.text,
            marginBottom: 6,
            fontWeight: 500,
          }}
        >
          Confirm Deletion
        </p>
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <Btn variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Btn>
          <Btn variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? (
              <Loader2 size={13} className="spin" />
            ) : (
              <Trash2 size={13} />
            )}{" "}
            Delete
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Form Components ──────────────────────────────────────────────────────────

interface EventFormProps {
  initial?: Event;
  ticketTiers: TicketTier[];
  coupons: Coupon[];
  onSave: (data: EventPayload) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}

function EventForm({
  initial,
  ticketTiers,
  coupons,
  onSave,
  onClose,
  saving,
}: EventFormProps) {
  const [form, setForm] = useState<EventPayload>(
    initial
      ? { ...initial, city: initial.city ?? "" }
      : {
          name: "",
          location: "",
          address: "",
          city: "",
          date: "",
          time: "",
          description: "",
          picture: "",
          ticketTierIds: [],
          coupons: [],
          saleEndDate: "",
          saleEndTime: "",
        },
  );
  const [picturePreview, setPicturePreview] = useState<string>(
    initial?.picture ?? "",
  );

  const set = <K extends keyof EventPayload>(k: K, v: EventPayload[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleTier = (id: string) =>
    set(
      "ticketTierIds",
      form.ticketTierIds.includes(id)
        ? form.ticketTierIds.filter((x) => x !== id)
        : [...form.ticketTierIds, id],
    );

  const toggleCoupon = (name: string) =>
    set(
      "coupons",
      form.coupons.includes(name)
        ? form.coupons.filter((x) => x !== name)
        : [...form.coupons, name],
    );

  const handlePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPicturePreview(result);
      set("picture", result);
    };
    reader.readAsDataURL(file);
  };

  const isValid = Boolean(form.name && form.location && form.date);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormGroup label="Event Name">
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Midnight Jazz Festival"
          />
        </FormGroup>
        <FormGroup label="Venue / Location">
          <input
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="Venue name"
          />
        </FormGroup>
      </div>
      <FormGroup label="Address">
        <input
          value={form.address}
          onChange={(e) => set("address", e.target.value)}
          placeholder="e.g. 5040 Yonge St, Toronto, ON"
        />
      </FormGroup>
      <FormGroup label="City">
        <input
          value={form.city}
          onChange={(e) => set("city", e.target.value)}
          placeholder="e.g. Toronto"
        />
      </FormGroup>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormGroup label="Date">
          <input
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
          />
        </FormGroup>
        <FormGroup label="Time">
          <input
            type="time"
            value={form.time}
            onChange={(e) => set("time", e.target.value)}
          />
        </FormGroup>
      </div>
      {/* Sale deadline — visually grouped as a distinct section */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.cardBorder}`,
          borderRadius: 10,
          padding: "14px 16px",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: C.accent,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 12,
          }}
        >
          Ticket Sale Deadline
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>
          Tickets will be purchasable until this date &amp; time. Leave blank to
          close sales when the event starts.
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <FormGroup label="Sale End Date">
            <input
              type="date"
              value={form.saleEndDate ?? ""}
              onChange={(e) => set("saleEndDate", e.target.value)}
            />
          </FormGroup>
          <FormGroup label="Sale End Time">
            <input
              type="time"
              value={form.saleEndTime ?? ""}
              onChange={(e) => set("saleEndTime", e.target.value)}
            />
          </FormGroup>
        </div>
        {(form.saleEndDate || form.saleEndTime) && (
          <button
            onClick={() => {
              set("saleEndDate", "");
              set("saleEndTime", "");
            }}
            style={{
              fontSize: 12,
              color: C.muted,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            ✕ Clear deadline
          </button>
        )}
      </div>
      <FormGroup label="Description">
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Describe the event..."
        />
      </FormGroup>
      <FormGroup label="Event Picture">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "1.25rem",
              borderRadius: 10,
              cursor: "pointer",
              border: `2px dashed ${picturePreview ? C.accent : C.faint}`,
              background: picturePreview ? C.accentDim : "transparent",
              transition: "all 0.15s",
            }}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handlePictureUpload}
              style={{ display: "none" }}
            />
            {picturePreview ? (
              <img
                src={picturePreview}
                alt="Preview"
                style={{
                  width: "100%",
                  maxHeight: 160,
                  objectFit: "cover",
                  borderRadius: 8,
                }}
              />
            ) : (
              <>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: C.faint,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ImageIcon size={18} color={C.muted} />
                </div>
                <span style={{ fontSize: 13, color: C.muted }}>
                  Click to upload an image from your device
                </span>
                <span style={{ fontSize: 11, color: C.faint }}>
                  PNG, JPG, WEBP supported
                </span>
              </>
            )}
          </label>
          {picturePreview && (
            <Btn
              variant="ghost"
              onClick={() => {
                setPicturePreview("");
                set("picture", "");
              }}
              style={{ alignSelf: "flex-start" }}
            >
              <X size={13} /> Remove picture
            </Btn>
          )}
        </div>
      </FormGroup>
      <FormGroup label="Ticket Tiers">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {ticketTiers.length === 0 && (
            <span style={{ fontSize: 13, color: C.muted }}>
              No ticket tiers yet — create one first.
            </span>
          )}
          {ticketTiers.map((tt) => {
            const selected = form.ticketTierIds.includes(tt._id);
            return (
              <button
                key={tt._id}
                onClick={() => toggleTier(tt._id)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  fontSize: 13,
                  cursor: "pointer",
                  border: `1px solid ${selected ? C.accent : C.cardBorder}`,
                  background: selected ? C.accentDim : "transparent",
                  color: selected ? C.accent : C.muted,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {tt.name}
              </button>
            );
          })}
        </div>
      </FormGroup>
      <FormGroup label="Coupons">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {coupons
            .filter((c) => c.active)
            .map((c) => {
              const selected = form.coupons.includes(c.name);
              return (
                <button
                  key={c._id}
                  onClick={() => toggleCoupon(c.name)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 20,
                    fontSize: 13,
                    cursor: "pointer",
                    border: `1px solid ${selected ? C.info : C.cardBorder}`,
                    background: selected ? C.infoDim : "transparent",
                    color: selected ? C.info : C.muted,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {c.name} ({c.percentage}%)
                </button>
              );
            })}
          {coupons.filter((c) => c.active).length === 0 && (
            <span style={{ fontSize: 13, color: C.muted }}>
              No active coupons available
            </span>
          )}
        </div>
      </FormGroup>
      <Divider />
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Btn>
        <Btn
          variant="primary"
          onClick={() => isValid && onSave(form)}
          disabled={!isValid || saving}
        >
          {saving ? (
            <Loader2 size={14} className="spin" />
          ) : (
            <CheckCircle size={14} />
          )}{" "}
          Save Event
        </Btn>
      </div>
    </>
  );
}

interface TierFormProps {
  initial?: TicketTier;
  onSave: (data: TierPayload) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}

function TierForm({ initial, onSave, onClose, saving }: TierFormProps) {
  const [form, setForm] = useState<TierPayload>(
    initial
      ? ({ ...initial, stock: initial.stock ?? null } as TierPayload)
      : ({ name: "", price: 0, description: "", stock: null } as TierPayload),
  );
  const set = <K extends keyof TierPayload>(k: K, v: TierPayload[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const isValid = Boolean(form.name && form.price);
  return (
    <>
      <FormGroup label="Tier Name">
        <input
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. VIP Access"
        />
      </FormGroup>
      <FormGroup label="Price (CAD $)">
        <input
          type="number"
          min={0}
          value={form.price}
          onChange={(e) => set("price", Number(e.target.value))}
          placeholder="0.00"
        />
      </FormGroup>
      <FormGroup label="Short Description">
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="What's included with this ticket?"
        />
      </FormGroup>
      <FormGroup label="Stock Quantity">
        <input
          type="number"
          min={0}
          value={form.stock ?? ""}
          onChange={(e) =>
            set("stock", e.target.value === "" ? null : Number(e.target.value))
          }
          placeholder="Leave blank for unlimited"
        />
        <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
          Leave blank for unlimited tickets
        </div>
      </FormGroup>
      <Divider />
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Btn>
        <Btn
          variant="primary"
          onClick={() => isValid && onSave(form)}
          disabled={!isValid || saving}
        >
          {saving ? (
            <Loader2 size={14} className="spin" />
          ) : (
            <CheckCircle size={14} />
          )}{" "}
          Save Ticket Tier
        </Btn>
      </div>
    </>
  );
}

interface CouponFormProps {
  initial?: Coupon;
  onSave: (data: CouponPayload) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}

function CouponForm({ initial, onSave, onClose, saving }: CouponFormProps) {
  const [form, setForm] = useState<CouponPayload>(
    initial ? { ...initial } : { name: "", percentage: 0, active: true },
  );
  const set = <K extends keyof CouponPayload>(k: K, v: CouponPayload[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const isValid = Boolean(form.name && form.percentage);
  return (
    <>
      <FormGroup label="Coupon Code">
        <input
          value={form.name}
          onChange={(e) => set("name", e.target.value.toUpperCase())}
          placeholder="e.g. SUMMER20"
        />
      </FormGroup>
      <FormGroup label="Discount Percentage">
        <div style={{ position: "relative" }}>
          <input
            type="number"
            min={1}
            max={100}
            value={form.percentage}
            onChange={(e) => set("percentage", Number(e.target.value))}
            placeholder="e.g. 20"
            style={{ paddingRight: 36 }}
          />
          <Percent
            size={14}
            color={C.muted}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
            }}
          />
        </div>
      </FormGroup>
      <Divider />
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Btn>
        <Btn
          variant="primary"
          onClick={() => isValid && onSave(form)}
          disabled={!isValid || saving}
        >
          {saving ? (
            <Loader2 size={14} className="spin" />
          ) : (
            <CheckCircle size={14} />
          )}{" "}
          Save Coupon
        </Btn>
      </div>
    </>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  const box = (w: string, h = "14px") => (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 6,
        background: C.cardBorder,
        opacity: 0.6,
      }}
    />
  );
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: "2rem",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 14,
        }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              background: C.card,
              border: `1px solid ${C.cardBorder}`,
              borderRadius: 14,
              padding: "1.25rem 1.5rem",
            }}
          >
            {box("60%")} <div style={{ marginTop: 12 }} /> {box("40%", "30px")}
          </div>
        ))}
      </div>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            background: C.card,
            border: `1px solid ${C.cardBorder}`,
            borderRadius: 12,
            padding: "1rem 1.25rem",
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          {box("30%")} {box("20%")} {box("15%")}
        </div>
      ))}
    </div>
  );
}

function parseScannedTicket(rawValue: string) {
  const value = rawValue.trim();
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as {
      ticketId?: string;
      orderId?: string;
      signature?: string;
      tier?: string;
    };
    if (parsed.ticketId) {
      return {
        ticketId: parsed.ticketId,
        orderId:
          parsed.orderId || parsed.ticketId.split("-").slice(0, -1).join("-"),
        signature: parsed.signature,
        tier: parsed.tier,
      };
    }
  } catch {
    // Ticket QR codes are usually plain text payloads.
  }

  if (value.includes("TKT:") || value.includes("ORD:")) {
    const parts = value.split("|");
    const ticketPart = parts.find((part) => part.startsWith("TKT:"));
    const orderPart = parts.find((part) => part.startsWith("ORD:"));
    const tierPart = parts.find((part) => part.startsWith("TIER:"));
    const signaturePart = parts.find((part) => part.startsWith("SIG:"));
    const ticketId = ticketPart?.replace("TKT:", "").trim();
    const orderId = orderPart?.replace("ORD:", "").trim();
    const tier = tierPart?.replace("TIER:", "").trim();
    const signature = signaturePart?.replace("SIG:", "").trim();

    if (ticketId) {
      return {
        ticketId,
        orderId: orderId || ticketId.split("-").slice(0, -1).join("-"),
        signature,
        tier,
      };
    }
  }

  try {
    const url = new URL(value);
    const ticketId = url.searchParams.get("ticketId");
    const orderId = url.searchParams.get("orderId");
    const signature = url.searchParams.get("signature") || undefined;
    const tier = url.searchParams.get("tier") || undefined;

    if (ticketId) {
      return {
        ticketId,
        orderId: orderId || ticketId.split("-").slice(0, -1).join("-"),
        signature,
        tier,
      };
    }
  } catch {
    // Not a URL, so treat it as a raw ticket id.
  }

  return {
    ticketId: value,
    orderId: value.split("-").slice(0, -1).join("-"),
  };
}

function randomTicketSuffix() {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return String(1000 + (values[0] % 9000));
}

function createClientTicketId(orderNumber: string, usedTicketIds: Set<string>) {
  let ticketId = `${orderNumber}-${randomTicketSuffix()}`;

  while (usedTicketIds.has(ticketId)) {
    ticketId = `${orderNumber}-${randomTicketSuffix()}`;
  }

  usedTicketIds.add(ticketId);
  return ticketId;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab] = useState<TabId>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive breakpoint
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // ── Data state ──
  const [events, setEvents] = useState<Event[]>([]);
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  // Users state
  const [users, setUsers] = useState<
    {
      _id: string;
      username: string;
      email: string;
      role: string;
      permissions: string[];
      isActive: boolean;
      lastLogin?: string;
      createdAt: string;
      updatedAt: string;
    }[]
  >([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Current user permissions and role
  const [currentUserPermissions, setCurrentUserPermissions] = useState<
    string[]
  >([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    userId: string;
    username: string;
  } | null>(null);

  // ── UI state ──
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [eventModal, setEventModal] = useState<ModalState<Event> | null>(null);
  const [tierModal, setTierModal] = useState<ModalState<TicketTier> | null>(
    null,
  );
  const [couponModal, setCouponModal] = useState<ModalState<Coupon> | null>(
    null,
  );
  const [confirm, setConfirm] = useState<DeleteConfirm | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Transaction detail modal state
  const [transactionModal, setTransactionModal] =
    useState<DetailedOrder | null>(null);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [resendingTickets, setResendingTickets] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerPaused, setScannerPaused] = useState(false);
  const [scannerStatus, setScannerStatus] = useState(
    "Camera is off. Start scanning when you are ready.",
  );
  const [lastScannedCode, setLastScannedCode] = useState("");
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [checkInsLoading, setCheckInsLoading] = useState(false);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [manualTicketInput, setManualTicketInput] = useState("");
  const [selectedCheckInEvent, setSelectedCheckInEvent] = useState<
    string | null
  >(null);

  // Notification modal state
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  // User modal state
  const [userModal, setUserModal] = useState<{
    type: "create" | "edit";
    data?: {
      _id: string;
      username: string;
      email: string;
      role: string;
      permissions: string[];
      isActive: boolean;
      lastLogin?: string;
      createdAt: string;
      updatedAt: string;
    };
  } | null>(null);

  // User form state
  const [userForm, setUserForm] = useState({
    username: "",
    password: "",
    role: "user",
    permissions: [] as string[],
    isActive: true,
  });

  // ── Data fetching ──

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [evRes, ttRes, cpRes, txRes] = await Promise.all([
          fetch("/api/events"),
          fetch("/api/ticket-tiers"),
          fetch("/api/coupons"),
          fetch("/api/orders"),
        ]);
        if (!evRes.ok || !ttRes.ok || !cpRes.ok || !txRes.ok)
          throw new Error("One or more requests failed");
        const [evData, ttData, cpData, txData] = await Promise.all([
          evRes.json(),
          ttRes.json(),
          cpRes.json(),
          txRes.json(),
        ]);
        // Only update state if component is still mounted
        if (isMounted) {
          // Normalize MongoDB _id
          setEvents(
            evData.map((e: { _id: { toString(): string } | string }) => ({
              ...e,
              _id:
                typeof e._id === "object" && e._id?.toString
                  ? e._id.toString()
                  : e._id,
            })),
          );
          setTicketTiers(
            ttData.map((t: { _id: { toString(): string } | string }) => ({
              ...t,
              _id:
                typeof t._id === "object" && t._id?.toString
                  ? t._id.toString()
                  : t._id,
            })),
          );
          setCoupons(
            cpData.map((c: { _id: { toString(): string } | string }) => ({
              ...c,
              _id:
                typeof c._id === "object" && c._id?.toString
                  ? c._id.toString()
                  : c._id,
            })),
          );
          // Load transactions on initial load too
          setTransactions(
            txData.map((t: { _id: { toString(): string } | string }) => ({
              ...t,
              _id: t._id?.toString?.() ?? t._id,
            })),
          );
        }
      } catch {
        if (isMounted) {
          setError(
            "Failed to load data. Check your connection or MongoDB URI.",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error();
      const data: Transaction[] = await res.json();
      setTransactions(
        data.map((t) => ({ ...t, _id: t._id?.toString?.() ?? t._id })),
      );
    } catch {
      /* silently fail — transactions tab shows retry */
    } finally {
      setTxLoading(false);
    }
  }, []);

  const loadCheckIns = useCallback(async () => {
    setCheckInsLoading(true);
    try {
      const url = selectedCheckInEvent
        ? `/api/checkin?eventId=${selectedCheckInEvent}`
        : "/api/checkin";
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data: { checkIns?: CheckIn[] } = await res.json();
      setCheckIns(data.checkIns || []);
    } catch {
      /* silently fail — check-in panel still allows scanning */
    } finally {
      setCheckInsLoading(false);
    }
  }, [selectedCheckInEvent]);

  // Check if event is available for check-in (3h before to 10h after start time)
  const isEventAvailableForCheckIn = (event: Event): boolean => {
    const now = new Date();
    const eventDate = new Date(`${event.date}T${event.time || "00:00"}`);
    const threeHoursBefore = new Date(eventDate.getTime() - 3 * 60 * 60 * 1000);
    const tenHoursAfter = new Date(eventDate.getTime() + 10 * 60 * 60 * 1000);
    return now >= threeHoursBefore && now <= tenHoursAfter;
  };

  // Get available events for check-in (current and upcoming)
  const getAvailableCheckInEvents = (): Event[] => {
    const now = new Date();
    return events.filter((event) => {
      // Parse date string using local time components to avoid UTC interpretation
      const [year, month, day] = event.date.split("-").map(Number);
      const eventDate = new Date(year, month - 1, day);
      // Include events that are today or in the future
      return (
        eventDate >= new Date(now.getFullYear(), now.getMonth(), now.getDate())
      );
    });
  };

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      /* silently fail — users tab shows retry */
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "transactions") {
      const t = setTimeout(() => {
        loadTransactions();
      }, 0);
      return () => clearTimeout(t);
    }
    return;
  }, [tab, loadTransactions]);

  useEffect(() => {
    if (tab === "checkin") {
      const t = setTimeout(() => {
        loadCheckIns();
      }, 0);
      return () => clearTimeout(t);
    }
    return;
  }, [tab, loadCheckIns]);

  useEffect(() => {
    if (tab === "users") {
      const t = setTimeout(() => {
        loadUsers();
      }, 0);
      return () => clearTimeout(t);
    }
    return;
  }, [tab, loadUsers]);

  // Fetch current user permissions and role
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setCurrentUserRole(data.role || "user");
          setCurrentUserPermissions(data.permissions || []);
        } else {
          // API returned error - don't grant admin access
          console.error("Failed to fetch user info:", response.status);
          setCurrentUserRole("user");
          setCurrentUserPermissions([]);
        }
      } catch (error) {
        console.error("Failed to fetch user info:", error);
        // Default to no permissions on error
        setCurrentUserRole("user");
        setCurrentUserPermissions([]);
      } finally {
        setPermissionsLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [evRes, ttRes, cpRes, txRes] = await Promise.all([
        fetch("/api/events"),
        fetch("/api/ticket-tiers"),
        fetch("/api/coupons"),
        fetch("/api/orders"),
      ]);
      if (!evRes.ok || !ttRes.ok || !cpRes.ok || !txRes.ok)
        throw new Error("One or more requests failed");
      const [evData, ttData, cpData, txData] = await Promise.all([
        evRes.json(),
        ttRes.json(),
        cpRes.json(),
        txRes.json(),
      ]);
      // Normalize MongoDB _id
      setEvents(
        evData.map((e: { _id: { toString(): string } | string }) => ({
          ...e,
          _id:
            typeof e._id === "object" && e._id?.toString
              ? e._id.toString()
              : e._id,
        })),
      );
      setTicketTiers(
        ttData.map((t: { _id: { toString(): string } | string }) => ({
          ...t,
          _id:
            typeof t._id === "object" && t._id?.toString
              ? t._id.toString()
              : t._id,
        })),
      );
      setCoupons(
        cpData.map((c: { _id: { toString(): string } | string }) => ({
          ...c,
          _id:
            typeof c._id === "object" && c._id?.toString
              ? c._id.toString()
              : c._id,
        })),
      );
      // Set transactions for sales statistics
      setTransactions(
        txData.map((t: { _id: { toString(): string } | string }) => ({
          ...t,
          _id: t._id?.toString?.() ?? t._id,
        })),
      );
    } catch {
      setError("Failed to load data. Check your connection or MongoDB URI.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── CRUD: Events ──

  const saveEvent = async (data: EventPayload) => {
    setSaving(true);
    try {
      const { _id, ...body } = data;
      const res = _id
        ? await fetch(`/api/events/${_id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
      if (!res.ok) throw new Error(await res.text());
      await loadAll();
      setEventModal(null);
    } catch {
      alert("Failed to save event. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── CRUD: Ticket Tiers ──

  const saveTier = async (data: TierPayload) => {
    setSaving(true);
    try {
      const { _id, ...body } = data;
      const res = _id
        ? await fetch(`/api/ticket-tiers/${_id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/ticket-tiers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
      if (!res.ok) throw new Error(await res.text());
      await loadAll();
      setTierModal(null);
    } catch {
      alert("Failed to save ticket tier. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── CRUD: Coupons ──

  const saveCoupon = async (data: CouponPayload) => {
    setSaving(true);
    try {
      const { _id, ...body } = data;
      const res = _id
        ? await fetch(`/api/coupons/${_id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/coupons", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
      if (!res.ok) throw new Error(await res.text());
      await loadAll();
      setCouponModal(null);
    } catch {
      alert("Failed to save coupon. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleCoupon = async (id: string) => {
    try {
      const res = await fetch(`/api/coupons/${id}`, { method: "PATCH" });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setCoupons((prev) =>
        prev.map((c) =>
          c._id === id ? { ...updated, _id: updated._id.toString() } : c,
        ),
      );
    } catch {
      alert("Failed to toggle coupon.");
    }
  };

  // ── Delete ──

  const doDelete = async () => {
    if (!confirm) return;
    setDeleting(true);
    try {
      const endpoints: Record<DeleteConfirm["type"], string> = {
        event: `/api/events/${confirm._id}`,
        ticket: `/api/ticket-tiers/${confirm._id}`,
        coupon: `/api/coupons/${confirm._id}`,
      };
      const res = await fetch(endpoints[confirm.type], { method: "DELETE" });
      if (!res.ok) throw new Error();
      await loadAll();
      setConfirm(null);
    } catch {
      alert("Failed to delete. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  // ── Transaction Detail Functions ──

  const loadTransactionDetails = async (orderId: string) => {
    setTransactionLoading(true);
    try {
      console.log(`[Frontend] Fetching details for order: ${orderId}`);
      console.log(`[Frontend] Order ID type:`, typeof orderId);
      console.log(`[Frontend] Order ID length:`, orderId.length);
      const res = await fetch(`/api/orders/${orderId}`);
      console.log(`Response status: ${res.status}`);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("API Error:", errorData);
        throw Error(
          errorData.error ||
            `HTTP ${res.status}: Failed to fetch transaction details`,
        );
      }

      const orderData: DetailedOrder = await res.json();
      console.log("Order data received:", orderData);
      setTransactionModal(orderData);
    } catch (error) {
      console.error("Failed to load transaction details:", error);
      alert(
        `Failed to load transaction details: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setTransactionLoading(false);
    }
  };

  const resendTickets = async () => {
    if (!transactionModal) return;

    setResendingTickets(true);
    try {
      // Build attendees array with ticketIds
      let attendeeIndex = 0;
      const usedTicketIds = new Set<string>();
      const attendees = transactionModal.cart.flatMap((cartItem) =>
        Array.from({ length: cartItem.quantity }, () => {
          const attendee = transactionModal.attendees?.[attendeeIndex] || {};
          const ticketId =
            attendee.ticketId && !usedTicketIds.has(attendee.ticketId)
              ? attendee.ticketId
              : createClientTicketId(transactionModal.orderId, usedTicketIds);
          usedTicketIds.add(ticketId);
          attendeeIndex++;
          return {
            name: attendee.name || transactionModal.buyer.name,
            email: attendee.email || transactionModal.buyer.email,
            tierName: cartItem.tierName,
            ticketId,
            price: cartItem.price.toString(),
          };
        }),
      );

      console.log("Resending tickets with data:", {
        orderId: transactionModal.orderId,
        mailOption: transactionModal.mailOption,
        buyer: transactionModal.buyer,
        attendeesCount: attendees.length,
        attendees,
      });

      const res = await fetch("/api/send-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: transactionModal.orderId,
          mailOption: transactionModal.mailOption,
          buyer: transactionModal.buyer,
          event: {
            name: transactionModal.cart[0]?.eventName || "Event",
            date: "Jun 13, 2026",
            time: "4:00 PM",
            venue: "National Event Centre",
          },
          attendees,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Failed to resend tickets:", errorData);
        throw new Error(errorData.error || "Failed to resend tickets");
      }

      const result = await res.json();
      console.log("Resend tickets result:", result);

      showNotification(
        "success",
        "Tickets Sent",
        `Tickets have been resent successfully! (${result.sent} tickets sent)`,
      );
    } catch (error) {
      console.error("Failed to resend tickets:", error);
      showNotification(
        "error",
        "Failed to Send Tickets",
        `Failed to resend tickets. ${error instanceof Error ? error.message : "Please try again."}`,
      );
    } finally {
      setResendingTickets(false);
    }
  };

  const updateOrderStatus = async (newStatus: TransactionStatus) => {
    if (!transactionModal) return;

    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/orders/${transactionModal.orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      const result = await res.json();
      if (result.success) {
        // Update local state
        setTransactionModal({ ...transactionModal, status: newStatus });

        // Update transactions list
        setTransactions((prev) =>
          prev.map((tx) =>
            tx.orderId === transactionModal.orderId
              ? { ...tx, status: newStatus }
              : tx,
          ),
        );

        showNotification(
          "success",
          "Status Updated",
          `Order status updated to ${newStatus}!`,
        );
      }
    } catch (error) {
      console.error("Failed to update order status:", error);
      showNotification(
        "error",
        "Update Failed",
        "Failed to update order status. Please try again.",
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Helper function to show notifications
  const showNotification = (
    type: "success" | "error" | "info",
    title: string,
    message: string,
  ) => {
    setNotification({ type, title, message });
  };

  const saveUser = async () => {
    if (
      !userForm.username ||
      (!userForm.password && userModal?.type === "create")
    ) {
      showNotification(
        "error",
        "Validation Error",
        "Username and password are required",
      );
      return;
    }

    setSaving(true);
    try {
      const url =
        userModal?.type === "edit"
          ? `/api/users/${userModal.data?._id ?? ""}`
          : "/api/users";

      const method = userModal?.type === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save user");
      }

      const result = await res.json();

      if (result.success) {
        showNotification(
          "success",
          `User ${userModal?.type === "edit" ? "Updated" : "Created"}`,
          `User has been ${userModal?.type === "edit" ? "updated" : "created"} successfully`,
        );

        setUserModal(null);
        setUserForm({
          username: "",
          password: "",
          role: "user",
          permissions: [],
          isActive: true,
        });

        // Reload users list
        loadUsers();
      } else {
        throw new Error("Operation failed");
      }
    } catch (error) {
      console.error("Save user error:", error);
      showNotification(
        "error",
        "Save Failed",
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCheckIn = async (
    ticketId: string,
    scannedOrderId?: string,
    signature?: string,
    tier?: string,
  ) => {
    try {
      if (!selectedCheckInEvent) {
        throw new Error("Please select an event first");
      }

      const trimmedTicketId = ticketId.trim();
      const orderId =
        scannedOrderId?.trim() ||
        trimmedTicketId.split("-").slice(0, -1).join("-");

      if (!trimmedTicketId || !orderId) {
        throw new Error("Invalid ticket QR code");
      }

      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: trimmedTicketId,
          orderId,
          signature,
          tier,
          eventId: selectedCheckInEvent,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Check-in failed");
      }

      const result: { success?: boolean; checkIn?: CheckIn } = await res.json();

      if (result.success && result.checkIn) {
        setCheckIns((prev) => [result.checkIn as CheckIn, ...prev]);
        showNotification(
          "success",
          "Check-in Successful!",
          `Attendee: ${result.checkIn.attendeeName}\nEvent: ${result.checkIn.eventName}\nTier: ${result.checkIn.tierName}`,
        );
      } else {
        throw new Error("Check-in failed");
      }
    } catch (error) {
      console.error("Check-in error:", error);
      showNotification(
        "error",
        "Check-in Failed",
        error instanceof Error ? error.message : "Unknown error",
      );
      return false;
    }

    return true;
  };

  const handleScannerScan = async (detectedCodes: IDetectedBarcode[]) => {
    if (scannerPaused || detectedCodes.length === 0) return;

    const rawValue = detectedCodes[0]?.rawValue ?? "";
    const parsed = parseScannedTicket(rawValue);

    setScannerPaused(true);
    setLastScannedCode(rawValue);

    if (!parsed?.ticketId || !parsed.orderId) {
      setScannerStatus("That QR code does not look like a valid ticket.");
      showNotification(
        "error",
        "Invalid QR Code",
        "This QR code does not contain a valid ticket ID.",
      );
      return;
    }

    setScannerStatus(`Checking in ticket ${parsed.ticketId}...`);
    const checkedIn = await handleCheckIn(
      parsed.ticketId,
      parsed.orderId,
      parsed.signature,
      parsed.tier,
    );
    setScannerStatus(
      checkedIn
        ? "Check-in complete. Resume scanning for the next attendee."
        : "Check-in failed. Resume scanning or use manual entry.",
    );
  };

  const submitManualCheckIn = async () => {
    const parsed = parseScannedTicket(manualTicketInput);
    if (!parsed?.ticketId || !parsed.orderId) {
      showNotification(
        "error",
        "Invalid Ticket",
        "That value does not contain a valid ticket ID.",
      );
      return;
    }

    setLastScannedCode(manualTicketInput);
    setScannerStatus(`Checking in ticket ${parsed.ticketId}...`);
    setManualEntryOpen(false);
    setManualTicketInput("");

    const checkedIn = await handleCheckIn(
      parsed.ticketId,
      parsed.orderId,
      parsed.signature,
      parsed.tier,
    );
    setScannerStatus(
      checkedIn ? "Manual check-in complete." : "Manual check-in failed.",
    );
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete user");
      }

      showNotification(
        "success",
        "User Deleted",
        "User has been deleted successfully",
      );

      // Reload users list
      loadUsers();
    } catch (error) {
      console.error("Delete user error:", error);
      showNotification(
        "error",
        "Delete Failed",
        error instanceof Error ? error.message : "Failed to delete user",
      );
    }
  };

  // ── Nav ──

  // Permission checking helper - admins have full access
  const hasPermission = useCallback(
    (permission: string) => {
      // Admins (from admins collection) have full access
      if (currentUserRole === "admin") {
        return true;
      }
      // Regular users need explicit permissions
      return currentUserPermissions.includes(permission);
    },
    [currentUserRole, currentUserPermissions],
  );

  // Filter navigation items based on permissions
  const allowedNavItems = useMemo(
    () =>
      permissionsLoading
        ? []
        : NAV_ITEMS.filter((item) => {
            // Admins (from admins collection) see all tabs
            if (currentUserRole === "admin") {
              return true;
            }
            // Regular users only see tabs they have permission for
            if (item.id === "dashboard") return hasPermission("dashboard");
            if (item.id === "events") return hasPermission("events");
            if (item.id === "tickets") return hasPermission("tickets");
            if (item.id === "coupons") return hasPermission("coupons");
            if (item.id === "transactions")
              return hasPermission("transactions");
            if (item.id === "checkin") return hasPermission("checkin");
            if (item.id === "users") return hasPermission("users");
            return false;
          }),
    [permissionsLoading, currentUserRole, hasPermission],
  );

  useEffect(() => {
    if (permissionsLoading || allowedNavItems.length === 0) return;
    if (!allowedNavItems.some((item) => item.id === tab)) {
      const t = setTimeout(() => setTab(allowedNavItems[0].id), 0);
      return () => clearTimeout(t);
    }
    return;
  }, [permissionsLoading, allowedNavItems, tab]);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: C.bg,
        fontFamily: "'DM Sans', sans-serif",
        color: C.text,
      }}
    >
      <style>{FONT_CSS}</style>

      {/* Mobile overlay - closes sidebar on touch */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 40,
            display: "block",
          }}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        style={{
          width: 228,
          background: C.sidebar,
          borderRight: `1px solid ${C.cardBorder}`,
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          position: isMobile ? "fixed" : "sticky",
          left: isMobile ? (sidebarOpen ? 0 : -228) : "auto",
          top: 56,
          height: "calc(100vh - 56px)",
          zIndex: 50,
          transition: isMobile ? "left 0.3s ease" : "none",
        }}
      >
        <div
          style={{
            padding: "1.5rem 1.5rem 1.25rem",
            borderBottom: `1px solid ${C.cardBorder}`,
          }}
        >
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 17,
              fontWeight: 700,
              color: C.accent,
              letterSpacing: "0.04em",
            }}
          >
            BEPRAIZE SAX
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
            Event Ticketing
          </div>
        </div>
        <nav style={{ padding: "0.75rem 0.5rem", flex: 1 }}>
          {allowedNavItems.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <div
                key={id}
                onClick={() => setTab(id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 14px",
                  margin: "2px 0",
                  borderRadius: 9,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 500,
                  fontFamily: "'DM Sans', sans-serif",
                  color: active ? C.accent : "#7777a0",
                  background: active ? `${C.accent}15` : "transparent",
                  transition: "all 0.15s",
                }}
              >
                <Icon size={16} />
                {label}
              </div>
            );
          })}
        </nav>
        <div
          style={{
            padding: "1rem 1.5rem",
            borderTop: `1px solid ${C.cardBorder}`,
          }}
        >
          <div style={{ fontSize: 11, color: C.faint }}>
            v1.0.0 — Admin Panel
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main
        style={{
          flex: 1,
          padding: isMobile ? "1rem" : "2rem 2.5rem",
          overflowY: "auto",
        }}
      >
        {/* Mobile menu button - appears below header when sidebar is closed */}
        {isMobile && !sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: "100%",
              padding: "12px",
              marginBottom: "16px",
              background: C.card,
              border: `1px solid ${C.cardBorder}`,
              borderRadius: 8,
              color: C.text,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <Menu size={20} />
            <span>Menu</span>
          </button>
        )}
        {/* Error banner */}
        {error && (
          <div
            style={{
              background: C.dangerDim,
              border: `1px solid rgba(244,63,94,0.3)`,
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 13,
              color: C.danger,
            }}
          >
            <AlertTriangle size={15} />
            {error}
            <Btn
              variant="ghost"
              onClick={loadAll}
              style={{ marginLeft: "auto", fontSize: 12 }}
            >
              Retry
            </Btn>
          </div>
        )}

        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* DASHBOARD */}
            {tab === "dashboard" &&
              (currentUserRole === "admin" || hasPermission("dashboard")) && (
                <div>
                  <h1
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontSize: 28,
                      fontWeight: 700,
                      marginBottom: 4,
                    }}
                  >
                    Dashboard
                  </h1>
                  <p style={{ fontSize: 14, color: C.muted, marginBottom: 28 }}>
                    Live platform metrics from MongoDB
                  </p>

                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: C.muted,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 12,
                    }}
                  >
                    Live Stats
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 14,
                      marginBottom: 32,
                    }}
                  >
                    <StatCard
                      label="Total Events"
                      value={events.length}
                      icon={Calendar}
                      color={C.accent}
                      subtitle="All events in database"
                    />
                    <StatCard
                      label="Ticket Tiers"
                      value={ticketTiers.length}
                      icon={Ticket}
                      color={C.info}
                      subtitle="Across all events"
                    />
                    <StatCard
                      label="Active Coupons"
                      value={coupons.filter((c) => c.active).length}
                      icon={TrendingUp}
                      color={C.success}
                      subtitle="Available for use"
                    />
                  </div>

                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: C.muted,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 12,
                    }}
                  >
                    Overview
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 14,
                      marginBottom: 32,
                    }}
                  >
                    <StatCard
                      label="Total Coupons"
                      value={coupons.length}
                      icon={Tag}
                      color={C.warning}
                      subtitle="Active + inactive"
                    />
                    <StatCard
                      label="Inactive Coupons"
                      value={coupons.filter((c) => !c.active).length}
                      icon={XCircle}
                      color={C.muted}
                      subtitle="Invalidated coupons"
                    />
                    <StatCard
                      label="Avg. Tiers / Event"
                      value={
                        events.length
                          ? +(
                              events.reduce(
                                (a, e) => a + e.ticketTierIds.length,
                                0,
                              ) / events.length
                            ).toFixed(1)
                          : 0
                      }
                      icon={BarChart3}
                      color={C.info}
                      subtitle="Ticket tiers per event"
                    />
                  </div>

                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: C.muted,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 12,
                    }}
                  >
                    Sales
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 14,
                      marginBottom: 32,
                    }}
                  >
                    <StatCard
                      label="Total Orders"
                      value={transactions.length}
                      icon={ShoppingBag}
                      color={C.success}
                      subtitle="All-time orders"
                    />
                    <StatCard
                      label="Successful Sales"
                      value={
                        transactions.filter((t) => t.status === "success")
                          .length
                      }
                      icon={CheckCircle}
                      color={C.success}
                      subtitle="Completed payments"
                    />
                    <StatCard
                      label="Total Revenue"
                      value={`$${transactions
                        .filter((t) => t.status === "success")
                        .reduce((a, t) => a + (t.total ?? 0), 0)
                        .toFixed(2)}`}
                      icon={DollarSign}
                      color={C.accent}
                      subtitle="CAD from successful orders"
                    />
                  </div>

                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: C.muted,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 12,
                    }}
                  >
                    Upcoming Events
                  </p>
                  {events.length === 0 ? (
                    <div
                      style={{
                        background: C.card,
                        border: `1px solid ${C.cardBorder}`,
                        borderRadius: 12,
                        padding: "2rem",
                        textAlign: "center",
                        color: C.muted,
                        fontSize: 14,
                      }}
                    >
                      No events yet. Head to Events to create your first one.
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      {events.slice(0, 5).map((ev) => (
                        <div
                          key={ev._id}
                          style={{
                            background: C.card,
                            border: `1px solid ${C.cardBorder}`,
                            borderRadius: 12,
                            padding: "1rem 1.25rem",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 15 }}>
                              {ev.name}
                            </div>
                            <div
                              style={{
                                fontSize: 13,
                                color: C.muted,
                                marginTop: 3,
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <MapPin size={12} /> {ev.location}
                              {ev.address && <>&nbsp;·&nbsp;{ev.address}</>}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: C.faint,
                                marginTop: 2,
                              }}
                            >
                              {ev.date
                                ? (() => {
                                    const [year, month, day] =
                                      ev.date.split("-");
                                    const date = new Date(
                                      parseInt(year),
                                      parseInt(month) - 1,
                                      parseInt(day),
                                    );
                                    return date.toLocaleDateString("en-CA", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    });
                                  })()
                                : "No date"}
                              {ev.time && <>&nbsp;·&nbsp;{ev.time}</>}
                            </div>
                          </div>
                          <span style={{ fontSize: 12, color: C.muted }}>
                            {ev.ticketTierIds.length} tier
                            {ev.ticketTierIds.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            {/* EVENTS */}
            {tab === "events" &&
              (currentUserRole === "admin" || hasPermission("events")) && (
                <div>
                  <SectionHeader
                    title="Events"
                    sub={`${events.length} event${events.length !== 1 ? "s" : ""} in database`}
                    action={
                      <Btn onClick={() => setEventModal({ type: "create" })}>
                        <Plus size={16} />
                        New Event
                      </Btn>
                    }
                  />
                  <div
                    style={{
                      background: C.card,
                      border: `1px solid ${C.cardBorder}`,
                      borderRadius: 14,
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ overflowX: "auto" }}>
                      <table
                        style={{ width: "100%", borderCollapse: "collapse" }}
                      >
                        <thead>
                          <tr style={{ background: C.sidebar }}>
                            <th style={TABLE_HEAD}>Event</th>
                            <th style={TABLE_HEAD}>Venue & Address</th>
                            <th style={TABLE_HEAD}>Date & Time</th>
                            <th style={TABLE_HEAD}>Tiers</th>
                            <th style={TABLE_HEAD}>Coupons</th>
                            <th style={{ ...TABLE_HEAD, textAlign: "right" }}>
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {events.map((ev) => (
                            <tr key={ev._id}>
                              <td style={TABLE_CELL}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                  }}
                                >
                                  {ev.picture && (
                                    <img
                                      src={ev.picture}
                                      alt=""
                                      style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 6,
                                        objectFit: "cover",
                                        flexShrink: 0,
                                      }}
                                    />
                                  )}
                                  <div>
                                    <div style={{ fontWeight: 500 }}>
                                      {ev.name}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: 12,
                                        color: C.muted,
                                        marginTop: 2,
                                      }}
                                    >
                                      {ev.description.slice(0, 48)}
                                      {ev.description.length > 48 ? "…" : ""}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ ...TABLE_CELL, fontSize: 13 }}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 5,
                                    color: C.text,
                                    fontWeight: 500,
                                  }}
                                >
                                  <MapPin size={12} color={C.muted} />
                                  {ev.location}
                                </div>
                                {ev.address && (
                                  <div
                                    style={{
                                      fontSize: 12,
                                      color: C.muted,
                                      marginTop: 2,
                                      paddingLeft: 17,
                                    }}
                                  >
                                    {ev.address}
                                  </div>
                                )}
                              </td>
                              <td
                                style={{
                                  ...TABLE_CELL,
                                  color: C.muted,
                                  fontSize: 13,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <div>
                                  {ev.date
                                    ? (() => {
                                        const [year, month, day] =
                                          ev.date.split("-");
                                        const date = new Date(
                                          parseInt(year),
                                          parseInt(month) - 1,
                                          parseInt(day),
                                        );
                                        return date.toLocaleDateString(
                                          "en-CA",
                                          {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                          },
                                        );
                                      })()
                                    : "No date"}
                                </div>
                                {ev.time && (
                                  <div style={{ fontSize: 12, marginTop: 2 }}>
                                    {ev.time}
                                  </div>
                                )}
                              </td>
                              <td style={TABLE_CELL}>
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 4,
                                    flexWrap: "wrap",
                                  }}
                                >
                                  {ev.ticketTierIds.map((tid) => {
                                    const tt = ticketTiers.find(
                                      (t) => t._id === tid,
                                    );
                                    return tt ? (
                                      <span
                                        key={tid}
                                        style={{
                                          fontSize: 11,
                                          padding: "2px 8px",
                                          borderRadius: 12,
                                          background: C.infoDim,
                                          color: C.info,
                                        }}
                                      >
                                        {tt.name}
                                      </span>
                                    ) : null;
                                  })}
                                  {ev.ticketTierIds.length === 0 && (
                                    <span
                                      style={{ color: C.faint, fontSize: 13 }}
                                    >
                                      —
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td style={TABLE_CELL}>
                                {ev.coupons.length > 0 ? (
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: 4,
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    {ev.coupons.map((c) => (
                                      <span
                                        key={c}
                                        style={{
                                          fontSize: 11,
                                          padding: "2px 8px",
                                          borderRadius: 12,
                                          background: "rgba(16,185,129,0.1)",
                                          color: C.success,
                                        }}
                                      >
                                        {c}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span
                                    style={{ color: C.faint, fontSize: 13 }}
                                  >
                                    —
                                  </span>
                                )}
                              </td>
                              <td style={{ ...TABLE_CELL, textAlign: "right" }}>
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 8,
                                    justifyContent: "flex-end",
                                  }}
                                >
                                  <Btn
                                    variant="ghost"
                                    onClick={() =>
                                      setEventModal({ type: "edit", data: ev })
                                    }
                                  >
                                    <Pencil size={13} /> Edit
                                  </Btn>
                                  <Btn
                                    variant="danger"
                                    onClick={() =>
                                      setConfirm({
                                        type: "event",
                                        _id: ev._id,
                                        name: ev.name,
                                      })
                                    }
                                  >
                                    <Trash2 size={13} />
                                  </Btn>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {events.length === 0 && (
                            <tr>
                              <td
                                colSpan={6}
                                style={{
                                  ...TABLE_CELL,
                                  textAlign: "center",
                                  color: C.muted,
                                  padding: "2rem",
                                }}
                              >
                                No events yet. Create your first one!
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

            {/* TICKET TIERS */}
            {tab === "tickets" &&
              (currentUserRole === "admin" || hasPermission("tickets")) && (
                <div>
                  <SectionHeader
                    title="Ticket Tiers"
                    sub={`${ticketTiers.length} tier${ticketTiers.length !== 1 ? "s" : ""} configured`}
                    action={
                      <Btn
                        variant="primary"
                        onClick={() => setTierModal({ type: "create" })}
                      >
                        <Plus size={15} /> New Ticket Tier
                      </Btn>
                    }
                  />
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(260px, 1fr))",
                      gap: 14,
                    }}
                  >
                    {ticketTiers.map((tt) => (
                      <div
                        key={tt._id}
                        style={{
                          background: C.card,
                          border: `1px solid ${C.cardBorder}`,
                          borderRadius: 14,
                          padding: "1.25rem",
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontFamily: "'Syne', sans-serif",
                                fontSize: 16,
                                fontWeight: 600,
                              }}
                            >
                              {tt.name}
                            </div>
                            <div
                              style={{
                                fontSize: 13,
                                color: C.muted,
                                marginTop: 4,
                              }}
                            >
                              {tt.description}
                            </div>
                          </div>
                          <div style={{ flexShrink: 0, textAlign: "right" }}>
                            <div
                              style={{
                                fontFamily: "'Syne', sans-serif",
                                fontSize: 22,
                                fontWeight: 700,
                                color: C.accent,
                              }}
                            >
                              ${tt.price.toFixed(2)}
                            </div>
                            <div style={{ fontSize: 11, color: C.muted }}>
                              CAD
                            </div>
                          </div>
                        </div>
                        <div style={{ height: 1, background: C.cardBorder }} />
                        <div style={{ display: "flex", gap: 8 }}>
                          <Btn
                            variant="ghost"
                            onClick={() =>
                              setTierModal({ type: "edit", data: tt })
                            }
                            style={{ flex: 1, justifyContent: "center" }}
                          >
                            <Pencil size={13} /> Edit
                          </Btn>
                          <Btn
                            variant="danger"
                            onClick={() =>
                              setConfirm({
                                type: "ticket",
                                _id: tt._id,
                                name: tt.name,
                              })
                            }
                          >
                            <Trash2 size={13} />
                          </Btn>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => setTierModal({ type: "create" })}
                      style={{
                        background: "transparent",
                        border: `2px dashed ${C.faint}`,
                        borderRadius: 14,
                        padding: "1.25rem",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        color: C.muted,
                        minHeight: 130,
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: C.accentDim,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Plus size={18} color={C.accent} />
                      </div>
                      <span
                        style={{
                          fontSize: 13,
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        Add Ticket Tier
                      </span>
                    </button>
                  </div>
                </div>
              )}

            {/* COUPONS */}
            {tab === "coupons" &&
              (currentUserRole === "admin" || hasPermission("coupons")) && (
                <div>
                  <SectionHeader
                    title="Coupons"
                    sub={`${coupons.filter((c) => c.active).length} active · ${coupons.filter((c) => !c.active).length} inactive`}
                    action={
                      <Btn
                        variant="primary"
                        onClick={() => setCouponModal({ type: "create" })}
                      >
                        <Plus size={15} /> New Coupon
                      </Btn>
                    }
                  />
                  <div
                    style={{
                      background: C.card,
                      border: `1px solid ${C.cardBorder}`,
                      borderRadius: 14,
                      overflow: "hidden",
                    }}
                  >
                    <table
                      style={{ width: "100%", borderCollapse: "collapse" }}
                    >
                      <thead>
                        <tr style={{ background: C.sidebar }}>
                          <th style={TABLE_HEAD}>Code</th>
                          <th style={TABLE_HEAD}>Discount</th>
                          <th style={TABLE_HEAD}>Status</th>
                          <th style={{ ...TABLE_HEAD, textAlign: "right" }}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {coupons.map((cp) => (
                          <tr key={cp._id}>
                            <td style={TABLE_CELL}>
                              <code
                                style={{
                                  fontFamily: "monospace",
                                  fontSize: 14,
                                  background: C.sidebar,
                                  padding: "4px 10px",
                                  borderRadius: 6,
                                  letterSpacing: "0.08em",
                                  color: cp.active ? C.text : C.muted,
                                }}
                              >
                                {cp.name}
                              </code>
                            </td>
                            <td style={TABLE_CELL}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                <div
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 7,
                                    background: C.accentDim,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Percent size={13} color={C.accent} />
                                </div>
                                <span
                                  style={{
                                    fontFamily: "'Syne', sans-serif",
                                    fontWeight: 600,
                                    fontSize: 15,
                                  }}
                                >
                                  {cp.percentage}%
                                </span>
                                <span style={{ fontSize: 12, color: C.muted }}>
                                  off
                                </span>
                              </div>
                            </td>
                            <td style={TABLE_CELL}>
                              <Badge active={cp.active} />
                            </td>
                            <td style={{ ...TABLE_CELL, textAlign: "right" }}>
                              <div
                                style={{
                                  display: "flex",
                                  gap: 8,
                                  justifyContent: "flex-end",
                                }}
                              >
                                <Btn
                                  variant={cp.active ? "warning" : "secondary"}
                                  onClick={() => toggleCoupon(cp._id)}
                                >
                                  {cp.active ? (
                                    <>
                                      <XCircle size={13} /> Invalidate
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle size={13} /> Activate
                                    </>
                                  )}
                                </Btn>
                                <Btn
                                  variant="ghost"
                                  onClick={() =>
                                    setCouponModal({ type: "edit", data: cp })
                                  }
                                >
                                  <Pencil size={13} /> Edit
                                </Btn>
                                <Btn
                                  variant="danger"
                                  onClick={() =>
                                    setConfirm({
                                      type: "coupon",
                                      _id: cp._id,
                                      name: cp.name,
                                    })
                                  }
                                >
                                  <Trash2 size={13} />
                                </Btn>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {coupons.length === 0 && (
                          <tr>
                            <td
                              colSpan={4}
                              style={{
                                ...TABLE_CELL,
                                textAlign: "center",
                                color: C.muted,
                                padding: "2rem",
                              }}
                            >
                              No coupons yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            {/* TRANSACTIONS */}
            {tab === "transactions" &&
              (currentUserRole === "admin" ||
                hasPermission("transactions")) && (
                <div>
                  <SectionHeader
                    title="Transactions"
                    sub={`${transactions.length} order${transactions.length !== 1 ? "s" : ""} · ${transactions.filter((t) => t.status === "success").length} successful`}
                    action={
                      <Btn
                        variant="ghost"
                        onClick={loadTransactions}
                        disabled={txLoading}
                      >
                        <RefreshCw
                          size={13}
                          className={txLoading ? "spin" : ""}
                        />
                        {txLoading ? "Loading…" : "Refresh"}
                      </Btn>
                    }
                  />

                  {txLoading ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          style={{
                            height: 52,
                            background: C.card,
                            border: `1px solid ${C.cardBorder}`,
                            borderRadius: 10,
                            opacity: 0.5,
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        background: C.card,
                        border: `1px solid ${C.cardBorder}`,
                        borderRadius: 14,
                        overflow: "hidden",
                      }}
                    >
                      <div style={{ overflowX: "auto" }}>
                        <table
                          style={{ width: "100%", borderCollapse: "collapse" }}
                        >
                          <thead>
                            <tr style={{ background: C.sidebar }}>
                              <th style={TABLE_HEAD}>Buyer</th>
                              <th style={TABLE_HEAD}>Email</th>
                              <th style={TABLE_HEAD}>Order #</th>
                              <th style={TABLE_HEAD}>Event</th>
                              <th style={TABLE_HEAD}>Amount</th>
                              <th style={TABLE_HEAD}>Date</th>
                              <th
                                style={{ ...TABLE_HEAD, textAlign: "center" }}
                              >
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {transactions.map((tx) => {
                              const statusConfig: Record<
                                TransactionStatus,
                                {
                                  label: string;
                                  dot: string;
                                  bg: string;
                                  text: string;
                                }
                              > = {
                                success: {
                                  label: "Success",
                                  dot: C.success,
                                  bg: "rgba(16,185,129,0.1)",
                                  text: C.success,
                                },
                                failed: {
                                  label: "Failed",
                                  dot: C.danger,
                                  bg: "rgba(244,63,94,0.1)",
                                  text: C.danger,
                                },
                                pending: {
                                  label: "Pending",
                                  dot: "#f59e0b",
                                  bg: "rgba(245,158,11,0.1)",
                                  text: "#f59e0b",
                                },
                                refunded: {
                                  label: "Refunded",
                                  dot: C.muted,
                                  bg: "rgba(119,119,160,0.1)",
                                  text: C.muted,
                                },
                              };
                              const s =
                                statusConfig[tx.status] ?? statusConfig.pending;
                              return (
                                <tr
                                  key={tx._id}
                                  onClick={() =>
                                    loadTransactionDetails(tx.orderId)
                                  }
                                  style={{
                                    cursor: "pointer",
                                    transition: "background 0.15s",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background =
                                      C.sidebar;
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background =
                                      "transparent";
                                  }}
                                >
                                  <td
                                    style={{ ...TABLE_CELL, fontWeight: 500 }}
                                  >
                                    {tx.buyerName || "—"}
                                  </td>
                                  <td
                                    style={{
                                      ...TABLE_CELL,
                                      color: C.muted,
                                      fontSize: 13,
                                    }}
                                  >
                                    {tx.buyerEmail || "—"}
                                  </td>
                                  <td style={TABLE_CELL}>
                                    <code
                                      style={{
                                        fontFamily: "monospace",
                                        fontSize: 12,
                                        background: C.sidebar,
                                        padding: "3px 8px",
                                        borderRadius: 5,
                                        color: C.text,
                                        letterSpacing: "0.04em",
                                      }}
                                    >
                                      {tx.orderId}
                                    </code>
                                  </td>
                                  <td
                                    style={{
                                      ...TABLE_CELL,
                                      fontSize: 13,
                                      color: C.muted,
                                      maxWidth: 160,
                                    }}
                                  >
                                    <div
                                      style={{
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {tx.eventName || "—"}
                                    </div>
                                  </td>
                                  <td
                                    style={{
                                      ...TABLE_CELL,
                                      fontFamily: "'Syne', sans-serif",
                                      fontSize: 15,
                                      color: C.text,
                                    }}
                                  >
                                    {tx.total != null
                                      ? `$${Number(tx.total).toFixed(2)}`
                                      : "—"}
                                  </td>
                                  <td
                                    style={{
                                      ...TABLE_CELL,
                                      fontSize: 12,
                                      color: C.muted,
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {tx.createdAt
                                      ? new Date(
                                          tx.createdAt,
                                        ).toLocaleDateString("en-CA", {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                        })
                                      : "—"}
                                  </td>
                                  <td
                                    style={{
                                      ...TABLE_CELL,
                                      textAlign: "center",
                                    }}
                                  >
                                    <span
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 6,
                                        padding: "4px 12px",
                                        borderRadius: 20,
                                        fontSize: 11,
                                        fontWeight: 600,
                                        background: s.bg,
                                        color: s.text,
                                      }}
                                    >
                                      <span
                                        style={{
                                          width: 6,
                                          height: 6,
                                          borderRadius: "50%",
                                          background: s.dot,
                                          display: "inline-block",
                                          flexShrink: 0,
                                        }}
                                      />
                                      {s.label}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                            {transactions.length === 0 && (
                              <tr>
                                <td
                                  colSpan={7}
                                  style={{
                                    ...TABLE_CELL,
                                    textAlign: "center",
                                    color: C.muted,
                                    padding: "3rem",
                                  }}
                                >
                                  No transactions yet. Orders will appear here
                                  after checkout.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

            {/* CHECK-IN */}
            {tab === "checkin" &&
              (currentUserRole === "admin" || hasPermission("checkin")) && (
                <div>
                  {!selectedCheckInEvent ? (
                    <>
                      <SectionHeader
                        title="Event Check-in"
                        sub="Select an event to start checking in attendees"
                      />

                      <div
                        style={{
                          maxWidth: "800px",
                        }}
                      >
                        <div
                          style={{
                            background: C.card,
                            border: `1px solid ${C.cardBorder}`,
                            borderRadius: "14px",
                            padding: "2rem",
                          }}
                        >
                          <h3
                            style={{
                              margin: 0,
                              fontSize: "1.1rem",
                              fontWeight: 600,
                              color: C.text,
                              marginBottom: "1.5rem",
                            }}
                          >
                            Select Event
                          </h3>

                          {getAvailableCheckInEvents().length === 0 ? (
                            <div
                              style={{
                                color: C.muted,
                                fontSize: 14,
                                padding: "2rem",
                                textAlign: "center",
                                background: C.sidebar,
                                borderRadius: 8,
                              }}
                            >
                              No current or upcoming events available for
                              check-in.
                            </div>
                          ) : (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "1rem",
                              }}
                            >
                              {getAvailableCheckInEvents().map((event) => {
                                const isAvailable =
                                  isEventAvailableForCheckIn(event);
                                return (
                                  <div
                                    key={event._id}
                                    onClick={() =>
                                      isAvailable &&
                                      setSelectedCheckInEvent(event._id)
                                    }
                                    style={{
                                      background: C.sidebar,
                                      border: `1px solid ${C.cardBorder}`,
                                      borderRadius: 10,
                                      padding: "1.25rem",
                                      cursor: isAvailable
                                        ? "pointer"
                                        : "not-allowed",
                                      opacity: isAvailable ? 1 : 0.5,
                                      transition: "all 0.15s",
                                    }}
                                    onMouseEnter={(e) => {
                                      if (isAvailable) {
                                        e.currentTarget.style.borderColor =
                                          C.accent;
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.borderColor =
                                        C.cardBorder;
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                      }}
                                    >
                                      <div>
                                        <div
                                          style={{
                                            fontSize: 16,
                                            fontWeight: 600,
                                            color: C.text,
                                            marginBottom: 4,
                                          }}
                                        >
                                          {event.name}
                                        </div>
                                        <div
                                          style={{
                                            fontSize: 13,
                                            color: C.muted,
                                            marginBottom: 8,
                                          }}
                                        >
                                          {event.location}
                                        </div>
                                        <div
                                          style={{
                                            fontSize: 12,
                                            color: "#777",
                                          }}
                                        >
                                          {event.date} at {event.time || "TBD"}
                                        </div>
                                      </div>
                                      <div
                                        style={{
                                          fontSize: 11,
                                          fontWeight: 600,
                                          padding: "4px 10px",
                                          borderRadius: "999px",
                                          background: isAvailable
                                            ? `${C.accent}20`
                                            : "#333",
                                          color: isAvailable
                                            ? C.accent
                                            : "#666",
                                        }}
                                      >
                                        {isAvailable ? "Open" : "Closed"}
                                      </div>
                                    </div>
                                    {!isAvailable && (
                                      <div
                                        style={{
                                          fontSize: 11,
                                          color: C.muted,
                                          marginTop: 8,
                                        }}
                                      >
                                        Check-in opens 3 hours before event
                                        start
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <SectionHeader
                        title="Event Check-in"
                        sub="Scan QR codes or enter ticket IDs to check in attendees"
                      />

                      <div
                        style={{
                          marginBottom: "1.5rem",
                        }}
                      >
                        <button
                          onClick={() => setSelectedCheckInEvent(null)}
                          style={{
                            background: "transparent",
                            border: `1px solid ${C.cardBorder}`,
                            borderRadius: 8,
                            padding: "8px 16px",
                            color: C.muted,
                            fontSize: 13,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          ← Back to Event Selection
                        </button>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                          gap: "2rem",
                          maxWidth: "1200px",
                        }}
                      >
                        {/* QR Scanner Section */}
                        <div
                          style={{
                            background: C.card,
                            border: `1px solid ${C.cardBorder}`,
                            borderRadius: "14px",
                            padding: "2rem",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "1.5rem",
                          }}
                        >
                          <h3
                            style={{
                              margin: 0,
                              fontSize: "1.2rem",
                              fontWeight: 600,
                              color: C.text,
                            }}
                          >
                            QR Code Scanner
                          </h3>

                          <div
                            style={{
                              position: "relative",
                              width: "300px",
                              height: "300px",
                              background: C.bg,
                              border: `1px solid ${C.cardBorder}`,
                              borderRadius: "12px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              overflow: "hidden",
                            }}
                          >
                            {scannerActive ? (
                              <>
                                <Scanner
                                  onScan={handleScannerScan}
                                  onError={(scannerError) => {
                                    const message =
                                      scannerError instanceof Error
                                        ? scannerError.message
                                        : "Unable to access the camera.";
                                    setScannerStatus(message);
                                  }}
                                  paused={scannerPaused}
                                  formats={["qr_code"]}
                                  scanDelay={800}
                                  allowMultiple
                                  sound
                                  constraints={{
                                    facingMode: "environment",
                                    aspectRatio: 1,
                                  }}
                                  components={{
                                    finder: true,
                                    torch: true,
                                  }}
                                  styles={{
                                    container: {
                                      width: "100%",
                                      height: "100%",
                                      aspectRatio: "1 / 1",
                                    },
                                    video: {
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                    },
                                  }}
                                />
                                {scannerPaused && (
                                  <div
                                    style={{
                                      position: "absolute",
                                      inset: 0,
                                      background: "rgba(9,9,15,0.72)",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      textAlign: "center",
                                      padding: 24,
                                      color: C.text,
                                      fontWeight: 600,
                                    }}
                                  >
                                    Scanner paused
                                  </div>
                                )}
                              </>
                            ) : (
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  gap: 12,
                                  color: C.muted,
                                  textAlign: "center",
                                  padding: 24,
                                }}
                              >
                                <QrCode size={64} color={C.faint} />
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: "0.875rem",
                                    color: C.muted,
                                  }}
                                >
                                  Camera scanner is ready
                                </p>
                              </div>
                            )}
                          </div>

                          <p
                            style={{
                              margin: 0,
                              minHeight: 36,
                              color: C.muted,
                              textAlign: "center",
                              fontSize: "0.875rem",
                              lineHeight: 1.45,
                            }}
                          >
                            {scannerStatus}
                          </p>

                          {lastScannedCode && (
                            <div
                              style={{
                                width: "100%",
                                padding: "10px 12px",
                                background: C.bg,
                                border: `1px solid ${C.cardBorder}`,
                                borderRadius: 8,
                                color: C.muted,
                                fontSize: 12,
                                overflowWrap: "anywhere",
                              }}
                            >
                              Last scan: {lastScannedCode}
                            </div>
                          )}

                          <div
                            style={{
                              display: "flex",
                              gap: "1rem",
                              width: "100%",
                              flexWrap: "wrap",
                            }}
                          >
                            <Btn
                              onClick={() => {
                                if (!scannerActive) {
                                  setScannerActive(true);
                                  setScannerPaused(false);
                                  setScannerStatus(
                                    "Point the camera at a ticket QR code.",
                                  );
                                  return;
                                }

                                if (scannerPaused) {
                                  setScannerPaused(false);
                                  setScannerStatus(
                                    "Point the camera at a ticket QR code.",
                                  );
                                  return;
                                }

                                setScannerPaused(true);
                                setScannerStatus("Scanner paused.");
                              }}
                              style={{ flex: 1, justifyContent: "center" }}
                            >
                              <QrCode size={14} />
                              {!scannerActive
                                ? "Start Scanning"
                                : scannerPaused
                                  ? "Resume Scanning"
                                  : "Pause Scanning"}
                            </Btn>
                            <Btn
                              variant="secondary"
                              onClick={() => {
                                setScannerActive(false);
                                setScannerPaused(false);
                                setScannerStatus(
                                  "Camera is off. Start scanning when you are ready.",
                                );
                              }}
                            >
                              Stop
                            </Btn>
                            <Btn
                              variant="secondary"
                              onClick={() => {
                                setManualTicketInput("");
                                setManualEntryOpen(true);
                              }}
                            >
                              Manual Entry
                            </Btn>
                          </div>
                        </div>

                        <div
                          style={{
                            background: C.card,
                            border: `1px solid ${C.cardBorder}`,
                            borderRadius: "14px",
                            padding: "2rem",
                          }}
                        >
                          <h3
                            style={{
                              margin: 0,
                              fontSize: "1.2rem",
                              fontWeight: 600,
                              color: C.text,
                              marginBottom: "1.5rem",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            Recent Check-ins
                            {!checkInsLoading && (
                              <span
                                style={{
                                  color: "#fff",
                                  fontSize: "0.95rem",
                                  fontWeight: 600,
                                  padding: "0.2rem 0.6rem",
                                  borderRadius: "999px",
                                  minWidth: "1.8rem",
                                  textAlign: "center",
                                }}
                              >
                                {checkIns.length}
                              </span>
                            )}
                          </h3>

                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "1rem",
                            }}
                          >
                            {checkInsLoading && (
                              <div style={{ color: C.muted, fontSize: 14 }}>
                                Loading check-ins...
                              </div>
                            )}
                            {!checkInsLoading && checkIns.length === 0 && (
                              <div
                                style={{
                                  color: C.muted,
                                  fontSize: 14,
                                  padding: "1rem",
                                  background: C.sidebar,
                                  borderRadius: "8px",
                                  border: `1px solid ${C.cardBorder}`,
                                }}
                              >
                                No check-ins yet today.
                              </div>
                            )}
                            {checkIns.map((checkin) => (
                              <div
                                key={`${checkin.ticketId}-${checkin.checkInTime}`}
                                style={{
                                  padding: "1rem",
                                  background: C.sidebar,
                                  borderRadius: "8px",
                                  border: `1px solid ${C.cardBorder}`,
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <div>
                                  <div
                                    style={{
                                      fontWeight: 600,
                                      color: C.text,
                                      marginBottom: "0.25rem",
                                    }}
                                  >
                                    {checkin.attendeeName}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "0.875rem",
                                      color: C.muted,
                                    }}
                                  >
                                    {checkin.ticketId} • {checkin.tierName}
                                  </div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                  <div
                                    style={{
                                      fontSize: "0.875rem",
                                      color: C.muted,
                                    }}
                                  >
                                    {new Date(
                                      checkin.checkInTime,
                                    ).toLocaleTimeString("en-CA", {
                                      hour: "numeric",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                  <Badge active={true} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

            {/* USERS */}
            {tab === "users" &&
              (currentUserRole === "admin" || hasPermission("users")) && (
                <div>
                  <SectionHeader
                    title="User Management"
                    sub={`${users.length} user${users.length !== 1 ? "s" : ""} in system`}
                    action={
                      <Btn
                        onClick={() => {
                          setUserModal({ type: "create" });
                          setUserForm({
                            username: "",
                            password: "",
                            role: "user",
                            permissions: [],
                            isActive: true,
                          });
                        }}
                      >
                        <Plus size={16} />
                        Add User
                      </Btn>
                    }
                  />

                  {usersLoading ? (
                    <LoadingSkeleton />
                  ) : users.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "4rem 2rem",
                        color: C.muted,
                      }}
                    >
                      <Users
                        size={48}
                        style={{ margin: "0 auto 1rem", opacity: 0.3 }}
                      />
                      <div
                        style={{
                          fontSize: "1.1rem",
                          fontWeight: 600,
                          marginBottom: "0.5rem",
                        }}
                      >
                        No users yet
                      </div>
                      <div style={{ fontSize: "0.875rem" }}>
                        Create your first user to get started
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        background: C.card,
                        border: `1px solid ${C.cardBorder}`,
                        borderRadius: "14px",
                        overflow: "hidden",
                      }}
                    >
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                        }}
                      >
                        <thead>
                          <tr style={{ background: C.sidebar }}>
                            <th style={TABLE_HEAD}>User</th>
                            <th style={TABLE_HEAD}>Permissions</th>
                            <th style={TABLE_HEAD}>Status</th>
                            <th style={TABLE_HEAD}>Last Login</th>
                            <th style={TABLE_HEAD}>Created</th>
                            <th style={TABLE_HEAD}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => (
                            <tr key={user._id}>
                              <td
                                style={{
                                  padding: "1rem",
                                  borderBottom: `1px solid ${C.cardBorder}`,
                                }}
                              >
                                <div>
                                  <div
                                    style={{
                                      fontWeight: 600,
                                      marginBottom: "0.25rem",
                                    }}
                                  >
                                    {user.username}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "0.875rem",
                                      color: C.muted,
                                    }}
                                  >
                                    {user.email}
                                  </div>
                                </div>
                              </td>
                              <td
                                style={{
                                  padding: "1rem",
                                  borderBottom: `1px solid ${C.cardBorder}`,
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "0.25rem",
                                  }}
                                >
                                  {user.permissions?.length > 0 ? (
                                    user.permissions.map((perm: string) => (
                                      <span
                                        key={perm}
                                        style={{
                                          padding: "0.25rem 0.5rem",
                                          borderRadius: "6px",
                                          fontSize: "0.75rem",
                                          background: C.accent,
                                          color: "white",
                                        }}
                                      >
                                        {perm}
                                      </span>
                                    ))
                                  ) : (
                                    <span
                                      style={{
                                        color: C.muted,
                                        fontSize: "0.875rem",
                                      }}
                                    >
                                      No permissions
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td
                                style={{
                                  padding: "1rem",
                                  borderBottom: `1px solid ${C.cardBorder}`,
                                }}
                              >
                                <span
                                  style={{
                                    padding: "0.25rem 0.75rem",
                                    borderRadius: "12px",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    background: user.isActive
                                      ? "#10b981"
                                      : "#ef4444",
                                    color: "white",
                                  }}
                                >
                                  {user.isActive ? "Active" : "Inactive"}
                                </span>
                              </td>
                              <td
                                style={{
                                  padding: "1rem",
                                  borderBottom: `1px solid ${C.cardBorder}`,
                                  fontSize: "0.875rem",
                                  color: C.muted,
                                }}
                              >
                                {user.lastLogin
                                  ? new Date(user.lastLogin).toLocaleString()
                                  : "Never"}
                              </td>
                              <td
                                style={{
                                  padding: "1rem",
                                  borderBottom: `1px solid ${C.cardBorder}`,
                                  fontSize: "0.875rem",
                                  color: C.muted,
                                }}
                              >
                                {new Date(user.createdAt).toLocaleDateString()}
                              </td>
                              <td
                                style={{
                                  padding: "1rem",
                                  borderBottom: `1px solid ${C.cardBorder}`,
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "0.5rem",
                                  }}
                                >
                                  <Btn
                                    onClick={() => {
                                      setUserModal({
                                        type: "edit",
                                        data: user,
                                      });
                                      setUserForm({
                                        username: user.username,
                                        password: "", // Don't populate password for security
                                        role: "user",
                                        permissions: user.permissions || [],
                                        isActive: user.isActive,
                                      });
                                    }}
                                    style={{
                                      padding: "0.5rem",
                                      background: `${C.accent}15`,
                                      color: C.accent,
                                      border: `1px solid ${C.accent}30`,
                                    }}
                                  >
                                    <Edit size={14} />
                                  </Btn>
                                  <Btn
                                    onClick={() => {
                                      setDeleteConfirm({
                                        userId: user._id,
                                        username: user.username,
                                      });
                                    }}
                                    style={{
                                      padding: "0.5rem",
                                      background: "#ef444415",
                                      color: "#ef4444",
                                      border: "1px solid #ef444430",
                                    }}
                                  >
                                    <Trash2 size={14} />
                                  </Btn>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

            {/* Fallback UI when current tab is not allowed */}
            {!permissionsLoading &&
              !allowedNavItems.find((item) => item.id === tab) && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "4rem 2rem",
                    textAlign: "center",
                  }}
                >
                  <AlertTriangle
                    size={48}
                    style={{ color: C.muted, marginBottom: "1.5rem" }}
                  />
                  <h2
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontSize: 24,
                      fontWeight: 700,
                      marginBottom: "0.75rem",
                      color: C.text,
                    }}
                  >
                    Access Restricted
                  </h2>
                  <p
                    style={{
                      fontSize: 15,
                      color: C.muted,
                      marginBottom: "2rem",
                      maxWidth: 400,
                    }}
                  >
                    You don&#39;t have permission to view this tab. Please
                    contact an administrator if you believe this is an error.
                  </p>
                  {allowedNavItems.length > 0 && (
                    <Btn
                      onClick={() => setTab(allowedNavItems[0].id)}
                      style={{
                        padding: "0.75rem 1.5rem",
                        background: C.accent,
                        color: "white",
                        border: "none",
                      }}
                    >
                      Go to {allowedNavItems[0].label}
                    </Btn>
                  )}
                </div>
              )}
          </>
        )}
      </main>

      {/* ── Modals ── */}
      {eventModal && (
        <Modal
          title={
            eventModal.type === "create" ? "Create New Event" : "Edit Event"
          }
          onClose={() => !saving && setEventModal(null)}
          wide
        >
          <EventForm
            initial={eventModal.data}
            ticketTiers={ticketTiers}
            coupons={coupons}
            onSave={saveEvent}
            onClose={() => setEventModal(null)}
            saving={saving}
          />
        </Modal>
      )}
      {tierModal && (
        <Modal
          title={
            tierModal.type === "create"
              ? "Create Ticket Tier"
              : "Edit Ticket Tier"
          }
          onClose={() => !saving && setTierModal(null)}
        >
          <TierForm
            initial={tierModal.data}
            onSave={saveTier}
            onClose={() => setTierModal(null)}
            saving={saving}
          />
        </Modal>
      )}
      {couponModal && (
        <Modal
          title={
            couponModal.type === "create" ? "Create Coupon" : "Edit Coupon"
          }
          onClose={() => !saving && setCouponModal(null)}
        >
          <CouponForm
            initial={couponModal.data}
            onSave={saveCoupon}
            onClose={() => setCouponModal(null)}
            saving={saving}
          />
        </Modal>
      )}
      {confirm && (
        <ConfirmModal
          message={`Are you sure you want to delete "${confirm.name}"? This cannot be undone.`}
          onConfirm={doDelete}
          onCancel={() => !deleting && setConfirm(null)}
          loading={deleting}
        />
      )}

      {/* Transaction Detail Modal */}
      {transactionModal && (
        <Modal
          title={`Order Details - ${transactionModal.orderId}`}
          onClose={() => setTransactionModal(null)}
          wide
        >
          {transactionLoading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "3rem",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <Loader2 className="spin" size={24} />
              <span style={{ color: C.muted }}>
                Loading transaction details...
              </span>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {/* Buyer Information */}
              <div>
                <ModalSectionTitle>Buyer Information</ModalSectionTitle>
                <ModalInfoPanel>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(160px, 1fr))",
                      gap: 14,
                    }}
                  >
                    <DetailItem label="Name">
                      {transactionModal.buyer.name}
                    </DetailItem>
                    <DetailItem label="Email">
                      {transactionModal.buyer.email}
                    </DetailItem>
                    {transactionModal.buyer.phone && (
                      <DetailItem label="Phone">
                        {transactionModal.buyer.phone}
                      </DetailItem>
                    )}
                  </div>
                </ModalInfoPanel>
              </div>

              {/* Order Summary */}
              <div>
                <ModalSectionTitle>Order Summary</ModalSectionTitle>
                <ModalInfoPanel>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(140px, 1fr))",
                      gap: 14,
                    }}
                  >
                    <DetailItem label="Status">
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "3px 10px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                          background:
                            transactionModal.status === "success"
                              ? C.successDim
                              : transactionModal.status === "refunded"
                                ? "rgba(119,119,160,0.12)"
                                : transactionModal.status === "failed"
                                  ? C.dangerDim
                                  : C.accentDim,
                          color:
                            transactionModal.status === "success"
                              ? C.success
                              : transactionModal.status === "refunded"
                                ? C.muted
                                : transactionModal.status === "failed"
                                  ? C.danger
                                  : C.accent,
                        }}
                      >
                        {transactionModal.status.toUpperCase()}
                      </span>
                    </DetailItem>
                    <DetailItem label="Total Amount" accent>
                      ${transactionModal.total.toFixed(2)}
                    </DetailItem>
                    <DetailItem label="Payment Method">
                      {transactionModal.paymentMethod}
                    </DetailItem>
                    <DetailItem label="Mail Option">
                      {transactionModal.mailOption}
                    </DetailItem>
                  </div>
                </ModalInfoPanel>
              </div>

              {/* Ticket Tiers */}
              <div>
                <ModalSectionTitle>Ticket Tiers Purchased</ModalSectionTitle>
                <ModalInfoPanel>
                  {transactionModal.cart.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        padding: index === 0 ? "0 0 12px" : "12px 0",
                        borderBottom:
                          index < transactionModal.cart.length - 1
                            ? `1px solid ${C.cardBorder}`
                            : "none",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 16,
                        }}
                      >
                        <div>
                          <div
                            style={{ fontWeight: 600, marginBottom: "0.25rem" }}
                          >
                            {item.eventName || "Unknown Event"}
                          </div>
                          <div style={{ fontSize: "0.875rem", color: C.muted }}>
                            {item.tierName || "Standard"} • {item.quantity || 1}{" "}
                            ticket{(item.quantity || 1) > 1 ? "s" : ""}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 600 }}>
                            $
                            {((item.price || 0) * (item.quantity || 1)).toFixed(
                              2,
                            )}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: C.muted }}>
                            ${(item.price || 0).toFixed(2)} each
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </ModalInfoPanel>
              </div>

              {/* Attendees */}
              <div>
                <ModalSectionTitle>
                  Attendees ({transactionModal.attendees.length})
                </ModalSectionTitle>
                <ModalInfoPanel>
                  {transactionModal.attendees.map((attendee, index) => (
                    <div
                      key={index}
                      style={{
                        padding: index === 0 ? "0 0 12px" : "12px 0",
                        borderBottom:
                          index < transactionModal.attendees.length - 1
                            ? `1px solid ${C.cardBorder}`
                            : "none",
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
                        {attendee.name}
                      </div>
                      <div style={{ fontSize: "0.85rem", color: C.muted }}>
                        {attendee.email}
                      </div>
                      {attendee.phone && (
                        <div style={{ fontSize: "0.85rem", color: C.muted }}>
                          {attendee.phone}
                        </div>
                      )}
                    </div>
                  ))}
                </ModalInfoPanel>
              </div>

              {/* Action Buttons */}
              <Divider />
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  justifyContent: "flex-end",
                  flexWrap: "wrap",
                }}
              >
                <Btn
                  variant="secondary"
                  onClick={resendTickets}
                  disabled={resendingTickets}
                >
                  {resendingTickets ? (
                    <>
                      <Loader2 size={16} className="spin" />
                      Resending...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} />
                      Resend Tickets
                    </>
                  )}
                </Btn>

                {transactionModal.status !== "refunded" && (
                  <Btn
                    variant="danger"
                    onClick={() => updateOrderStatus("refunded")}
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? (
                      <>
                        <Loader2 size={16} className="spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <DollarSign size={16} />
                        Mark as Refunded
                      </>
                    )}
                  </Btn>
                )}

                {transactionModal.status === "refunded" && (
                  <Btn
                    variant="primary"
                    onClick={() => updateOrderStatus("success")}
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? (
                      <>
                        <Loader2 size={16} className="spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        Mark as Success
                      </>
                    )}
                  </Btn>
                )}
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Manual Check-in Modal */}
      {manualEntryOpen && (
        <Modal
          title="Manual Check-in"
          onClose={() => {
            setManualEntryOpen(false);
            setManualTicketInput("");
          }}
        >
          <FormGroup label="Ticket ID or QR Value">
            <input
              autoFocus
              value={manualTicketInput}
              onChange={(e) => setManualTicketInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && manualTicketInput.trim()) {
                  submitManualCheckIn();
                }
              }}
              placeholder="BP-202606XXXX-XXXX"
            />
          </FormGroup>
          <ModalInfoPanel>
            <p
              style={{
                margin: 0,
                color: C.muted,
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              Paste a ticket ID or the full scanned QR value from the ticket.
            </p>
          </ModalInfoPanel>
          <Divider />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn
              variant="secondary"
              onClick={() => {
                setManualEntryOpen(false);
                setManualTicketInput("");
              }}
            >
              Cancel
            </Btn>
            <Btn
              onClick={submitManualCheckIn}
              disabled={!manualTicketInput.trim()}
            >
              <CheckCircle size={14} />
              Check In
            </Btn>
          </div>
        </Modal>
      )}

      {/* Notification Modal */}
      {notification && (
        <Modal title={notification.title} onClose={() => setNotification(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                background: C.card,
                border: `1px solid ${
                  notification.type === "success"
                    ? "rgba(16,185,129,0.3)"
                    : notification.type === "error"
                      ? "rgba(244,63,94,0.3)"
                      : C.cardBorder
                }`,
                borderRadius: 10,
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background:
                    notification.type === "success"
                      ? C.successDim
                      : notification.type === "error"
                        ? C.dangerDim
                        : C.infoDim,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {notification.type === "success" && (
                  <CheckCircle size={17} color={C.success} />
                )}
                {notification.type === "error" && (
                  <XCircle size={17} color={C.danger} />
                )}
                {notification.type === "info" && (
                  <AlertTriangle size={17} color={C.info} />
                )}
              </div>
              <p
                style={{
                  margin: 0,
                  color: C.muted,
                  whiteSpace: "pre-line",
                  lineHeight: 1.5,
                  fontSize: 14,
                }}
              >
                {notification.message}
              </p>
            </div>

            <Divider />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Btn onClick={() => setNotification(null)}>OK</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* User Modal */}
      {userModal && (
        <Modal
          title={userModal.type === "create" ? "Create New User" : "Edit User"}
          onClose={() => !saving && setUserModal(null)}
          wide
        >
          <div style={{ display: "grid", gap: 14 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  userModal.type === "create" ? "1fr 1fr" : "1fr",
                gap: 12,
              }}
            >
              <FormGroup label="Username">
                <input
                  value={userForm.username}
                  onChange={(e) =>
                    setUserForm({ ...userForm, username: e.target.value })
                  }
                  placeholder="Enter username"
                />
              </FormGroup>

              {userModal.type === "create" && (
                <FormGroup label="Password">
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) =>
                      setUserForm({ ...userForm, password: e.target.value })
                    }
                    placeholder="Enter password"
                  />
                </FormGroup>
              )}
            </div>

            <FormGroup label="Permissions">
              <ModalInfoPanel>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 10,
                  }}
                >
                  {[
                    {
                      id: "dashboard",
                      label: "Dashboard",
                      desc: "View analytics",
                    },
                    { id: "events", label: "Events", desc: "Manage events" },
                    {
                      id: "tickets",
                      label: "Tickets",
                      desc: "Manage ticket tiers",
                    },
                    { id: "coupons", label: "Coupons", desc: "Create coupons" },
                    {
                      id: "transactions",
                      label: "Transactions",
                      desc: "View orders",
                    },
                    { id: "checkin", label: "Check-in", desc: "Scan tickets" },
                    { id: "users", label: "Users", desc: "Manage users" },
                  ].map((permission) => {
                    const selected = userForm.permissions.includes(
                      permission.id,
                    );

                    return (
                      <label
                        key={permission.id}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 10,
                          minHeight: 62,
                          padding: "10px 12px",
                          borderRadius: 8,
                          border: `1px solid ${
                            selected ? C.accent : C.cardBorder
                          }`,
                          background: selected ? C.accentDim : C.bg,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setUserForm({
                                ...userForm,
                                permissions: [
                                  ...userForm.permissions,
                                  permission.id,
                                ],
                              });
                            } else {
                              setUserForm({
                                ...userForm,
                                permissions: userForm.permissions.filter(
                                  (p) => p !== permission.id,
                                ),
                              });
                            }
                          }}
                          style={{
                            width: "auto",
                            marginTop: 2,
                            accentColor: C.accent,
                          }}
                        />
                        <div>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: selected ? C.accent : C.text,
                              marginBottom: 3,
                            }}
                          >
                            {permission.label}
                          </div>
                          <div style={{ fontSize: 12, color: C.muted }}>
                            {permission.desc}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </ModalInfoPanel>
            </FormGroup>

            <FormGroup label="Status">
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: C.card,
                  border: `1px solid ${C.cardBorder}`,
                  borderRadius: 10,
                  padding: "12px 14px",
                  color: C.text,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={userForm.isActive}
                  onChange={(e) =>
                    setUserForm({ ...userForm, isActive: e.target.checked })
                  }
                  style={{ width: "auto", accentColor: C.accent }}
                />
                Active
              </label>
            </FormGroup>
          </div>

          <Divider />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn
              variant="secondary"
              onClick={() => setUserModal(null)}
              disabled={saving}
            >
              Cancel
            </Btn>
            <Btn onClick={saveUser} disabled={saving}>
              {saving ? <Loader2 size={14} className="spin" /> : null}
              {saving
                ? "Saving..."
                : userModal.type === "create"
                  ? "Create User"
                  : "Update User"}
            </Btn>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <Modal title="Delete User" onClose={() => setDeleteConfirm(null)}>
          <div style={{ padding: "1rem 0" }}>
            <p style={{ marginBottom: "1.5rem", color: C.text }}>
              Are you sure you want to delete user &quot;
              {deleteConfirm.username}&quot;? This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "1rem" }}>
              <Btn
                onClick={() => {
                  handleDeleteUser(deleteConfirm.userId);
                  setDeleteConfirm(null);
                }}
                style={{
                  flex: 1,
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                }}
              >
                Delete User
              </Btn>
              <Btn
                variant="ghost"
                onClick={() => setDeleteConfirm(null)}
                style={{ flex: 1 }}
              >
                Cancel
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
