"use client";

import React from "react";
import { useColors } from "@/lib/theme";

interface ModalShellProps {
  onClose: () => void;
  maxWidth?: number;
  /** Custom backdrop background (default: semi-transparent based on theme) */
  backdropBg?: string;
  /** z-index for the overlay (default: 1000) */
  zIndex?: number;
  /** When true, removes the card shell — children render directly on the backdrop */
  fullscreen?: boolean;
  children: React.ReactNode;
}

export function ModalShell({ onClose, maxWidth = 420, backdropBg, zIndex = 1000, fullscreen = false, children }: ModalShellProps) {
  const COLORS = useColors();

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: backdropBg ?? COLORS.overlayBg,
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex, backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      {fullscreen ? (
        <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {children}
        </div>
      ) : (
        <div
          style={{
            background: COLORS.surface, borderRadius: 28, padding: 36,
            maxWidth, width: "90%",
            maxHeight: "90vh", overflowY: "auto",
            boxShadow: "0 25px 50px rgba(0,0,0,0.15)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      )}
    </div>
  );
}
