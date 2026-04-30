"use client";
import { useState } from "react";
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";

// ─── Styling Constants (matching admin interface) ───────────────────────────────────

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
  select option { background: ${C.sidebar}; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${C.faint}; border-radius: 4px; }
`;

// ─── Button Component (matching admin interface) ───────────────────────────────────

type BtnVariant = "primary" | "secondary" | "danger" | "ghost";

interface BtnProps {
  variant?: BtnVariant;
  onClick?: () => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
}

function Btn({
  variant = "primary",
  onClick,
  children,
  style = {},
  disabled,
  loading,
}: BtnProps) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    cursor: disabled || loading ? "not-allowed" : "pointer",
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
  };
  return (
    <button
      disabled={disabled || loading}
      style={{ ...base, ...variants[variant], ...style }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// ─── Form Group Component ─────────────────────────────────────────────────────────

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

// ─── Login Header Component (unique from admin) ───────────────────────────────────

function LoginHeader() {
  return (
    <header
      style={{
        background: C.sidebar,
        borderBottom: `1px solid ${C.cardBorder}`,
        padding: "0 2rem",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Left - Title */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        {/* Title */}
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 16,
            fontWeight: 700,
            color: C.text,
            letterSpacing: "0.01em",
          }}
        >
          Admin Portal
        </span>
      </div>

      {/* Right - Home Button */}
      <button
        onClick={() => (window.location.href = "/")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 16px",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 500,
          fontFamily: "'DM Sans', sans-serif",
          color: C.muted,
          background: "transparent",
          border: `1px solid ${C.cardBorder}`,
          textDecoration: "none",
          transition: "all 0.15s",
          cursor: "pointer",
        }}
      >
        {/* Home icon (inline SVG) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={14}
          height={14}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9,22 9,12 15,12 15,22" />
        </svg>
        Home
      </button>
    </header>
  );
}

// ─── Main Login Component ─────────────────────────────────────────────────────────

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get redirect URL from query params
  const redirectTo =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("redirect") || "/admin"
      : "/admin";

  const handleInputChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      if (error) setError(null);
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username || !formData.password) {
      setError("Please enter both username and password");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate API call - replace with actual authentication logic
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Invalid credentials");
      }

      // On successful login, redirect to the intended page
      window.location.href = redirectTo;
    } catch (error) {
      console.error("Login error:", error);
      setError("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FONT_CSS }} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          background: C.bg,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <LoginHeader />

        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
        >
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.cardBorder}`,
              borderRadius: 16,
              padding: "2rem",
              width: "100%",
              maxWidth: 400,
            }}
          >
            {/* Login Form Header */}
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <h2
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 24,
                  fontWeight: 700,
                  color: C.text,
                  marginBottom: 8,
                }}
              >
                Welcome
              </h2>
              <p style={{ fontSize: 14, color: C.muted }}>
                Sign in to access the admin dashboard
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div
                style={{
                  background: C.dangerDim,
                  border: `1px solid rgba(244,63,94,0.3)`,
                  borderRadius: 8,
                  padding: "12px",
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <AlertCircle size={16} color={C.danger} />
                <span style={{ fontSize: 13, color: C.danger }}>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit}>
              <FormGroup label="Username">
                <input
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange("username")}
                  placeholder="Enter your username"
                  disabled={loading}
                  autoComplete="username"
                />
              </FormGroup>

              <FormGroup label="Password">
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange("password")}
                    placeholder="Enter your password"
                    disabled={loading}
                    autoComplete="current-password"
                    style={{ paddingRight: 36 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: C.muted,
                      cursor: "pointer",
                      padding: 4,
                    }}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </FormGroup>

              <div style={{ marginTop: "1.5rem" }}>
                <Btn
                  variant="primary"
                  type="submit"
                  disabled={loading}
                  loading={loading}
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    padding: "10px",
                  }}
                >
                  {loading ? (
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        border: `2px solid #0a0a0f`,
                        borderTop: `2px solid transparent`,
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                  ) : (
                    <LogIn size={14} />
                  )}
                  Sign In
                </Btn>
              </div>
            </form>

            {/* Footer */}
            <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
              <p style={{ fontSize: 12, color: C.faint }}>
                BePraize Sax Admin Portal
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
