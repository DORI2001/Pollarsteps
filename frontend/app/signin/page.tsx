"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, session } from "@/lib/api";

export default function SignIn() {
  const router = useRouter();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Client-side validation
    if (!emailOrUsername.trim()) {
      setError("Email or username is required");
      setLoading(false);
      return;
    }
    if (!password.trim()) {
      setError("Password is required");
      setLoading(false);
      return;
    }

    try {
      const tokens = await api.login(emailOrUsername.trim(), password);
      session.setToken(tokens.access_token);

      // Fetch and store user info
      const user = await api.getCurrentUser(tokens.access_token);
      session.setUser(user);

      // Redirect to home
      router.push("/");
    } catch (err: any) {
      const message =
        err.message || err.detail || "Sign in failed. Please check your credentials and try again.";
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
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "16px",
          padding: "48px 40px",
          width: "100%",
          maxWidth: 420,
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.15)",
        }}
      >
        {/* Logo/Title */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🗺️</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#1a202c", margin: 0, letterSpacing: "-0.5px" }}>
            Polarsteps
          </h1>
          <p style={{ fontSize: 14, color: "#718096", marginTop: 12, lineHeight: 1.6 }}>
            Sign in to continue your journey
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              background: "#fed7d7",
              color: "#742a2a",
              padding: "14px 16px",
              borderRadius: 10,
              fontSize: 13,
              marginBottom: 20,
              border: "1px solid #fc8181",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSignIn}>
          {/* Email or Username Input */}
          <div style={{ marginBottom: 18 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "#2d3748",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Email or Username
            </label>
            <input
              type="text"
              placeholder="you@example.com or username"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "14px 16px",
                border: "2px solid #e2e8f0",
                borderRadius: 10,
                fontSize: 15,
                fontFamily: "inherit",
                boxSizing: "border-box",
                background: "#f7fafc",
                transition: "all 0.2s",
                outline: "none",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#667eea";
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0";
                e.currentTarget.style.background = "#f7fafc";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: 28 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "#2d3748",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
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
                padding: "14px 16px",
                border: "2px solid #e2e8f0",
                borderRadius: 10,
                fontSize: 15,
                fontFamily: "inherit",
                boxSizing: "border-box",
                background: "#f7fafc",
                transition: "all 0.2s",
                outline: "none",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#667eea";
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0";
                e.currentTarget.style.background = "#f7fafc";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px 16px",
              background: loading ? "#cbd5e0" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              transition: "all 0.3s ease",
              boxShadow: "0 8px 20px rgba(102, 126, 234, 0.3)",
              letterSpacing: "0.5px",
            }}
            onMouseOver={(e) => {
              if (!loading) {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 25px rgba(102, 126, 234, 0.4)";
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 20px rgba(102, 126, 234, 0.3)";
              }
            }}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div style={{ margin: "28px 0", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#cbd5e0", margin: 0 }}>Don't have an account?</p>
        </div>

        {/* Sign Up Link */}
        <Link href="/signup">
          <button
            type="button"
            style={{
              width: "100%",
              padding: "14px 16px",
              background: "transparent",
              color: "#667eea",
              border: "2px solid #667eea",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s ease",
              letterSpacing: "0.5px",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "rgba(102, 126, 234, 0.05)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Create New Account
          </button>
        </Link>
      </div>
    </div>
  );
}
