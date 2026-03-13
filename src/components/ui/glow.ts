import type { SxProps, Theme } from "@mui/material/styles";

// Base pill styling with subtle outline and smooth transitions
export const glowPillBase: SxProps<Theme> = {
  borderRadius: 999,
  transition: "box-shadow .25s ease, border-color .25s ease, background .25s ease, color .25s ease",
  boxShadow: "0 0 0 1px color-mix(in oklab, var(--border), transparent 20%)",
};

// Stronger glow on hover/focus/active
export const glowHoverFocus: SxProps<Theme> = {
  "&:hover, &.Mui-focused, &:focus": {
    boxShadow:
      "0 0 0 1px color-mix(in oklab, var(--border), transparent 0%), 0 0 18px color-mix(in oklab, var(--highlight), transparent 72%)",
  },
};

// Convenience helper to merge base + hover/focus
export const glowPill = (): SxProps<Theme> => ({
  ...glowPillBase,
  ...glowHoverFocus,
});


