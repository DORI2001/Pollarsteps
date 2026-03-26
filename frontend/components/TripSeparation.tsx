"use client";

import React, { useState } from "react";

const COLORS = {
  primary: "#667eea",
  primaryDark: "#764ba2",
  background: "#F5F5F7",
  surface: "#FFFFFF",
  text: "#1D1D1D",
  textSecondary: "#86868B",
  border: "#E5E5EA",
  success: "#34C759",
  warning: "#FF9500",
};

interface Step {
  id: string;
  timestamp: string;
  note?: string;
  lat: number;
  lng: number;
}

interface TripSeparationPoint {
  stepIndex: number;
  daysGap: number;
  beforeSteps: number;
  afterSteps: number;
}

interface TripSeparationProps {
  steps: Step[];
  tripTitle: string;
  onSplitTrip?: (newTripTitle: string, stepsToMove: Step[]) => Promise<void>;
  gapThresholdDays?: number;
}

export function TripSeparation({
  steps,
  tripTitle,
  onSplitTrip,
  gapThresholdDays = 7,
}: TripSeparationProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSplitPoint, setSelectedSplitPoint] = useState<number | null>(null);
  const [newTripName, setNewTripName] = useState("");
  const [splitting, setSplitting] = useState(false);

  // Detect potential split points based on time gaps
  const detectSplitPoints = (): TripSeparationPoint[] => {
    if (!steps || steps.length < 2) return [];

    const splitPoints: TripSeparationPoint[] = [];

    for (let i = 1; i < steps.length; i++) {
      const prevTime = new Date(steps[i - 1].timestamp).getTime();
      const currTime = new Date(steps[i].timestamp).getTime();
      const gapMs = currTime - prevTime;
      const gapDays = gapMs / (1000 * 60 * 60 * 24);

      if (gapDays >= gapThresholdDays) {
        splitPoints.push({
          stepIndex: i,
          daysGap: Math.round(gapDays),
          beforeSteps: i,
          afterSteps: steps.length - i,
        });
      }
    }

    return splitPoints;
  };

  const splitPoints = detectSplitPoints();

  const handleSplit = async () => {
    if (selectedSplitPoint === null || !onSplitTrip || !newTripName.trim()) {
      alert("Please select a split point and enter a trip name");
      return;
    }

    setSplitting(true);
    try {
      const stepsToMove = steps.slice(selectedSplitPoint);
      await onSplitTrip(newTripName, stepsToMove);
      setSelectedSplitPoint(null);
      setNewTripName("");
      setShowSuggestions(false);
    } catch (error) {
      alert("Failed to split trip");
    } finally {
      setSplitting(false);
    }
  };

  if (splitPoints.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 90,
        right: 24,
        width: 360,
        maxWidth: "calc(100vw - 48px)",
        background: COLORS.surface,
        borderRadius: 12,
        border: `2px solid ${COLORS.warning}`,
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
        zIndex: 40,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${COLORS.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>⚡</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>
              Trip Separation Detected
            </div>
            <div style={{ fontSize: 11, color: COLORS.textSecondary }}>
              Found {splitPoints.length} potential split{splitPoints.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowSuggestions(!showSuggestions)}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: 16,
          }}
        >
          {showSuggestions ? "⌃" : "⌄"}
        </button>
      </div>

      {/* Suggestions */}
      {showSuggestions && (
        <div style={{ padding: "16px 20px", maxHeight: "400px", overflowY: "auto" }}>
          {splitPoints.map((point, index) => {
            const beforeDate = new Date(steps[point.stepIndex - 1].timestamp);
            const afterDate = new Date(steps[point.stepIndex].timestamp);
            const beforeNote = steps[point.stepIndex - 1].note || `Stop ${point.stepIndex}`;
            const afterNote = steps[point.stepIndex].note || `Stop ${point.stepIndex + 1}`;

            return (
              <div
                key={index}
                onClick={() => setSelectedSplitPoint(point.stepIndex)}
                style={{
                  padding: "12px",
                  marginBottom: index < splitPoints.length - 1 ? 12 : 0,
                  borderRadius: 8,
                  background:
                    selectedSplitPoint === point.stepIndex
                      ? "rgba(102, 126, 234, 0.1)"
                      : COLORS.background,
                  border:
                    selectedSplitPoint === point.stepIndex
                      ? `2px solid ${COLORS.primary}`
                      : `1px solid ${COLORS.border}`,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  if (selectedSplitPoint !== point.stepIndex) {
                    (e.currentTarget as HTMLDivElement).style.background =
                      "rgba(102, 126, 234, 0.05)";
                  }
                }}
                onMouseOut={(e) => {
                  if (selectedSplitPoint !== point.stepIndex) {
                    (e.currentTarget as HTMLDivElement).style.background = COLORS.background;
                  }
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>
                  Split {index + 1}: {point.daysGap} day gap
                </div>
                <div style={{ fontSize: 10, color: COLORS.textSecondary, lineHeight: 1.4 }}>
                  <div>
                    Last: {beforeNote} ({beforeDate.toLocaleDateString()})
                  </div>
                  <div style={{ marginTop: 4 }}>
                    First: {afterNote} ({afterDate.toLocaleDateString()})
                  </div>
                  <div style={{ marginTop: 6, fontSize: 9, color: COLORS.warning }}>
                    → {point.beforeSteps} locations before, {point.afterSteps} after
                  </div>
                </div>
              </div>
            );
          })}

          {/* New Trip Name Input */}
          {selectedSplitPoint !== null && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>
                New Trip Title
              </label>
              <input
                type="text"
                placeholder="e.g., Europe - Part 2"
                value={newTripName}
                onChange={(e) => setNewTripName(e.target.value)}
                disabled={splitting}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: `1px solid ${COLORS.border}`,
                  fontSize: 12,
                  boxSizing: "border-box",
                  marginBottom: 10,
                  opacity: splitting ? 0.6 : 1,
                }}
              />

              <button
                onClick={handleSplit}
                disabled={splitting || !newTripName.trim()}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: 6,
                  border: "none",
                  background: COLORS.primary,
                  color: "white",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: splitting || !newTripName.trim() ? "not-allowed" : "pointer",
                  opacity: splitting || !newTripName.trim() ? 0.6 : 1,
                }}
              >
                {splitting ? "Splitting..." : "Split Trip"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
