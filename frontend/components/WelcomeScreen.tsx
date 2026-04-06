"use client";

import React from "react";
import { useColors } from "@/lib/theme";
import { useTripContext } from "@/providers/TripProvider";

export function WelcomeScreen() {
  const COLORS = useColors();
  const { user, newTripTitle, setNewTripTitle, handleCreateTrip, handleLogout } = useTripContext();

  return (
    <div style={{ minHeight: "100vh", background: COLORS.background }}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleInGently {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        .welcome-header { animation: fadeInUp 0.6s ease-out; }
        .create-card { animation: scaleInGently 0.7s ease-out 0.1s both; }
        .info-card { animation: fadeInUp 0.6s ease-out 0.3s both; }
      `}</style>

      {/* Header */}
      <div style={{
        padding: "16px 24px",
        background: COLORS.cardBg,
        backdropFilter: "saturate(180%) blur(20px)",
        borderBottom: `1px solid ${COLORS.separator}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: `0 2px 12px ${COLORS.shadowColor}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 28, lineHeight: 1 }}>🗺️</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.4px", color: COLORS.text, margin: 0 }}>
            Pollarsteps
          </h1>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: "10px 16px",
            background: "transparent",
            color: COLORS.error,
            border: `1px solid ${COLORS.error}`,
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "-0.3px",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = COLORS.error;
            e.currentTarget.style.color = "white";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = COLORS.error;
          }}
        >
          Sign Out
        </button>
      </div>

      {/* Main Content */}
      <div style={{ padding: "60px 24px 40px", maxWidth: 540, margin: "0 auto" }}>
        <div style={{ marginBottom: 56, textAlign: "center" }} className="welcome-header">
          <h2 style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.5px", color: COLORS.text, margin: "0 0 12px 0", lineHeight: 1.2 }}>
            Welcome back, {user?.display_name || user?.username || "Traveller"}!
          </h2>
          <p style={{ fontSize: 17, fontWeight: 400, letterSpacing: "-0.4px", color: COLORS.textSecondary, margin: 0, lineHeight: 1.5 }}>
            Create your first adventure by starting a new trip
          </p>
        </div>

        {/* Create Trip Card */}
        <div style={{
          background: COLORS.surfaceElevated,
          borderRadius: 24,
          padding: 32,
          marginBottom: 28,
          boxShadow: `0 8px 28px ${COLORS.shadowColor}`,
        }} className="create-card">
          <label style={{
            display: "block", fontSize: 13, fontWeight: 600, letterSpacing: "0.5px",
            color: COLORS.textSecondary, marginBottom: 16, textTransform: "uppercase",
          }}>
            Trip Name
          </label>
          <input
            type="text"
            placeholder="e.g., European Summer, Japan 2026"
            value={newTripTitle}
            onChange={(e) => setNewTripTitle(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleCreateTrip()}
            style={{
              width: "100%", padding: "14px 16px", border: `1px solid ${COLORS.separator}`,
              borderRadius: 12, fontSize: 16, fontWeight: 400, boxSizing: "border-box",
              background: COLORS.background, color: COLORS.text, marginBottom: 20,
              fontFamily: "inherit", transition: "all 0.2s ease", outline: "none",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = COLORS.primary;
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(91, 108, 240, 0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = COLORS.separator;
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          <button
            onClick={handleCreateTrip}
            style={{
              width: "100%", padding: "14px 16px",
              background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
              color: "white", border: "none", borderRadius: 12, fontSize: 15,
              fontWeight: 600, letterSpacing: "-0.3px", cursor: "pointer",
              transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "0 4px 16px rgba(91, 108, 240, 0.25)",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(91, 108, 240, 0.35)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(91, 108, 240, 0.25)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Create Trip
          </button>
        </div>

        {/* Info Card */}
        <div style={{
          padding: 28, background: COLORS.surfaceElevated, borderRadius: 20,
          textAlign: "center", boxShadow: `0 4px 12px ${COLORS.shadowColor}`,
          borderTop: `1px solid ${COLORS.separator}`,
        }} className="info-card">
          <p style={{
            fontSize: 15, fontWeight: 400, letterSpacing: "-0.3px",
            color: COLORS.textSecondary, lineHeight: 1.6, margin: 0,
          }}>
            Start exploring the world. Pin locations on your map, add stories and memories to each place you visit.
          </p>
        </div>
      </div>
    </div>
  );
}
