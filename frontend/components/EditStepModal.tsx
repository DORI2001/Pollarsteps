"use client";

import React, { useState } from "react";

const COLORS = {
  primary: "#667eea",
  primaryDark: "#764ba2",
  secondary: "#5AC8FA",
  background: "#F5F5F7",
  surface: "#FFFFFF",
  text: "#1D1D1D",
  textSecondary: "#86868B",
  border: "#E5E5EA",
  success: "#34C759",
  error: "#FF3B30",
};

interface EditStepModalProps {
  step: any;
  onClose: () => void;
  onSubmit: (updates: any) => Promise<void>;
}

export function EditStepModal({ step, onClose, onSubmit }: EditStepModalProps) {
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
    } catch (err: any) {
      setError(err.message || "Failed to update step");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}>
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .modal-content { animation: slideUp 0.3s ease-out; }
      `}</style>

      <div className="modal-content" style={{ background: COLORS.surface, borderRadius: 20, padding: 32, boxShadow: "0 25px 50px rgba(0, 0, 0, 0.15)", maxWidth: 400, width: "90%" }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.text, margin: "0 0 20px 0" }}>Edit Location</h2>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>Place Name</label>
          <input
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              fontSize: 14,
              fontFamily: "inherit",
              boxSizing: "border-box",
              background: COLORS.background,
            }}
            disabled={loading}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>Memory/Note</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              fontSize: 14,
              fontFamily: "inherit",
              boxSizing: "border-box",
              background: COLORS.background,
              minHeight: "80px",
              resize: "vertical",
            }}
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
            style={{
              width: "100%",
              padding: "10px 12px",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              fontSize: 14,
              fontFamily: "inherit",
              boxSizing: "border-box",
              background: COLORS.background,
            }}
            disabled={loading}
          />
        </div>

        {error && <div style={{ padding: 12, background: "#FFE5E5", color: COLORS.error, borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1,
              padding: "12px 16px",
              background: COLORS.background,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              color: COLORS.text,
              transition: "all 0.2s",
              opacity: loading ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              flex: 1,
              padding: "12px 16px",
              background: COLORS.primary,
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              color: "white",
              transition: "all 0.2s",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
