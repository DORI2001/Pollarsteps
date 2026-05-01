"use client";

import React, { useState } from "react";
import { useColors } from "@/lib/theme";
import { ModalShell } from "./ModalShell";
import { api, session as authSession } from "@/lib/api";

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const COLORS = useColors();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: 12,
    border: `1px solid ${COLORS.border}`, background: COLORS.inputBg,
    color: COLORS.text, fontSize: 14, boxSizing: "border-box",
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw) { setMsg("Both fields are required"); return; }
    if (newPw.length < 6) { setMsg("New password must be at least 6 characters"); return; }
    const token = authSession.getToken();
    if (!token) return;
    setSaving(true);
    setMsg("");
    try {
      await api.changePassword(token, currentPw, newPw);
      setMsg("Password changed successfully!");
      setCurrentPw("");
      setNewPw("");
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const isSuccess = msg.includes("success");

  return (
    <ModalShell onClose={onClose} maxWidth={380}>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: COLORS.text, margin: "0 0 6px 0" }}>Settings</h2>
      <p style={{ fontSize: 13, color: COLORS.textSecondary, margin: "0 0 24px 0" }}>Change your password</p>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: COLORS.text }}>Current Password</label>
        <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)}
          placeholder="Enter current password" style={inputStyle} />
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: COLORS.text }}>New Password</label>
        <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)}
          placeholder="At least 6 characters" style={inputStyle} />
      </div>

      {msg && (
        <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 10, background: isSuccess ? `${COLORS.success}20` : `${COLORS.error}15`, color: isSuccess ? COLORS.success : COLORS.error, fontSize: 13 }}>
          {msg}
        </div>
      )}

      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={onClose}
          style={{ flex: 1, padding: 12, borderRadius: 12, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.text, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
          Close
        </button>
        <button onClick={handleChangePassword} disabled={saving}
          style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", background: COLORS.primary, color: "white", cursor: saving ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 14, opacity: saving ? 0.6 : 1 }}>
          {saving ? "Saving..." : "Change Password"}
        </button>
      </div>
    </ModalShell>
  );
}
