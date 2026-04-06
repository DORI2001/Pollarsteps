"use client";

import React, { useMemo } from "react";
import { useColors } from "@/lib/theme";
import { Step } from "@/lib/types";

interface EnhancedStatsProps {
  steps: Step[];
  totalDistance: number;
  tripDurationDays: number;
  totalDaysTravelled: number;
}

interface LocationStats {
  name: string;
  days: number;
  visits: number;
}

export function EnhancedStatistics({
  steps,
  totalDistance,
  tripDurationDays,
  totalDaysTravelled,
}: EnhancedStatsProps) {
  const COLORS = useColors();
  // Calculate advanced statistics
  const stats = useMemo(() => {
    const avgDailyDistance =
      totalDaysTravelled > 0 ? totalDistance / totalDaysTravelled : 0;
    const daysRested = tripDurationDays - totalDaysTravelled;
    const travelFrequency =
      tripDurationDays > 0 ? ((totalDaysTravelled / tripDurationDays) * 100).toFixed(1) : "0";

    // Calculate location statistics
    const locationMap = new Map<string, LocationStats>();
    steps.forEach((step) => {
      const name = step.location_name || `Stop ${steps.indexOf(step) + 1}`;
      const days = step.duration_days || 0;

      if (locationMap.has(name)) {
        const existing = locationMap.get(name)!;
        existing.days += days;
        existing.visits += 1;
      } else {
        locationMap.set(name, { name, days, visits: 1 });
      }
    });

    const topLocations = Array.from(locationMap.values())
      .sort((a, b) => b.days - a.days)
      .slice(0, 3);

    return {
      avgDailyDistance: avgDailyDistance.toFixed(1),
      daysRested,
      travelFrequency,
      topLocations,
    };
  }, [steps, totalDistance, tripDurationDays, totalDaysTravelled]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
        padding: 12,
        background: COLORS.surface,
        borderRadius: 8,
        border: `1px solid ${COLORS.border}`,
        maxHeight: "400px",
        overflowY: "auto",
      }}
    >
      {/* Main metrics */}
      <div
        style={{
          background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
          borderRadius: 8,
          padding: 16,
          color: "white",
          gridColumn: "1 / -1",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, opacity: 0.9 }}>
          📊 Trip Summary
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{stats.avgDailyDistance}</div>
            <div style={{ fontSize: 10, opacity: 0.85 }}>km/day</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{stats.daysRested}</div>
            <div style={{ fontSize: 10, opacity: 0.85 }}>days rest</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{stats.travelFrequency}%</div>
            <div style={{ fontSize: 10, opacity: 0.85 }}>active days</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{steps.length}</div>
            <div style={{ fontSize: 10, opacity: 0.85 }}>locations</div>
          </div>
        </div>
      </div>

      {/* Top locations */}
      <div
        style={{
          gridColumn: "1 / -1",
          background: COLORS.background,
          borderRadius: 8,
          padding: 12,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: COLORS.text }}>
          🏆 Top Locations
        </div>
        {stats.topLocations.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {stats.topLocations.map((location, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 10,
                  background: COLORS.surface,
                  borderRadius: 6,
                  borderLeft: `3px solid ${index === 0 ? "#FFD700" : index === 1 ? "#C0C0C0" : "#CD7F32"}`,
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>
                    {index + 1}. {location.name}
                  </div>
                  <div style={{ fontSize: 10, color: COLORS.textSecondary }}>
                    {location.visits} visit{location.visits !== 1 ? "s" : ""}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: COLORS.primary,
                    textAlign: "right",
                  }}
                >
                  {location.days} day{location.days !== 1 ? "s" : ""}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: COLORS.textSecondary, textAlign: "center", padding: 12 }}>
            No location data yet
          </div>
        )}
      </div>
    </div>
  );
}
