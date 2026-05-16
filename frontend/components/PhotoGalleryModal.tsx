"use client";

import React from "react";
import { useColors } from "@/lib/theme";
import { PhotoGallery } from "@/components/PhotoGallery";
import { ModalShell } from "@/components/modals/ModalShell";
import { useCurrentTrip } from "@/hooks/useCurrentTrip";
import { useTripUI } from "@/hooks/useTripUI";

export function PhotoGalleryModal() {
  const COLORS = useColors();
  const { currentTrip, steps } = useCurrentTrip();
  const { showPhotoGallery, setShowPhotoGallery } = useTripUI();

  if (!showPhotoGallery) return null;

  return (
    <ModalShell onClose={() => setShowPhotoGallery(false)} maxWidth={900} backdropBg="rgba(0,0,0,0.5)" zIndex={500}>
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
          onMouseOver={(e) => { e.currentTarget.style.background = COLORS.separator; e.currentTarget.style.color = COLORS.text; }}
          onMouseOut={(e) => { e.currentTarget.style.background = COLORS.background; e.currentTarget.style.color = COLORS.textSecondary; }}
        >
          ×
        </button>
      </div>
      <PhotoGallery steps={steps} title={currentTrip?.title || "Trip"} />
    </ModalShell>
  );
}
