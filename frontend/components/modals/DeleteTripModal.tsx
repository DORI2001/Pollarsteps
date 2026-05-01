"use client";

import React from "react";
import { useColors } from "@/lib/theme";
import { ModalShell } from "./ModalShell";

interface DeleteTripModalProps {
  tripTitle: string;
  onClose: () => void;
  onDelete: () => Promise<void>;
}

export function DeleteTripModal({ tripTitle, onClose, onDelete }: DeleteTripModalProps) {
  const COLORS = useColors();

  const handleDelete = async () => {
    try {
      await onDelete();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Failed to delete trip: ${msg}`);
    }
  };

  return (
    <ModalShell onClose={onClose} maxWidth={380}>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: COLORS.error, margin: "0 0 8px 0" }}>Delete Trip?</h2>
      <p style={{ fontSize: 15, color: COLORS.textSecondary, margin: "0 0 28px 0", lineHeight: 1.5 }}>
        Are you sure you want to delete &quot;{tripTitle}&quot;? This action cannot be undone.
      </p>

      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={onClose}
          style={{ flex: 1, padding: 12, borderRadius: 12, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.text, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
          Cancel
        </button>
        <button onClick={handleDelete}
          style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", background: COLORS.error, color: "white", cursor: "pointer", fontWeight: 600, fontSize: 14 }}
          onMouseOver={(e) => { e.currentTarget.style.opacity = "0.9"; }}
          onMouseOut={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
          Delete
        </button>
      </div>
    </ModalShell>
  );
}
