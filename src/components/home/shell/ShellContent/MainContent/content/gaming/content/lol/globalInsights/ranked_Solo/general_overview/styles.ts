// Shared styles/constants for the LoL Global Insights overview

export const dividerColor = "color-mix(in oklab, var(--border), transparent 50%)" as const;

export const chipNeutralSx = {
  height: 22,
  color: "var(--foreground)",
  backgroundColor: "transparent",
  border: "none",
  fontWeight: 800,
} as const;

export const sectionLabelSx = { fontWeight: 900, color: "var(--textLight)", letterSpacing: 0.3 } as const;

export const cardSx = {
  p: 2,
  borderRadius: 2,
  border: "1px solid color-mix(in oklab, var(--border), transparent 30%)",
  backgroundColor: "var(--card)",
} as const;


