"use client";
import { useState, useEffect } from "react";

export function AdminHeaderClient() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [username, setUsername] = useState("Admin");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setUsername(data.username || "Admin");
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        // Keep default username if fetch fails
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include", // Ensure cookies are sent
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      // Force redirect to login page
      window.location.href = "/admin/login";
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if API fails, still redirect to login
      window.location.href = "/admin/login";
    }
  };

  return (
    <header
      style={{
        background: "#0f0f18",
        borderBottom: "1px solid #1e1e30",
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
      {/* Left — greeting */}
      <span
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 15,
          fontWeight: 600,
          color: "#eeeef5",
          letterSpacing: "0.01em",
        }}
      >
        Welcome, <span style={{ color: "#f59e0b", textTransform: "capitalize" }}>{username}</span>
      </span>

      {/* Right — logout */}
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 16px",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 500,
          fontFamily: "'DM Sans', sans-serif",
          color: "#7777a0",
          background: "transparent",
          border: "1px solid #333350",
          textDecoration: "none",
          transition: "all 0.15s",
          cursor: isLoggingOut ? "not-allowed" : "pointer",
          opacity: isLoggingOut ? 0.7 : 1,
        }}
      >
        {/* Logout icon (inline SVG — no extra import needed) */}
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
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        {isLoggingOut ? "Logging out..." : "Logout"}
      </button>
    </header>
  );
}
