'use client';

import { useContext } from 'react';
import { ThemeContext } from '@/providers/ThemeProvider';

/* ═══════════════════════════════════════════
   Apple-inspired Color System
   Clean, accessible, premium feel
   ═══════════════════════════════════════════ */

const LIGHT_COLORS = {
  // Brand
  primary: "#5B6CF0",
  primaryDark: "#7C3AED",
  secondary: "#06B6D4",

  // Surfaces
  background: "#F2F2F7",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  cardBg: "rgba(255, 255, 255, 0.88)",

  // Text
  text: "#1C1C1E",
  textSecondary: "#8E8E93",
  textTertiary: "#AEAEB2",

  // Borders & Dividers
  border: "#E5E5EA",
  separator: "#C6C6C8",

  // Inputs
  inputBg: "#F2F2F7",
  inputBorder: "#D1D1D6",
  inputFocusBg: "#FFFFFF",

  // Semantic
  success: "#34C759",
  warning: "#FF9F0A",
  error: "#FF453A",

  // Overlays
  overlayBg: "rgba(0, 0, 0, 0.4)",
  headerBg: "rgba(255, 255, 255, 0.82)",
  popupBg: "#FFFFFF",
  mapBg: "#E8E8ED",

  // Shadows (used as values, not CSS properties)
  shadowColor: "rgba(0, 0, 0, 0.08)",
  shadowHeavy: "rgba(0, 0, 0, 0.16)",
};

const DARK_COLORS = {
  // Brand
  primary: "#818CF8",
  primaryDark: "#A78BFA",
  secondary: "#22D3EE",

  // Surfaces
  background: "#000000",
  surface: "#1C1C1E",
  surfaceElevated: "#2C2C2E",
  cardBg: "rgba(44, 44, 46, 0.88)",

  // Text
  text: "#F5F5F7",
  textSecondary: "#98989D",
  textTertiary: "#636366",

  // Borders & Dividers
  border: "#38383A",
  separator: "#48484A",

  // Inputs
  inputBg: "#1C1C1E",
  inputBorder: "#48484A",
  inputFocusBg: "#2C2C2E",

  // Semantic
  success: "#30D158",
  warning: "#FFD60A",
  error: "#FF453A",

  // Overlays
  overlayBg: "rgba(0, 0, 0, 0.6)",
  headerBg: "rgba(28, 28, 30, 0.82)",
  popupBg: "#1C1C1E",
  mapBg: "#000000",

  // Shadows
  shadowColor: "rgba(0, 0, 0, 0.3)",
  shadowHeavy: "rgba(0, 0, 0, 0.5)",
};

export type ThemeColors = typeof LIGHT_COLORS;

export function useColors(): ThemeColors {
  const { isDark } = useContext(ThemeContext);
  return isDark ? DARK_COLORS : LIGHT_COLORS;
}

export { LIGHT_COLORS, DARK_COLORS };
