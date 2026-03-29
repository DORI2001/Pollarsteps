"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useColors } from "@/lib/theme";
import { TripViewer } from "@/components/TripViewer";
import { ThemeProvider } from "@/providers/ThemeProvider";

function SharedTripContent() {
  const params = useParams();
  const token = params.token as string;
  const COLORS = useColors();
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    const loadSharedTrip = async () => {
      try {
        const data = await api.getSharedTrip(token);
        setTrip(data);
      } catch (err: any) {
        setError("This shared trip link is invalid or has been revoked.");
      } finally {
        setLoading(false);
      }
    };

    loadSharedTrip();
  }, [token]);

  if (loading) {
    return (
      <div style={{
        width: "100vw",
        height: "100vh",
        background: COLORS.background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: `3px solid ${COLORS.border}`,
          borderTopColor: COLORS.primary,
          animation: "spin 0.8s linear infinite",
          marginBottom: 20,
        }} />
        <p style={{ fontSize: 16, color: COLORS.textSecondary }}>Loading shared trip...</p>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div style={{
        width: "100vw",
        height: "100vh",
        background: COLORS.background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        padding: 24,
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>
          Trip Not Found
        </h1>
        <p style={{ fontSize: 16, color: COLORS.textSecondary, textAlign: "center", maxWidth: 400 }}>
          {error || "This trip doesn't exist or the share link has expired."}
        </p>
        <a
          href="/"
          style={{
            marginTop: 24,
            padding: "12px 24px",
            background: COLORS.primary,
            color: "white",
            borderRadius: 12,
            textDecoration: "none",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Go to Pollarsteps
        </a>
      </div>
    );
  }

  const steps = trip.steps || [];

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", background: COLORS.background }}>
      {/* Header */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: 64,
        backdropFilter: "saturate(180%) blur(20px)",
        background: COLORS.headerBg,
        borderBottom: `1px solid ${COLORS.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
      }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600, color: COLORS.text }}>{trip.title}</div>
          <div style={{ fontSize: 12, color: COLORS.textSecondary }}>
            {steps.length} location{steps.length !== 1 ? "s" : ""} · Shared trip
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a
            href="/"
            style={{
              padding: "8px 16px",
              borderRadius: 20,
              background: COLORS.primary,
              color: "white",
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Create Your Own Trip
          </a>
        </div>
      </div>

      {/* Map */}
      <div style={{ position: "absolute", top: 64, left: 0, right: steps.length > 0 ? 380 : 0, bottom: 0 }}>
        <TripViewer
          steps={steps}
          onMapClick={() => {}} // Read-only
          tripId={trip.id}
        />
      </div>

      {/* Steps sidebar */}
      {steps.length > 0 && (
        <div style={{
          position: "fixed",
          top: 84,
          right: 16,
          bottom: 24,
          width: 340,
          background: COLORS.cardBg,
          borderRadius: 20,
          padding: 24,
          boxShadow: `0 12px 40px ${COLORS.shadowHeavy}`,
          backdropFilter: "saturate(180%) blur(20px)",
          zIndex: 70,
          overflowY: "auto",
        }}>
          <h3 style={{
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.5px",
            color: COLORS.textSecondary,
            margin: "0 0 16px 0",
            textTransform: "uppercase",
          }}>
            Journey ({steps.length} stops)
          </h3>

          {steps.map((step: any, index: number) => (
            <div key={step.id} style={{
              padding: 16,
              background: COLORS.surfaceElevated,
              borderRadius: 14,
              marginBottom: 12,
              borderLeft: `3px solid ${index === 0 ? COLORS.success : index === steps.length - 1 ? COLORS.error : COLORS.primary}`,
            }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>
                {step.location_name || `Stop ${index + 1}`}
              </div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 6 }}>
                {new Date(step.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                {step.duration_days ? ` · ${step.duration_days} day${step.duration_days !== 1 ? "s" : ""}` : ""}
              </div>
              {step.note && (
                <p style={{ fontSize: 13, color: COLORS.textSecondary, margin: "8px 0 0", lineHeight: 1.5 }}>
                  {step.note}
                </p>
              )}
              {step.image_url && (
                <img
                  src={step.image_url}
                  alt=""
                  style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8, marginTop: 8 }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SharedTripPage() {
  return (
    <ThemeProvider>
      <SharedTripContent />
    </ThemeProvider>
  );
}
