"use client";

import React from "react";
import { useColors } from "@/lib/theme";
import { Trip } from "@/lib/types";

interface TripStatisticsProps {
  trip: Trip;
  totalDaysTravelled?: number;
  tripDurationDays?: number;
  totalDaysAtDestinations?: number;
  locationCount?: number;
  averageDaysPerLocation?: number;
  totalDistance?: number;
}

const TripStatisticsContent = ({
  trip,
  totalDaysTravelled = 0,
  tripDurationDays = 0,
  totalDaysAtDestinations = 0,
  locationCount = 0,
  averageDaysPerLocation = 0,
  totalDistance = 0,
}: TripStatisticsProps) => {
  const COLORS = useColors();
  const stats = [
    {
      icon: "🌍",
      label: "Locations",
      value: locationCount,
      unit: locationCount === 1 ? "place" : "places",
    },
    {
      icon: "📅",
      label: "Total Days",
      value: totalDaysTravelled,
      unit: totalDaysTravelled === 1 ? "day" : "days",
    },
    {
      icon: "⏱️",
      label: "Trip Duration",
      value: tripDurationDays,
      unit: tripDurationDays === 1 ? "day" : "days",
    },
    {
      icon: "📌",
      label: "Days at Dests",
      value: totalDaysAtDestinations,
      unit: totalDaysAtDestinations === 1 ? "day" : "days",
    },
    {
      icon: "📊",
      label: "Avg per Location",
      value: averageDaysPerLocation.toFixed(1),
      unit: "days",
    },
    {
      icon: "🛤️",
      label: "Distance",
      value: totalDistance.toFixed(0),
      unit: "km",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: "12px",
        padding: "12px",
        background: COLORS.surface,
        borderRadius: "8px",
        border: `1px solid ${COLORS.border}`,
      }}
    >
      {stats.map((stat, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: "12px",
            background: COLORS.background,
            borderRadius: "6px",
            transition: "all 0.2s ease",
            cursor: "default",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.background = COLORS.border;
            (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.background = COLORS.background;
            (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
          }}
        >
          <div style={{ fontSize: "24px", marginBottom: "6px" }}>{stat.icon}</div>
          <div style={{ fontSize: "11px", color: COLORS.textSecondary, marginBottom: "4px" }}>
            {stat.label}
          </div>
          <div
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: COLORS.text,
              marginBottom: "2px",
            }}
          >
            {stat.value}
          </div>
          <div style={{ fontSize: "10px", color: COLORS.textSecondary }}>
            {stat.unit}
          </div>
        </div>
      ))}
    </div>
  );
};

export const TripStatistics = React.memo(TripStatisticsContent);
