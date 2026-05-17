"use client";

import React, { useState } from "react";
import { useColors } from "@/lib/theme";
import { extractApiError } from "@/lib/errors";
import { ModalShell } from "@/components/modals/ModalShell";

interface EditStepModalProps {
  step: any;
  onClose: () => void;
  onSubmit: (updates: any) => Promise<void>;
}

export function EditStepModal({ step, onClose, onSubmit }: EditStepModalProps) {
  const COLORS = useColors();
  const [locationName, setLocationName] = useState(step.location_name || "");
  const [note, setNote] = useState(step.note || "");
  const [durationDays, setDurationDays] = useState(step.duration_days || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      await onSubmit({
        location_name: locationName.trim() || null,
        note: note.trim() || null,
        duration_days: durationDays > 0 ? durationDays : null,
      });
      onClose();
    } catch (err) {
      setError(extractApiError(err, "Failed to update step"));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "inherit",
    boxSizing: "border-box",
    background: COLORS.background,
  };

  return (
    <ModalShell onClose={onClose} maxWidth={400}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.text, margin: "0 0 20px 0" }}>Edit Location</h2>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>Place Name</label>
        <input
          type="text"
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          style={inputStyle}
          disabled={loading}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>Memory/Note</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
          disabled={loading}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>Days Spent (Optional)</label>
        <input
          type="number"
          value={durationDays}
          onChange={(e) => setDurationDays(parseInt(e.target.value) || 0)}
          min="0"
          style={inputStyle}
          disabled={loading}
        />
      </div>

      {error && <div style={{ padding: 12, background: "#FFE5E5", color: COLORS.error, borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}

      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={onClose}
          disabled={loading}
          style={{ flex: 1, padding: "12px 16px", background: COLORS.background, border: `1px solid ${COLORS.border}`, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", color: COLORS.text, transition: "all 0.2s", opacity: loading ? 0.5 : 1 }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ flex: 1, padding: "12px 16px", background: COLORS.primary, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", color: "white", transition: "all 0.2s", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </ModalShell>
  );
}
