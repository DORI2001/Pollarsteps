"use client";

import React from "react";
import Link from "next/link";
import { useColors } from "@/lib/theme";

interface AuthPageShellProps {
  subtitle: string;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
  loading: boolean;
  error: string;
  footerText: string;
  footerLinkHref: string;
  footerLinkLabel: string;
  children: React.ReactNode;
}

export function AuthPageShell({
  subtitle, onSubmit, submitLabel, loading, error,
  footerText, footerLinkHref, footerLinkLabel, children,
}: AuthPageShellProps) {
  const COLORS = useColors();

  return (
    <div style={{
      minHeight: "100vh",
      background: COLORS.background,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <style>{`
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in { animation: scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>

      <div className="animate-scale-in" style={{
        background: COLORS.surface, borderRadius: "28px", padding: "48px",
        width: "100%", maxWidth: 420,
        boxShadow: `0 8px 32px ${COLORS.shadowColor}`,
      }}>
        {/* Logo/Title */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: COLORS.text, margin: 0, letterSpacing: "-0.5px" }}>
            Pollarsteps
          </h1>
          <p style={{ fontSize: 15, color: COLORS.textSecondary, fontWeight: 400, margin: "12px 0 0 0", lineHeight: 1.6 }}>
            {subtitle}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(255, 69, 58, 0.1)", color: COLORS.error,
            padding: "12px 16px", borderRadius: 12, fontSize: 13, fontWeight: 500,
            marginBottom: 24, border: `1px solid ${COLORS.error}`,
          }}>
            {error}
          </div>
        )}

        {/* Form fields slot */}
        <form onSubmit={onSubmit}>
          {children}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", height: "50px", padding: "0",
              background: loading
                ? `${COLORS.primary}33`
                : `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
              color: "white", border: "none", borderRadius: 14,
              fontSize: 15, fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              boxShadow: loading ? "none" : "0 8px 24px rgba(91, 108, 240, 0.2)",
            } as React.CSSProperties}
            onMouseOver={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 12px 32px rgba(91, 108, 240, 0.3)";
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(91, 108, 240, 0.2)";
              }
            }}
          >
            {submitLabel}
          </button>
        </form>

        {/* Footer link */}
        <div style={{ margin: "28px 0 0 0", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: COLORS.textSecondary, margin: "0 0 16px 0" }}>
            {footerText}
          </p>
          <Link href={footerLinkHref} style={{ textDecoration: "none" }}>
            <button
              type="button"
              style={{
                width: "100%", height: "50px", padding: "0",
                background: "transparent", color: COLORS.primary,
                border: `1px solid ${COLORS.border}`, borderRadius: 14,
                fontSize: 15, fontWeight: 500, cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              } as React.CSSProperties}
              onMouseOver={(e) => {
                e.currentTarget.style.background = `${COLORS.primary}08`;
                e.currentTarget.style.borderColor = COLORS.primary;
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = COLORS.border;
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {footerLinkLabel}
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
