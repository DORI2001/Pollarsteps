"use client";

import React, { useState, useMemo } from "react";
import { useColors } from "@/lib/theme";
import { calculateTotalDistance } from "@/lib/distance";
import { TripStatistics } from "@/components/TripStatistics";
import { EnhancedStatistics } from "@/components/EnhancedStatistics";
import { useTripContext } from "@/providers/TripProvider";
import { Step, Trip } from "@/lib/types";

function calculateTotalDays(steps: Step[]): number {
  if (!steps || steps.length < 2) return 0;
  const first = steps[0];
  const last = steps[steps.length - 1];
  if (!first.timestamp || !last.timestamp) return 0;
  const delta = new Date(last.timestamp).getTime() - new Date(first.timestamp).getTime();
  return Math.ceil(delta / (1000 * 60 * 60 * 24)) + 1;
}

function calculateTripDuration(trip: Trip | null): number {
  if (!trip || !trip.start_date) return 0;
  if (trip.end_date) {
    const start = new Date(trip.start_date);
    const end = new Date(trip.end_date);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }
  const start = new Date(trip.start_date);
  return Math.ceil((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

function calculateDaysAtDestinations(steps: Step[]): number {
  if (!steps) return 0;
  return steps.reduce((sum, step) => sum + (step.duration_days || 0), 0);
}

function calculateAverageDays(steps: Step[]): number {
  if (!steps || steps.length === 0) return 0;
  return calculateDaysAtDestinations(steps) / steps.length;
}

export function StatsPanel() {
  const COLORS = useColors();
  const { currentTrip, steps, setShowPhotoGallery, setShowRecommendations, setRecommendationLocation } = useTripContext();
  const [showStatsDetails, setShowStatsDetails] = useState(false);

  const totalDaysTravelled = useMemo(() => calculateTotalDays(steps), [steps]);
  const tripDurationDays = useMemo(() => calculateTripDuration(currentTrip), [currentTrip]);
  const totalDaysAtDestinations = useMemo(() => calculateDaysAtDestinations(steps), [steps]);
  const averageDaysPerLocation = useMemo(() => calculateAverageDays(steps), [steps]);
  const totalDistance = useMemo(() => calculateTotalDistance(steps), [steps]);

  if (!currentTrip || steps.length === 0) return null;

  return (
    <div
      className="stats-panel"
      style={{
        position: "fixed",
        top: 90, right: 16, left: "auto", bottom: 24,
        width: 380, maxWidth: "calc(100vw - 48px)",
        background: COLORS.cardBg, borderRadius: 20, padding: 24,
        boxShadow: `0 12px 40px ${COLORS.shadowHeavy}`,
        backdropFilter: "saturate(180%) blur(20px)",
        zIndex: 70, pointerEvents: "auto",
        overflowY: "auto", overflowX: "hidden",
        borderTop: `1px solid ${COLORS.separator}`,
        transition: "opacity 0.25s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        opacity: 1, transform: "translateX(0)",
      }}
    >
      {/* Ask Questions Button */}
      <button
        onClick={() => {
          const firstStep = steps[0];
          if (firstStep?.lat && firstStep?.lng) {
            setRecommendationLocation({
              name: firstStep.location_name || "Current Location",
              lat: firstStep.lat,
              lng: firstStep.lng,
            });
            setShowRecommendations(true);
          } else {
            alert("Please add at least one location to your trip first");
          }
        }}
        style={{
          width: "100%", marginBottom: 20, padding: "12px 16px",
          background: `linear-gradient(135deg, ${COLORS.secondary} 0%, ${COLORS.secondary}dd 100%)`,
          color: "white", border: "none", borderRadius: 10,
          fontSize: 14, fontWeight: 600, letterSpacing: "-0.3px",
          cursor: "pointer", transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "0 4px 12px rgba(6, 182, 212, 0.2)",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.boxShadow = "0 6px 16px rgba(6, 182, 212, 0.3)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(6, 182, 212, 0.2)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        Ask Questions
      </button>

      <h3 style={{
        fontSize: 13, fontWeight: 600, letterSpacing: "0.5px",
        color: COLORS.textSecondary, margin: "0 0 16px 0", textTransform: "uppercase",
      }}>
        Trip Statistics
      </h3>
      <TripStatistics
        trip={currentTrip}
        totalDaysTravelled={totalDaysTravelled}
        tripDurationDays={tripDurationDays}
        totalDaysAtDestinations={totalDaysAtDestinations}
        locationCount={steps.length}
        averageDaysPerLocation={averageDaysPerLocation}
        totalDistance={totalDistance}
      />

      {/* Toggle for detailed analytics */}
      <div style={{ marginTop: 16, borderTop: `1px solid ${COLORS.separator}`, paddingTop: 16 }}>
        <button
          onClick={() => setShowStatsDetails((v) => !v)}
          style={{
            width: "100%", padding: "8px 0", background: "transparent",
            border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500,
            color: COLORS.textSecondary, display: "flex", alignItems: "center",
            justifyContent: "center", gap: 6, transition: "opacity 0.15s ease", opacity: 0.7,
          }}
          onMouseOver={(e) => { e.currentTarget.style.opacity = "1"; }}
          onMouseOut={(e) => { e.currentTarget.style.opacity = "0.7"; }}
        >
          {showStatsDetails ? "▲ Less" : "▼ More details"}
        </button>
      </div>

      {showStatsDetails && (
        <>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{
              fontSize: 13, fontWeight: 600, letterSpacing: "0.5px",
              color: COLORS.textSecondary, margin: "0 0 16px 0", textTransform: "uppercase",
            }}>
              Detailed Analytics
            </h3>
            <EnhancedStatistics
              steps={steps}
              totalDistance={totalDistance}
              tripDurationDays={tripDurationDays}
              totalDaysTravelled={totalDaysTravelled}
            />
          </div>

          {/* Step Timeline */}
          {steps.length > 0 && (
            <div style={{ marginTop: 20, borderTop: `1px solid ${COLORS.separator}`, paddingTop: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.5px", color: COLORS.textSecondary, margin: "0 0 12px 0", textTransform: "uppercase" }}>
                Timeline ({steps.length} stop{steps.length !== 1 ? "s" : ""})
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {steps.map((step, i) => (
                  <div key={step.id} style={{ display: "flex", gap: 12, position: "relative" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20, flexShrink: 0 }}>
                      <div style={{
                        width: 10, height: 10, borderRadius: "50%",
                        background: i === 0 ? COLORS.primary : COLORS.secondary,
                        border: `2px solid ${COLORS.surface}`,
                        boxShadow: `0 0 0 2px ${i === 0 ? COLORS.primary : COLORS.secondary}40`,
                        zIndex: 1,
                      }} />
                      {i < steps.length - 1 && (
                        <div style={{ width: 2, flex: 1, background: `${COLORS.textSecondary}30`, marginTop: 2, marginBottom: 2 }} />
                      )}
                    </div>
                    <div style={{ paddingBottom: 16, flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {step.location_name || `Stop ${i + 1}`}
                      </div>
                      <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
                        {new Date(step.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        {step.duration_days ? ` · ${step.duration_days}d` : ""}
                      </div>
                      {step.note && (
                        <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 4, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
                          {step.note}
                        </div>
                      )}
                      {step.image_url && (
                        <img src={step.image_url} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", marginTop: 6 }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Photo Gallery Button */}
      {steps.some((s) => s.image_url) && (
        <button
          onClick={() => setShowPhotoGallery(true)}
          style={{
            width: "100%", marginTop: 20, padding: "12px 16px",
            background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
            color: "white", border: "none", borderRadius: 10,
            fontSize: 14, fontWeight: 600, letterSpacing: "-0.3px",
            cursor: "pointer", transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 4px 12px rgba(91, 108, 240, 0.25)",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(91, 108, 240, 0.35)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(91, 108, 240, 0.25)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          View Photo Gallery
        </button>
      )}
    </div>
  );
}
