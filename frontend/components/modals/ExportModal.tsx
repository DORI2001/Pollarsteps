"use client";

import React from "react";
import { useColors } from "@/lib/theme";
import { ModalShell } from "./ModalShell";
import { Trip } from "@/lib/types";
import { exportTrip, ExportFormat } from "@/lib/export";

interface ExportModalProps {
  trip: Trip;
  onClose: () => void;
}

const FORMATS: ExportFormat[] = ["json", "csv", "geojson", "gpx"];

export function ExportModal({ trip, onClose }: ExportModalProps) {
  const COLORS = useColors();

  const handleExport = (format: ExportFormat) => {
    try {
      exportTrip(trip, format);
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
