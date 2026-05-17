"use client";

import React, { useState } from "react";
import { useColors } from "@/lib/theme";
import { makeInputStyle } from "@/lib/inputStyle";
import { extractApiError } from "@/lib/errors";
import { ModalShell } from "./ModalShell";

interface CreateTripModalProps {
  onClose: () => void;
  onCreate: (title: string, description: string, startDate: string, endDate?: string) => Promise<void>;
}

export function CreateTripModal({ onClose, onCreate }: CreateTripModalProps) {
  const COLORS = useColors();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const inputStyle = makeInputStyle(COLORS, saving);

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Please enter a trip title"); return; }
    setSaving(true);
    setError("");
    try {
      await onCreate(title, desc, startDate, endDate || undefined);
      onClose();
    } catch (err) {
      setError(extractApiError(err, "Failed to create trip. Please make sure you are signed in."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell onClose={onClose}>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: COLORS.text, margin: "0 0 8px 0" }}>Create New Trip</h2>
      <p style={{ fontSize: 13, color: COLORS.textSecondary, margin: "0 0 24px 0" }}>Start tracking your next adventure</p>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: COLORS.text }}>Trip Title</label>
        <input type="text" placeholder="Europe 2024" value={title} onChange={(e) => setTitle(e.target.value)} disabled={saving} style={inputStyle} />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: COLORS.text }}>Description</label>
        <textarea placeholder="Tell us about this trip..." value={desc} onChange={(e) => setDesc(e.target.value)} disabled={saving}
          style={{ ...inputStyle, minHeight: 80, fontFamily: "inherit", resize: "none" }} />
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: COLORS.text }}>Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={saving} style={inputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: COLORS.text }}>End Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={saving} style={inputStyle} />
        </div>
      </div>

      {error && (
        <div style={{ padding: "10px 14px", borderRadius: 8, background: `${COLORS.error}15`, color: COLORS.error, fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={onClose} disabled={saving}
          style={{ flex: 1, padding: 12, borderRadius: 12, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.text, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
          Cancel
        </button>
        <button onClick={handleSubmit} disabled={saving}
          style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", background: COLORS.primary, color: "white", cursor: saving ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 14, opacity: saving ? 0.6 : 1 }}>
          {saving ? "Creating..." : "Create Trip"}
        </button>
      </div>
    </ModalShell>
  );
}
