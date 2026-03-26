"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, session } from "@/lib/api";

export default function SignUp() {
  const router = useRouter();
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
      session.setToken(tokens.access_token);

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
            Create an account and start documenting your world
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
        <form onSubmit={handleSignUp}>
          {/* Email Input */}
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

          {/* Username Input */}
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
            <p style={{ fontSize: 12, color: "#a0aec0", marginTop: 6, margin: 0 }}>
              At least 6 characters
            </p>
          </div>

          {/* Sign Up Button */}
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
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 12px 25px rgba(102, 126, 234, 0.4)";
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(102, 126, 234, 0.3)";
              }
            }}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {/* Divider */}
        <div style={{ margin: "28px 0", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#cbd5e0", margin: 0 }}>Already have an account?</p>
        </div>

        {/* Sign In Link */}
        <Link href="/signin">
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
            Sign In Instead
          </button>
        </Link>
      </div>
    </div>
  );
}
