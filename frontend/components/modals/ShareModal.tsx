"use client";

import React, { useState } from "react";
import { useColors } from "@/lib/theme";
import { ModalShell } from "./ModalShell";

interface ShareModalProps {
  tripTitle: string;
  shareLink: string;
  onClose: () => void;
  onRevoke: () => Promise<void>;
}

export function ShareModal({ tripTitle, shareLink, onClose, onRevoke }: ShareModalProps) {
  const COLORS = useColors();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
    } catch {
      const input = document.createElement("input");
      input.value = shareLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async () => {
    try {
      await onRevoke();
      onClose();
    } catch {
      console.error("Failed to revoke share link");
    }
  };

  return (
    <ModalShell onClose={onClose} maxWidth={460}>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: COLORS.text, margin: "0 0 8px 0" }}>Share Your Trip</h2>
      <p style={{ fontSize: 14, color: COLORS.textSecondary, margin: "0 0 24px 0", lineHeight: 1.5 }}>
        Anyone with this link can view &quot;{tripTitle}&quot; and all its locations on the map.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input type="text" readOnly value={shareLink}
          style={{ flex: 1, padding: "12px 14px", borderRadius: 12, border: `1px solid ${COLORS.border}`, background: COLORS.inputBg, color: COLORS.text, fontSize: 13, boxSizing: "border-box" }}
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <button onClick={handleCopy}
          style={{ padding: "12px 20px", borderRadius: 12, border: "none", background: copied ? COLORS.success : COLORS.primary, color: "white", cursor: "pointer", fontWeight: 600, fontSize: 13, transition: "all 0.2s", whiteSpace: "nowrap" }}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={handleRevoke}
          style={{ flex: 1, padding: 12, borderRadius: 12, border: `1px solid ${COLORS.error}`, background: "transparent", color: COLORS.error, cursor: "pointer", fontWeight: 600, fontSize: 14, transition: "all 0.2s" }}
          onMouseOver={(e) => { e.currentTarget.style.background = COLORS.error; e.currentTarget.style.color = "white"; }}
          onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = COLORS.error; }}
        >
          Revoke Link
        </button>
        <button onClick={onClose}
          style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", background: COLORS.primary, color: "white", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
          Done
        </button>
      </div>
    </ModalShell>
  );
}
