"use client";

import React, { useState } from "react";
import { useAuthFlow } from "@/hooks/useAuthFlow";
import { useColors } from "@/lib/theme";
import { AuthPageShell } from "@/components/AuthPageShell";

export default function SignIn() {
  const COLORS = useColors();
  const authFlow = useAuthFlow();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!emailOrUsername.trim()) { setError("Email or username is required"); setLoading(false); return; }
    if (!password.trim()) { setError("Password is required"); setLoading(false); return; }

    try {
      await authFlow.login(emailOrUsername.trim(), password);
    } catch (err: any) {
      setError(err.message || err.detail || "Sign in failed. Please check your credentials and try again.");
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
      subtitle="Sign in to continue your journey"
      onSubmit={handleSignIn}
      submitLabel={loading ? "Signing In..." : "Sign In"}
      loading={loading}
      error={error}
      footerText="Don't have an account?"
      footerLinkHref="/signup"
      footerLinkLabel="Create New Account"
    >
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Email or Username</label>
        <input
          type="text" placeholder="you@example.com or username"
          value={emailOrUsername} onChange={(e) => setEmailOrUsername(e.target.value)}
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
      </div>
    </AuthPageShell>
  );
}
