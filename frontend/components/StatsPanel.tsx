"use client";

import React, { useState, useMemo } from "react";
import { useColors } from "@/lib/theme";
import { radii } from "@/lib/design-tokens";
import { Trip, Step } from "@/lib/types";
import { useCurrentTrip } from "@/hooks/useCurrentTrip";
import { useTripUI } from "@/hooks/useTripUI";

// ─── TripStatistics (only used here) ─────────────────────────────────────────

interface TripStatisticsProps {
  trip: Trip;
  totalDaysTravelled: number;
  tripDurationDays: number;
  totalDaysAtDestinations: number;
  locationCount: number;
  averageDaysPerLocation: number;
  totalDistance: number;
}

const TripStatistics = React.memo(function TripStatistics({
  totalDaysTravelled, tripDurationDays, totalDaysAtDestinations,
  locationCount, averageDaysPerLocation, totalDistance,
}: TripStatisticsProps) {
  const COLORS = useColors();
  const stats = [
    { icon: "🌍", label: "Locations", value: locationCount, unit: locationCount === 1 ? "place" : "places" },
    { icon: "📅", label: "Total Days", value: totalDaysTravelled, unit: totalDaysTravelled === 1 ? "day" : "days" },
    { icon: "⏱️", label: "Trip Duration", value: tripDurationDays, unit: tripDurationDays === 1 ? "day" : "days" },
    { icon: "📌", label: "Days at Dests", value: totalDaysAtDestinations, unit: totalDaysAtDestinations === 1 ? "day" : "days" },
    { icon: "📊", label: "Avg per Location", value: averageDaysPerLocation.toFixed(1), unit: "days" },
    { icon: "🛤️", label: "Distance", value: totalDistance.toFixed(0), unit: "km" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", padding: "12px", background: COLORS.surface, borderRadius: "8px", border: `1px solid ${COLORS.border}` }}>
      {stats.map((stat, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "12px", background: COLORS.background, borderRadius: "6px", transition: "all 0.2s ease", cursor: "default" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = COLORS.border; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = COLORS.background; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
        >
          <div style={{ fontSize: "24px", marginBottom: "6px" }}>{stat.icon}</div>
          <div style={{ fontSize: "11px", color: COLORS.textSecondary, marginBottom: "4px" }}>{stat.label}</div>
          <div style={{ fontSize: "18px", fontWeight: 600, color: COLORS.text, marginBottom: "2px" }}>{stat.value}</div>
          <div style={{ fontSize: "10px", color: COLORS.textSecondary }}>{stat.unit}</div>
        </div>
      ))}
    </div>
  );
});

// ─── EnhancedStatistics (only used here) ─────────────────────────────────────

interface LocationStats { name: string; days: number; visits: number; }

interface EnhancedStatsProps {
  steps: Step[];
  totalDistance: number;
  tripDurationDays: number;
  totalDaysTravelled: number;
}

function EnhancedStatistics({ steps, totalDistance, tripDurationDays, totalDaysTravelled }: EnhancedStatsProps) {
  const COLORS = useColors();
  const stats = useMemo(() => {
    const avgDailyDistance = totalDaysTravelled > 0 ? totalDistance / totalDaysTravelled : 0;
    const daysRested = tripDurationDays - totalDaysTravelled;
    const travelFrequency = tripDurationDays > 0 ? ((totalDaysTravelled / tripDurationDays) * 100).toFixed(1) : "0";
    const locationMap = new Map<string, LocationStats>();
    steps.forEach((step) => {
      const name = step.location_name || `Stop ${steps.indexOf(step) + 1}`;
      const days = step.duration_days || 0;
      const existing = locationMap.get(name);
      if (existing) { existing.days += days; existing.visits += 1; }
      else { locationMap.set(name, { name, days, visits: 1 }); }
    });
    const topLocations = Array.from(locationMap.values()).sort((a, b) => b.days - a.days).slice(0, 3);
    return { avgDailyDistance: avgDailyDistance.toFixed(1), daysRested, travelFrequency, topLocations };
  }, [steps, totalDistance, tripDurationDays, totalDaysTravelled]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: 12, background: COLORS.surface, borderRadius: 8, border: `1px solid ${COLORS.border}`, maxHeight: "400px", overflowY: "auto" }}>
      <div style={{ background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`, borderRadius: 8, padding: 16, color: "white", gridColumn: "1 / -1" }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, opacity: 0.9 }}>📊 Trip Summary</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[["km/day", stats.avgDailyDistance], ["days rest", stats.daysRested], ["active days", `${stats.travelFrequency}%`], ["locations", steps.length]].map(([label, val]) => (
            <div key={String(label)} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{val}</div>
              <div style={{ fontSize: 10, opacity: 0.85 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ gridColumn: "1 / -1", background: COLORS.background, borderRadius: 8, padding: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: COLORS.text }}>🏆 Top Locations</div>
        {stats.topLocations.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {stats.topLocations.map((loc, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 10, background: COLORS.surface, borderRadius: 6, borderLeft: `3px solid ${i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : "#CD7F32"}` }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>{i + 1}. {loc.name}</div>
                  <div style={{ fontSize: 10, color: COLORS.textSecondary }}>{loc.visits} visit{loc.visits !== 1 ? "s" : ""}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.primary }}>{loc.days} day{loc.days !== 1 ? "s" : ""}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: COLORS.textSecondary, textAlign: "center", padding: 12 }}>No location data yet</div>
        )}
      </div>
    </div>
  );
}

export function StatsPanel() {
  const COLORS = useColors();
  const { currentTrip, steps } = useCurrentTrip();
  const { setShowPhotoGallery, setShowRecommendations, setRecommendationLocation } = useTripUI();
  const [showStatsDetails, setShowStatsDetails] = useState(false);

  if (!currentTrip || steps.length === 0) return null;

  const totalDaysTravelled = currentTrip.total_days_travelled ?? 0;
  const tripDurationDays = currentTrip.trip_duration_days ?? 0;
  const totalDaysAtDestinations = currentTrip.total_days_at_destinations ?? 0;
  const averageDaysPerLocation = currentTrip.average_days_per_location ?? 0;
  const totalDistance = currentTrip.total_distance ?? 0;

  return (
    <div
      className="stats-panel"
      style={{
        position: "fixed",
        top: 90, right: 16, left: "auto", bottom: 24,
        width: 380, maxWidth: "calc(100vw - 48px)",
        background: COLORS.cardBg, borderRadius: radii["3xl"], padding: 24,
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
