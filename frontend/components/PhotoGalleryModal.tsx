"use client";

import React from "react";
import { useColors } from "@/lib/theme";
import { PhotoGallery } from "@/components/PhotoGallery";
import { useTripContext } from "@/providers/TripProvider";

export function PhotoGalleryModal() {
  const COLORS = useColors();
  const { currentTrip, steps, showPhotoGallery, setShowPhotoGallery } = useTripContext();

  if (!showPhotoGallery) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.5)",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", zIndex: 500, padding: 20,
        overflowY: "auto", backdropFilter: "blur(12px)",
      }}
      onClick={() => setShowPhotoGallery(false)}
    >
      <div
        style={{
          background: COLORS.surfaceElevated, borderRadius: 24, padding: 28,
          maxWidth: "95vw", maxHeight: "95vh", overflowY: "auto",
          boxShadow: `0 20px 60px ${COLORS.shadowHeavy}`,
          borderTop: `1px solid ${COLORS.separator}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.4px", color: COLORS.text, margin: 0 }}>
            {currentTrip?.title} - Photo Gallery
          </h2>
          <button
            onClick={() => setShowPhotoGallery(false)}
            style={{
              width: 40, height: 40, background: COLORS.background,
              border: `1px solid ${COLORS.separator}`, borderRadius: "50%",
              fontSize: 18, cursor: "pointer", color: COLORS.textSecondary,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = COLORS.separator;
              e.currentTarget.style.color = COLORS.text;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = COLORS.background;
              e.currentTarget.style.color = COLORS.textSecondary;
            }}
          >
            ×
          </button>
        </div>
        <PhotoGallery steps={steps} title={currentTrip?.title || "Trip"} />
      </div>
    </div>
  );
}
