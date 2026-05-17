import React from "react";

interface Colors {
  border: string;
  inputBg: string;
  text: string;
  background: string;
}

export function makeInputStyle(
  COLORS: Colors,
  disabled = false
): React.CSSProperties {
  return {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.inputBg,
    color: COLORS.text,
    fontSize: 14,
    boxSizing: "border-box",
    transition: "all 0.2s",
    opacity: disabled ? 0.6 : 1,
  };
}
