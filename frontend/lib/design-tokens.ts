/**
 * Design tokens for spacing, border-radius, and shadows.
 * Adopt incrementally — a single edit here cascades everywhere.
 * Colors live in lib/theme.ts (useColors hook).
 */

export const spacing = {
  xs:  "4px",
  sm:  "8px",
  md:  "12px",
  lg:  "16px",
  xl:  "20px",
  "2xl": "24px",
  "3xl": "28px",
  "4xl": "32px",
} as const;

export const radii = {
  xs:  "4px",
  sm:  "6px",
  md:  "8px",
  lg:  "10px",
  xl:  "12px",
  "2xl": "16px",
  "3xl": "20px",
  "4xl": "28px",
} as const;

export const shadows = {
  sm:    "0 1px 4px rgba(0,0,0,0.08)",
  md:    "0 2px 12px rgba(0,0,0,0.12)",
  lg:    "0 4px 24px rgba(0,0,0,0.16)",
  xl:    "0 8px 40px rgba(0,0,0,0.20)",
  heavy: "0 12px 40px rgba(0,0,0,0.24)",
} as const;

export const zIndex = {
  map:     0,
  toolbar: 100,
  panel:   200,
  modal:   1000,
  reel:    2000,
} as const;
