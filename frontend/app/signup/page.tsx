"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, session } from "@/lib/api";
import { useColors } from "@/lib/theme";

export default function SignUp() {
  const router = useRouter();
  const COLORS = useColors();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Client-side validation
    if (!email.trim()) {
      setError("Email is required");
      setLoading(false);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Invalid email address");
      setLoading(false);
      return;
    }
    if (!username.trim()) {
      setError("Username is required");
      setLoading(false);
      return;
    }
    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      setLoading(false);
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
        const tokens = await api.register(email.trim(), password, username.trim());
        // Persist both access and refresh tokens so auto-refresh can work
        session.setTokens(tokens.access_token, tokens.refresh_token);

      // Fetch and store user info
      const user = await api.getCurrentUser(tokens.access_token);
      session.setUser(user);

      // Redirect to home
      router.push("/");
    } catch (err: any) {
      const message =
        err.message || err.detail || "Sign up failed. Please try again.";
      setError(message);
      console.error("[Auth Error]", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <style>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-scale-in {
          animation: scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>

      <div
        className="animate-scale-in"
        style={{
          background: COLORS.surface,
          borderRadius: "28px",
          padding: "48px",
          width: "100%",
          maxWidth: 420,
          boxShadow: `0 8px 32px ${COLORS.shadowColor}`,
        }}
      >
        {/* Logo/Title */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: COLORS.text,
              margin: 0,
              letterSpacing: "-0.5px",
            }}
          >
            Pollarsteps
          </h1>
          <p
            style={{
              fontSize: 15,
              color: COLORS.textSecondary,
              fontWeight: 400,
              marginTop: 12,
              lineHeight: 1.6,
              margin: "12px 0 0 0",
            }}
          >
            Create an account and start your journey
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              background:
                COLORS.error === "#FF453A"
                  ? "rgba(255, 69, 58, 0.1)"
                  : "rgba(255, 69, 58, 0.1)",
              color: COLORS.error,
              padding: "12px 16px",
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 24,
              border: `1px solid ${COLORS.error}`,
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSignUp}>
          {/* Email Input */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 500,
                color: COLORS.textSecondary,
                marginBottom: 8,
                textTransform: "none",
              }}
            >
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px 16px",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 14,
                fontSize: 16,
                fontFamily: "inherit",
                boxSizing: "border-box",
                background: COLORS.inputBg,
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                outline: "none",
                height: "48px",
              } as React.CSSProperties}
              onFocus={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor = COLORS.primary;
                (e.currentTarget as HTMLInputElement).style.background = COLORS.inputFocusBg;
                (e.currentTarget as HTMLInputElement).style.boxShadow = `0 0 0 3px rgba(91, 108, 240, 0.1)`;
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor = COLORS.border;
                (e.currentTarget as HTMLInputElement).style.background = COLORS.inputBg;
                (e.currentTarget as HTMLInputElement).style.boxShadow = "none";
              }}
            />
          </div>

          {/* Username Input */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 500,
                color: COLORS.textSecondary,
                marginBottom: 8,
                textTransform: "none",
              }}
            >
              Username
            </label>
            <input
              type="text"
              placeholder="Choose a unique username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px 16px",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 14,
                fontSize: 16,
                fontFamily: "inherit",
                boxSizing: "border-box",
                background: COLORS.inputBg,
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                outline: "none",
                height: "48px",
              } as React.CSSProperties}
              onFocus={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor = COLORS.primary;
                (e.currentTarget as HTMLInputElement).style.background = COLORS.inputFocusBg;
                (e.currentTarget as HTMLInputElement).style.boxShadow = `0 0 0 3px rgba(91, 108, 240, 0.1)`;
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor = COLORS.border;
                (e.currentTarget as HTMLInputElement).style.background = COLORS.inputBg;
                (e.currentTarget as HTMLInputElement).style.boxShadow = "none";
              }}
            />
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: 32 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 500,
                color: COLORS.textSecondary,
                marginBottom: 8,
                textTransform: "none",
              }}
            >
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px 16px",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 14,
                fontSize: 16,
                fontFamily: "inherit",
                boxSizing: "border-box",
                background: COLORS.inputBg,
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                outline: "none",
                height: "48px",
              } as React.CSSProperties}
              onFocus={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor = COLORS.primary;
                (e.currentTarget as HTMLInputElement).style.background = COLORS.inputFocusBg;
                (e.currentTarget as HTMLInputElement).style.boxShadow = `0 0 0 3px rgba(91, 108, 240, 0.1)`;
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor = COLORS.border;
                (e.currentTarget as HTMLInputElement).style.background = COLORS.inputBg;
                (e.currentTarget as HTMLInputElement).style.boxShadow = "none";
              }}
            />
            <p
              style={{
                fontSize: 12,
                color: COLORS.textTertiary,
                marginTop: 6,
                margin: "6px 0 0 0",
              }}
            >
              At least 6 characters
            </p>
          </div>

          {/* Create Account Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: "50px",
              padding: "0",
              background: loading
                ? `${COLORS.primary}33`
                : `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
              color: "white",
              border: "none",
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              boxShadow: loading
                ? "none"
                : `0 8px 24px rgba(91, 108, 240, 0.2)`,
            } as React.CSSProperties}
            onMouseOver={(e) => {
              if (!loading) {
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(-2px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  `0 12px 32px rgba(91, 108, 240, 0.3)`;
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  `0 8px 24px rgba(91, 108, 240, 0.2)`;
              }
            }}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {/* Divider */}
        <div style={{ margin: "28px 0", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: COLORS.textSecondary, margin: 0 }}>
            Already have an account?
          </p>
        </div>

        {/* Sign In Link Button */}
        <Link href="/signin" style={{ textDecoration: "none" }}>
          <button
            type="button"
            style={{
              width: "100%",
              height: "50px",
              padding: "0",
              background: "transparent",
              color: COLORS.primary,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            } as React.CSSProperties}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                `${COLORS.primary}08`;
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                COLORS.primary;
              (e.currentTarget as HTMLButtonElement).style.transform =
                "translateY(-1px)";
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                COLORS.border;
              (e.currentTarget as HTMLButtonElement).style.transform =
                "translateY(0)";
            }}
          >
            Sign In Instead
          </button>
        </Link>
      </div>
    </div>
  );
}
