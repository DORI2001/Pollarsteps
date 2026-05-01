"use client";

import React from "react";
import { useColors } from "@/lib/theme";
import { ModalShell } from "./ModalShell";
import { Trip, Step } from "@/lib/types";
import { exportAsJSON, exportAsCSV, exportAsGeoJSON, exportAsGPX, ExportTrip } from "@/lib/export";

interface ExportModalProps {
  trip: Trip;
  onClose: () => void;
}

const FORMATS = ["json", "csv", "geojson", "gpx"] as const;
type ExportFormat = typeof FORMATS[number];

function toExportTrip(trip: Trip): ExportTrip {
  return {
    id: trip.id,
    title: trip.title,
    description: trip.description,
    start_date: trip.start_date,
    steps: (trip.steps || []).map((step: Step, index: number) => ({
      id: step.id,
      lat: step.lat,
      lng: step.lng,
      timestamp: step.timestamp,
      location_name: step.location_name,
      note: step.note,
      duration_days: step.duration_days,
      index: index + 1,
    })),
    total_distance: trip.total_distance || 0,
    total_days: trip.total_days_travelled || 0,
  };
}

const exportFns: Record<ExportFormat, (t: ExportTrip) => void> = {
  json: exportAsJSON,
  csv: exportAsCSV,
  geojson: exportAsGeoJSON,
  gpx: exportAsGPX,
};

export function ExportModal({ trip, onClose }: ExportModalProps) {
  const COLORS = useColors();

  const handleExport = (format: ExportFormat) => {
    try {
      exportFns[format](toExportTrip(trip));
      onClose();
    } catch {
      alert("Failed to export trip");
    }
  };

  const btnStyle: React.CSSProperties = {
    padding: 16, borderRadius: 14, border: `1px solid ${COLORS.border}`,
    background: COLORS.background, color: COLORS.text, cursor: "pointer",
    fontWeight: 600, fontSize: 13, display: "flex", flexDirection: "column",
    alignItems: "center", gap: 8, transition: "all 0.2s",
  };

  return (
    <ModalShell onClose={onClose}>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: COLORS.text, margin: "0 0 6px 0" }}>Export Trip</h2>
      <p style={{ fontSize: 15, color: COLORS.textSecondary, margin: "0 0 24px 0" }}>
        Choose a format for &quot;{trip.title}&quot;
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        {FORMATS.map((fmt) => (
          <button key={fmt} onClick={() => handleExport(fmt)} style={btnStyle}
            onMouseOver={(e) => { e.currentTarget.style.background = COLORS.border; }}
            onMouseOut={(e) => { e.currentTarget.style.background = COLORS.background; }}
          >
            {fmt.toUpperCase()}
          </button>
        ))}
      </div>

      <button onClick={onClose}
        style={{ width: "100%", padding: 12, borderRadius: 12, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.text, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
        Done
      </button>
    </ModalShell>
  );
}
