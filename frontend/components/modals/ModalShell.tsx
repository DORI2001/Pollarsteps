"use client";

import React from "react";
import { useColors } from "@/lib/theme";

interface ModalShellProps {
  onClose: () => void;
  maxWidth?: number;
  children: React.ReactNode;
}

export function ModalShell({ onClose, maxWidth = 420, children }: ModalShellProps) {
  const COLORS = useColors();

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: COLORS.overlayBg,
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
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
    </div>
  );
}
