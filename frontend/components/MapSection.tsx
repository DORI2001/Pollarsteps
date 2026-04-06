"use client";

import React from "react";
import { useColors } from "@/lib/theme";
import { TripViewer } from "@/components/TripViewer";
import { session } from "@/lib/api";
import { useTripContext } from "@/providers/TripProvider";

export function MapSection() {
  const COLORS = useColors();
  const {
    currentTrip, steps, loading,
    handleMapClick, handleStepsChange,
    mapFitCounter, centerLocation,
  } = useTripContext();

  return (
    <div
      className="map-container"
      style={{
        position: "absolute",
        top: "70px", left: 0,
        right: steps.length > 0 ? "420px" : 0,
        bottom: 0, zIndex: 0,
        transition: "right 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <TripViewer
        steps={steps}
        onMapClick={handleMapClick}
        tripId={currentTrip?.id}
        token={session.getToken() ?? undefined}
        onStepsChange={handleStepsChange}
        fitTrigger={mapFitCounter}
        centerLocation={centerLocation}
      />

      {/* Empty state — no trips at all */}
      {!currentTrip && !loading && (
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)", zIndex: 10,
          background: COLORS.cardBg, backdropFilter: "saturate(180%) blur(20px)",
          borderRadius: 20, padding: "32px 40px", textAlign: "center",
          boxShadow: `0 12px 40px ${COLORS.shadowHeavy}`,
          border: `1px solid ${COLORS.border}`, maxWidth: 320, pointerEvents: "none",
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✈️</div>
          <div style={{ fontSize: 17, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>No trips yet</div>
          <div style={{ fontSize: 14, color: COLORS.textSecondary, lineHeight: 1.5 }}>
            Create your first trip above to start tracking your adventures
          </div>
        </div>
      )}

      {/* Empty state — trip selected but no steps */}
      {currentTrip && steps.length === 0 && !loading && (
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)", zIndex: 10,
          background: COLORS.cardBg, backdropFilter: "saturate(180%) blur(20px)",
          borderRadius: 20, padding: "32px 40px", textAlign: "center",
          boxShadow: `0 12px 40px ${COLORS.shadowHeavy}`,
          border: `1px solid ${COLORS.border}`, maxWidth: 320, pointerEvents: "none",
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🗺️</div>
          <div style={{ fontSize: 17, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>No stops yet</div>
          <div style={{ fontSize: 14, color: COLORS.textSecondary, lineHeight: 1.5 }}>
            Click anywhere on the map to drop your first memory
          </div>
        </div>
      )}
    </div>
  );
}
