"use client";

import React, { useState } from "react";
import { useColors } from "@/lib/theme";
import { ModalShell } from "./ModalShell";
import { Trip } from "@/lib/types";

interface EditTripModalProps {
  trip: Trip;
  onClose: () => void;
  onSave: (updated: Trip) => void;
}

export function EditTripModal({ trip, onClose, onSave }: EditTripModalProps) {
  const COLORS = useColors();
  const [title, setTitle] = useState(trip.title || "");
  const [desc, setDesc] = useState(trip.description || "");
  const [startDate, setStartDate] = useState(trip.start_date || "");
  const [endDate, setEndDate] = useState(trip.end_date || "");
  const [saving, setSaving] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: 12,
    border: `1px solid ${COLORS.border}`, background: COLORS.inputBg,
    color: COLORS.text, fontSize: 14, boxSizing: "border-box",
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      onSave({ ...trip, title, description: desc, start_date: startDate || undefined, end_date: endDate || undefined });
      onClose();
    } catch {
      alert("Failed to update trip");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell onClose={onClose}>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: COLORS.text, margin: "0 0 6px 0" }}>Edit Trip</h2>
      <p style={{ fontSize: 13, color: COLORS.textSecondary, margin: "0 0 24px 0" }}>Update your trip details</p>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: COLORS.text }}>Title</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: COLORS.text }}>Description</label>
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)}
          style={{ ...inputStyle, minHeight: 72, resize: "none", fontFamily: "inherit" }} />
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: COLORS.text }}>Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: COLORS.text }}>End Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={onClose} disabled={saving}
          style={{ flex: 1, padding: 12, borderRadius: 12, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.text, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving || !title.trim()}
          style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", background: COLORS.primary, color: "white", cursor: saving ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 14, opacity: saving ? 0.6 : 1 }}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </ModalShell>
  );
}
