"use client";

import React, { useState } from "react";
import { useAuthFlow } from "@/hooks/useAuthFlow";
import { useColors } from "@/lib/theme";
import { validatePassword, passwordRequirementsMessage } from "@/lib/api/validation";
import { AuthPageShell } from "@/components/AuthPageShell";

export default function SignUp() {
  const COLORS = useColors();
  const authFlow = useAuthFlow();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!email.trim()) { setError("Email is required"); setLoading(false); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Invalid email address"); setLoading(false); return; }
    if (!username.trim()) { setError("Username is required"); setLoading(false); return; }
    if (username.length < 3) { setError("Username must be at least 3 characters"); setLoading(false); return; }
    if (!validatePassword(password)) { setError(passwordRequirementsMessage()); setLoading(false); return; }

    try {
      await authFlow.register(email.trim(), password, username.trim());
    } catch (err: any) {
      setError(err.message || err.detail || "Sign up failed. Please try again.");
      console.error("[Auth Error]", err);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 16px", border: `1px solid ${COLORS.border}`,
    borderRadius: 14, fontSize: 16, fontFamily: "inherit", boxSizing: "border-box",
    background: COLORS.inputBg, transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
    outline: "none", height: "48px",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 13, fontWeight: 500,
    color: COLORS.textSecondary, marginBottom: 8,
  };
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = COLORS.primary;
    e.currentTarget.style.background = COLORS.inputFocusBg;
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(91, 108, 240, 0.1)";
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = COLORS.border;
    e.currentTarget.style.background = COLORS.inputBg;
    e.currentTarget.style.boxShadow = "none";
  };

  return (
    <AuthPageShell
      subtitle="Create an account and start your journey"
      onSubmit={handleSignUp}
      submitLabel={loading ? "Creating Account..." : "Create Account"}
      loading={loading}
      error={error}
      footerText="Already have an account?"
      footerLinkHref="/signin"
      footerLinkLabel="Sign In Instead"
    >
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Email Address</label>
        <input
          type="email" placeholder="you@example.com"
          value={email} onChange={(e) => setEmail(e.target.value)}
          required style={inputStyle} onFocus={onFocus} onBlur={onBlur}
        />
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Username</label>
        <input
          type="text" placeholder="Choose a unique username"
          value={username} onChange={(e) => setUsername(e.target.value)}
          required style={inputStyle} onFocus={onFocus} onBlur={onBlur}
        />
      </div>
      <div style={{ marginBottom: 32 }}>
        <label style={labelStyle}>Password</label>
        <input
          type="password" placeholder="••••••••"
          value={password} onChange={(e) => setPassword(e.target.value)}
          required style={inputStyle} onFocus={onFocus} onBlur={onBlur}
        />
        <p style={{ fontSize: 12, color: COLORS.textTertiary, margin: "6px 0 0 0" }}>
          At least 6 characters
        </p>
      </div>
    </AuthPageShell>
  );
}
